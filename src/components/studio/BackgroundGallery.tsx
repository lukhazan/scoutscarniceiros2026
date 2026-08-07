import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImagePlus, Loader2, Star, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  ACCEPTED_IMAGE_TYPES,
  deleteMediaAsset,
  fileToStudioImage,
  mediaAssetsQueryOptions,
  saveMediaAsset,
} from "@/lib/studio-data";

const DEFAULT_BG_KEY = "studio:default-background";

export function readDefaultBackground() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(DEFAULT_BG_KEY);
}

type Props = {
  value: string | null;
  onChange: (url: string | null) => void;
};

/** Galeria de fundos: miniaturas, importar, excluir e definir padrão. */
export function BackgroundGallery({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [defaultUrl, setDefaultUrl] = useState<string | null>(() => readDefaultBackground());
  const { data: assets = [] } = useQuery(mediaAssetsQueryOptions);
  const backgrounds = assets.filter((a) => a.category === "fundo");

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const url = await fileToStudioImage(file, 1920);
      await saveMediaAsset({ name: file.name.slice(0, 60), category: "fundo", url });
      await queryClient.invalidateQueries({ queryKey: ["media-assets"] });
      onChange(url);
      toast.success("Fundo adicionado à biblioteca.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao carregar imagem.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete(id: string, url: string) {
    try {
      await deleteMediaAsset(id);
      await queryClient.invalidateQueries({ queryKey: ["media-assets"] });
      if (value === url) onChange(null);
      if (defaultUrl === url) {
        window.localStorage.removeItem(DEFAULT_BG_KEY);
        setDefaultUrl(null);
      }
      toast.success("Fundo removido.");
    } catch {
      toast.error("Não foi possível remover o fundo.");
    }
  }

  function setAsDefault(url: string) {
    window.localStorage.setItem(DEFAULT_BG_KEY, url);
    setDefaultUrl(url);
    toast.success("Fundo padrão definido.");
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-semibold uppercase tracking-wide">Biblioteca de fundos</Label>
        {value ? (
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => onChange(null)}>
            <X className="mr-1 size-3.5" /> Limpar
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {backgrounds.map((asset) => (
          <div
            key={asset.id}
            className={`group relative overflow-hidden rounded-lg border transition-all ${
              value === asset.url
                ? "border-primary ring-2 ring-primary/40"
                : "border-border/60 hover:border-primary/50"
            }`}
          >
            <button
              type="button"
              onClick={() => onChange(asset.url)}
              className="block w-full"
              title={asset.name}
            >
              <img src={asset.url} alt={asset.name} className="h-24 w-full object-cover" />
            </button>
            <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={() => setAsDefault(asset.url)}
                title="Definir como padrão"
                className="rounded bg-background/90 p-1"
              >
                <Star
                  className={`size-3.5 ${defaultUrl === asset.url ? "fill-primary text-primary" : ""}`}
                />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(asset.id, asset.url)}
                title="Excluir fundo"
                className="rounded bg-background/90 p-1"
              >
                <Trash2 className="size-3.5 text-destructive" />
              </button>
            </div>
            {defaultUrl === asset.url ? (
              <span className="absolute bottom-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[9px] font-semibold uppercase text-primary-foreground">
                Padrão
              </span>
            ) : null}
          </div>
        ))}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="w-full"
      >
        {busy ? (
          <Loader2 className="mr-1 size-4 animate-spin" />
        ) : (
          <ImagePlus className="mr-1 size-4" />
        )}
        Importar fundo PNG
      </Button>
      <p className="text-xs text-muted-foreground">
        O fundo é renderizado em 1080x1920 sem crop ou zoom — igual na prévia e no PNG.
      </p>
    </div>
  );
}
