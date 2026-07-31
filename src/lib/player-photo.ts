export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/**
 * Reads a PNG/JPG file, crops it to a square and downscales it to a
 * small data URL that can be stored directly with the player record.
 */
export async function fileToAvatarDataUrl(file: File, size = 256): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Selecione um arquivo de imagem (PNG ou JPG).");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Imagem muito grande. Envie um arquivo de até 8 MB.");
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Não foi possível ler a imagem."));
      el.src = url;
    });

    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - side) / 2;
    const sy = (img.naturalHeight - side) / 2;

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Não foi possível processar a imagem.");
    ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);

    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}
