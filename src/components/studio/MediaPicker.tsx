import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  ACCEPTED_IMAGE_TYPES,
  fileToStudioImage,
  mediaAssetsQueryOptions,
  saveMediaAsset,
  type MediaCategory,
} from "@/lib/studio-data";

type Props = {
  label: string;
  category: MediaCategory;
  value: string | null;
  onChange: (url: string | null) => void;
  /** mostra a grade da biblioteca para escolher uma imagem já salva */
  showLibrary?: boolean;
};

export function MediaPicker({
  label,
  category,
  value,
  onChange,
  showLibrary = true,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [keepInLibrary, setKeepInLibrary] = useState(false);
  const { data: assets = [] } = useQuery(mediaAssetsQueryOptions);
  const options = assets.filter((a) => a.category === category);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const url = await fileToStudioImage(file);
      onChange(url);
      if (keepInLibrary) {
        await saveMediaAsset({ name: file.name.slice(0, 60), category, url });
        await queryClient.invalidateQueries({ queryKey: ["media-assets"] });
        toast.success("Imagem salva na biblioteca.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao carregar imagem.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-semibold uppercase tracking-wide">{label}</Label>
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={() => onChange(null)}
          >
            <X className="mr-1 size-3.5" /> Remover
          </Button>
        ) : null}
      </div>

      {value ? (
        <img
          src={value}
          alt=""
          className="h-24 w-full rounded-md border border-border/60 bg-secondary object-contain"
        />
      ) : null}

      {showLibrary && options.length > 0 ? (
        <div className="grid grid-cols-4 gap-2">
          {options.map((asset) => (
            <button
              key={asset.id}
              type="button"
              onClick={() => onChange(asset.url)}
              className={`overflow-hidden rounded-md border ${
                value === asset.url ? "border-primary" : "border-border/60"
              }`}
              title={asset.name}
            >
              <img src={asset.url} alt={asset.name} className="h-14 w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
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
        >
          {busy ? (
            <Loader2 className="mr-1 size-4 animate-spin" />
          ) : (
            <ImagePlus className="mr-1 size-4" />
          )}
          Enviar imagem
        </Button>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <Switch checked={keepInLibrary} onCheckedChange={setKeepInLibrary} />
          Salvar na biblioteca
        </label>
      </div>
    </div>
  );
}
