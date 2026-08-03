/**
 * Salva um arquivo funcionando também em navegadores mobile (Android/iOS),
 * onde `link.href = dataUrl` costuma ser bloqueado ou apenas abre a imagem.
 */
export async function saveFile(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: blob.type });

  // iOS/Android: o compartilhamento nativo permite "Salvar imagem" / "Salvar em Arquivos".
  const nav = navigator as Navigator & {
    canShare?: (data: { files: File[] }) => boolean;
    share?: (data: { files: File[]; title?: string }) => Promise<void>;
  };
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile && nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: filename });
      return;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      // segue para o fallback de download
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 4000);
}
