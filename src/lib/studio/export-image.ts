import { toCanvas } from "html-to-image";
import { STORY_HEIGHT, STORY_WIDTH } from "@/lib/studio/constants";

/** Fator de supersampling: renderiza maior e reduz com interpolação de alta qualidade. */
const SUPERSAMPLE = 2;

/**
 * Renderiza o nó de exportação (1080x1920 reais) em alta qualidade.
 *
 * O nó é rasterizado em 2x (2160x3840) para que fotos grandes sejam
 * reamostradas pelo navegador com mais informação, e só então reduzido para
 * exatamente 1080x1920 num canvas com `imageSmoothingQuality: "high"`.
 * O arquivo final é sempre PNG sem compressão destrutiva.
 */
export async function renderStoryBlob(
  node: HTMLElement,
  format: "png" | "jpg" = "png",
): Promise<Blob | null> {
  const options = {
    width: STORY_WIDTH,
    height: STORY_HEIGHT,
    pixelRatio: SUPERSAMPLE,
    cacheBust: true,
    skipFonts: false,
  };

  // Primeira passada aquece o cache de imagens/fontes (evita camadas em branco).
  await toCanvas(node, options);
  const big = await toCanvas(node, options);

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
