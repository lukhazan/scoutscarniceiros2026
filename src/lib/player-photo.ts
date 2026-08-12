/** Limite de upload da FOTO ORIGINAL do atleta (25 MB). */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
/** Acima disso a foto original é otimizada (sem cortar) depois de recebida. */
const MAX_STORED_BYTES = 3.5 * 1024 * 1024;

export type PhotoAdjust = {
  /** 1 = enquadramento padrão, até 3x de aproximação */
  zoom: number;
  /** deslocamento horizontal, -100 a 100 (% do lado) */
  offsetX: number;
  /** deslocamento vertical, -100 a 100 (% do lado) */
  offsetY: number;
  /** aparar bordas: 0 a 60 (corta pixels semitransparentes da borda) */
  trim: number;
  /** suavizar bordas: 0 a 100 */
  smooth: number;
};

export const DEFAULT_ADJUST: PhotoAdjust = {
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  trim: 0,
  smooth: 0,
};

function validate(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Selecione um arquivo de imagem (PNG, JPG ou WebP).");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Imagem muito grande. Envie um arquivo de até 25 MB.");
  }
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    el.src = src;
  });
}

function applyEdgeAdjust(
  ctx: CanvasRenderingContext2D,
  size: number,
  trim: number,
  smooth: number,
) {
  if (trim <= 0 && smooth <= 0) return;
  const image = ctx.getImageData(0, 0, size, size);
  const data = image.data;
  const cut = (trim / 100) * 255;
  const soft = (smooth / 100) * 255;
  for (let i = 3; i < data.length; i += 4) {
    let a = data[i];
    if (a === 0) continue;
    if (cut > 0) {
      a = a <= cut ? 0 : ((a - cut) / (255 - cut)) * 255;
    }
    if (soft > 0 && a > 0 && a < 255) {
      // aproxima a borda de um degradê suave
      a = a * (1 - soft / 510);
    }
    data[i] = Math.max(0, Math.min(255, Math.round(a)));
  }
  ctx.putImageData(image, 0, 0);
}

async function renderSquare(
  src: string,
  size: number,
  adjust: PhotoAdjust = DEFAULT_ADJUST,
): Promise<string> {
  const img = await loadImage(src);
  const base = Math.min(img.naturalWidth, img.naturalHeight);
  const zoom = Math.max(1, adjust.zoom || 1);
  const side = base / zoom;
  const maxDX = (img.naturalWidth - side) / 2;
  const maxDY = (img.naturalHeight - side) / 2;
  const sx = maxDX + (adjust.offsetX / 100) * maxDX;
  const sy = maxDY + (adjust.offsetY / 100) * maxDY;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível processar a imagem.");
  ctx.drawImage(
    img,
    Math.max(0, sx),
    Math.max(0, sy),
    side,
    side,
    0,
    0,
    size,
    size,
  );
  applyEdgeAdjust(ctx, size, adjust.trim, adjust.smooth);

  return canvas.toDataURL("image/png");
}

function dataUrlBytes(dataUrl: string) {
  const i = dataUrl.indexOf(",");
  return Math.round(((dataUrl.length - i - 1) * 3) / 4);
}

function hasAlpha(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const { data } = ctx.getImageData(0, 0, w, h);
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 250) return true;
  }
  return false;
}

/**
 * Versão de armazenamento da FOTO ORIGINAL: mantém proporção e enquadramento
 * completos (nunca corta). A otimização acontece DEPOIS do upload e só quando
 * a imagem é maior que `maxSide` ou pesada demais para o armazenamento.
 */
export async function renderOriginalPhoto(
  sourceDataUrl: string,
  maxSide = 3200,
): Promise<string> {
  const img = await loadImage(sourceDataUrl);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const tooBig = Math.max(w, h) > maxSide;
  const tooHeavy = dataUrlBytes(sourceDataUrl) > MAX_STORED_BYTES;
  if (!tooBig && !tooHeavy) return sourceDataUrl;

  let ratio = tooBig ? maxSide / Math.max(w, h) : 1;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(w * ratio));
    canvas.height = Math.max(1, Math.round(h * ratio));
    const ctx = canvas.getContext("2d");
    if (!ctx) return sourceDataUrl;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    // PNG só quando há transparência (recorte); senão JPEG de alta qualidade.
    const transparent = hasAlpha(ctx, canvas.width, canvas.height);
    const out = transparent
      ? canvas.toDataURL("image/png")
      : canvas.toDataURL("image/jpeg", 0.95);
    if (dataUrlBytes(out) <= MAX_STORED_BYTES || ratio <= 0.35) return out;
    ratio *= 0.8;
  }
  return sourceDataUrl;
}

/** Converte um Blob em data URL (mantém transparência do PNG). */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.readAsDataURL(blob);
  });
}

/**
 * Renderiza a foto final (quadrada, 256px) aplicando os ajustes manuais
 * de enquadramento e de borda escolhidos pelo admin.
 */
export function renderAdjustedPhoto(
  sourceDataUrl: string,
  adjust: PhotoAdjust = DEFAULT_ADJUST,
  size = 256,
): Promise<string> {
  return renderSquare(sourceDataUrl, size, adjust);
}

/**
 * Remove o fundo no navegador e devolve a imagem recortada em alta
 * (data URL PNG, sem recorte quadrado) para permitir ajustes manuais.
 */
export async function fileToCutoutSourceDataUrl(file: File): Promise<string> {
  validate(file);
  const { removeBackground } = await import("@imgly/background-removal");
  const cutout = await removeBackground(file, { output: { format: "image/png" } });
  return blobToDataUrl(cutout);
}

/** Lê o arquivo original como data URL, sem remover o fundo. */
export async function fileToSourceDataUrl(file: File): Promise<string> {
  validate(file);
  return blobToDataUrl(file);
}

/**
 * Recorta em quadrado e reduz para 256px, sem remover o fundo.
 */
export async function fileToAvatarDataUrl(file: File, size = 256): Promise<string> {
  validate(file);
  const src = await blobToDataUrl(file);
  return renderSquare(src, size);
}
