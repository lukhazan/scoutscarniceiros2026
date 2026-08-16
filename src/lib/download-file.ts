/**
 * Utilitários de entrega de arquivo ao usuário.
 *
 * No celular (principalmente iOS/Safari) o download HTTP tradicional não
 * entrega o arquivo: nada aparece em Fotos/Arquivos. Por isso o
 * compartilhamento nativo precisa ser acionado DENTRO de um gesto do usuário
 * (toque no botão) — se for chamado depois de uma renderização assíncrona
 * longa, o iOS bloqueia com NotAllowedError.
 */
export type SaveResult = "shared" | "downloaded" | "opened";

export function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iPadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  return /Android|iPhone|iPad|iPod/i.test(ua) || iPadOS;
}

export function canShareFile(file: File) {
  const nav = navigator as Navigator & {
    canShare?: (data: { files: File[] }) => boolean;
    share?: (data: unknown) => Promise<void>;
  };
  return Boolean(nav.share && nav.canShare?.({ files: [file] }));
}

/** Aciona o menu nativo. Deve ser chamado a partir de um gesto do usuário. */
export async function shareFile(file: File, title?: string): Promise<"shared" | "cancelled"> {
  try {
    await navigator.share({ files: [file], title });
    return "shared";
  } catch (err) {
    if (err instanceof DOMException && (err.name === "AbortError" || err.name === "NotAllowedError"))
      return "cancelled";
    throw err;
  }
}

/** Download clássico (desktop). Retorna false quando o navegador não suporta. */
export function downloadFile(blob: Blob, filename: string): boolean {
  const link = document.createElement("a");
  if (!("download" in link)) return false;
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 4000);
  return true;
}

/** Abre o arquivo em nova aba para salvamento manual. */
export function openFile(blob: Blob): boolean {
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return Boolean(win);
}

/**
 * Fluxo genérico (usado fora da Central de Artes): tenta compartilhar no
 * celular e cai para download no desktop.
 */
export async function saveFile(blob: Blob, filename: string): Promise<SaveResult> {
  const file = new File([blob], filename, { type: blob.type });
  if (isMobileDevice() && canShareFile(file)) {
    try {
      const r = await shareFile(file, filename);
      if (r === "shared") return "shared";
    } catch {
      /* segue para o fallback */
    }
  }
  if (downloadFile(blob, filename)) return "downloaded";
  openFile(blob);
  return "opened";
}
