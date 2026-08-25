import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, ExternalLink, Loader2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  canShareFile,
  downloadFile,
  isMobileDevice,
  openFile,
  shareFile,
} from "@/lib/download-file";

export type ExportResult = { blob: Blob; filename: string; title?: string };

/**
 * Entrega da arte final ao usuário.
 *
 * O compartilhamento nativo é acionado por um toque direto neste diálogo —
 * requisito do iOS, que bloqueia navigator.share chamado após a renderização
 * assíncrona. Nenhuma mensagem de sucesso é exibida antes da conclusão real.
 */
export function ExportResultDialog({
  result,
  onClose,
  heading,
}: {
  result: ExportResult | null;
  onClose: () => void;
  heading?: string;
}) {
  const [busy, setBusy] = useState(false);
  const previewUrl = useMemo(
    () => (result ? URL.createObjectURL(result.blob) : null),
    [result],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const file = useMemo(
    () => (result ? new File([result.blob], result.filename, { type: result.blob.type }) : null),
    [result],
  );
  const shareable = Boolean(file && canShareFile(file));

  async function handleShare() {
    if (!file) return;
    setBusy(true);
    try {
      const r = await shareFile(file, result?.title);
      if (r === "shared") {
        toast.success("Arte enviada para o seu dispositivo.");
        onClose();
      } else {
        toast.message("Compartilhamento cancelado. A arte continua disponível aqui.");
      }
    } catch {
      toast.error(
        "Não foi possível salvar automaticamente. Tente novamente ou use a opção de abrir a imagem.",
      );
    } finally {
      setBusy(false);
    }
  }

  /**
   * "Baixar arquivo" precisa entregar a imagem AO APARELHO. No celular o
   * download HTTP não salva nada em Fotos, então abrimos o menu nativo do
   * sistema (Salvar em Fotos / Arquivos) direto no toque do usuário e só
   * usamos o download clássico como reserva.
   */
  async function handleDownload() {
    if (!result) return;
    if (file && isMobileDevice() && typeof navigator !== "undefined" && "share" in navigator) {
      setBusy(true);
      try {
        const r = await shareFile(file, result.title);
        if (r === "shared") {
          toast.success("Arte salva no seu aparelho.");
          onClose();
          return;
        }
        toast.message("Salvamento cancelado. A arte continua disponível aqui.");
        return;
      } catch {
        /* segue para o download clássico */
      } finally {
        setBusy(false);
      }
    }
    if (downloadFile(result.blob, result.filename)) {
      toast.success("Download iniciado.");
    } else if (openFile(result.blob)) {
      toast.message("Toque e segure na imagem para salvar em Fotos.");
    } else {
      toast.error("Este navegador não permite baixar. Use abrir a imagem e salve manualmente.");
    }
  }

  function handleOpen() {
    if (!result) return;
    if (openFile(result.blob)) {
      toast.message("Toque e segure na imagem para salvar em Fotos.");
    } else {
      toast.error("O navegador bloqueou a abertura. Libere pop-ups e tente novamente.");
    }
  }

  return (
    <Dialog open={Boolean(result)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{heading ?? "Arte pronta (1080 × 1920)"}</DialogTitle>
          <DialogDescription>
            Escolha onde deseja salvar ou compartilhar o arquivo.
          </DialogDescription>
        </DialogHeader>

        {previewUrl && result?.blob.type.startsWith("image/") && (
          <img
            src={previewUrl}
            alt="Pré-visualização da arte final exportada"
            className="mx-auto max-h-[45vh] w-auto rounded-lg border border-border/60"
          />
        )}

        <div className="grid gap-2">
          {shareable && (
            <Button onClick={handleShare} disabled={busy}>
              {busy ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Share2 className="mr-2 size-4" />
              )}
              Salvar / Compartilhar
            </Button>
          )}
          <Button variant={shareable ? "outline" : "default"} onClick={handleDownload}>
            <Download className="mr-2 size-4" /> Baixar arquivo
          </Button>
          <Button variant="ghost" onClick={handleOpen}>
            <ExternalLink className="mr-2 size-4" /> Abrir imagem (salvar manualmente)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
