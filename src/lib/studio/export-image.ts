import { toCanvas } from "html-to-image";
import { STORY_HEIGHT, STORY_WIDTH } from "@/lib/studio/constants";

/** Fator de supersampling: renderiza maior e reduz com interpolação de alta qualidade. */
const SUPERSAMPLE = 2;

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Garante que TODA imagem do nó de exportação esteja embutida (data URL) e
 * decodificada antes da rasterização.
 *
 * No celular (Safari/Chrome Android) o `html-to-image` frequentemente falha em
 * buscar imagens remotas/blob durante a serialização, resultando em camadas em
 * branco — normalmente a foto do atleta, que é a maior. Embutindo e decodificando
 * antes, a rasterização passa a ser 100% síncrona e completa.
 */
export async function inlineAndDecodeImages(node: HTMLElement) {
  const images = Array.from(node.querySelectorAll("img"));
  await Promise.all(
    images.map(async (img) => {
      try {
        if (!img.src.startsWith("data:")) {
          const res = await fetch(img.src, { mode: "cors", cache: "force-cache" });
          if (res.ok) {
            const blob = await res.blob();
            const dataUrl = await blobToDataUrl(blob);
            if (dataUrl.startsWith("data:image")) img.src = dataUrl;
          }
        }
      } catch {
        // mantém o src original; a decodificação abaixo ainda é tentada
      }
      img.crossOrigin = "anonymous";
      img.loading = "eager";
      img.decoding = "sync";
      if (!img.complete) {
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
      }
      try {
        await img.decode();
      } catch {
        /* ignora */
      }
    }),
  );

  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      /* ignora */
    }
  }
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null))));
}

async function rasterize(node: HTMLElement, pixelRatio: number) {
  const options = {
    width: STORY_WIDTH,
    height: STORY_HEIGHT,
    pixelRatio,
    // cacheBust força re-download das imagens (quebra cache/CORS no celular).
    cacheBust: false,
    skipFonts: false,
  };
  // Primeira passada aquece o cache interno de imagens/fontes.
  await toCanvas(node, options);
  return toCanvas(node, options);
}

/**
 * Renderiza o nó de exportação (1080x1920 reais) em alta qualidade.
 *
 * O nó é rasterizado em 2x (2160x3840) e reduzido para exatamente 1080x1920
 * com `imageSmoothingQuality: "high"`. Em dispositivos com limite de memória de
 * canvas, cai automaticamente para 1x — sem nunca simplificar a composição.
 */
export async function renderStoryBlob(
  node: HTMLElement,
  format: "png" | "jpg" = "png",
): Promise<Blob | null> {
  await inlineAndDecodeImages(node);

  let big: HTMLCanvasElement;
  try {
    big = await rasterize(node, SUPERSAMPLE);
    // Safari devolve canvas vazio quando estoura o limite de área.
    if (!big.width || !big.height) throw new Error("canvas vazio");
  } catch {
    big = await rasterize(node, 1);
  }

  const out = document.createElement("canvas");
  out.width = STORY_WIDTH;
  out.height = STORY_HEIGHT;
  const ctx = out.getContext("2d");
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Redução progressiva: preserva detalhes finos melhor que um único downscale.
  let src: HTMLCanvasElement = big;
  while (src.width >= STORY_WIDTH * 2) {
    const half = document.createElement("canvas");
    half.width = Math.max(STORY_WIDTH, Math.round(src.width / 2));
    half.height = Math.max(STORY_HEIGHT, Math.round(src.height / 2));
    const hctx = half.getContext("2d");
    if (!hctx) break;
    hctx.imageSmoothingEnabled = true;
    hctx.imageSmoothingQuality = "high";
    hctx.drawImage(src, 0, 0, half.width, half.height);
    src = half;
    if (half.width === STORY_WIDTH) break;
  }

  if (format === "jpg") {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);
  }
  ctx.drawImage(src, 0, 0, STORY_WIDTH, STORY_HEIGHT);

  return new Promise<Blob | null>((resolve) => {
    out.toBlob(
      (blob) => resolve(blob),
      format === "jpg" ? "image/jpeg" : "image/png",
      format === "jpg" ? 1 : undefined,
    );
  });
}
