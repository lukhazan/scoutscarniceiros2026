import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ACCEPTED_IMAGE_TYPES,
  MEDIA_CATEGORIES,
  fileToStudioImage,
  mediaAssetsQueryOptions,
  saveMediaAsset,
  type MediaCategory,
} from "@/lib/studio-data";

export function MediaLibraryPanel() {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<MediaCategory>("fundo");
  const [busy, setBusy] = useState(false);
  const { data: assets = [], isLoading } = useQuery(mediaAssetsQueryOptions);
  const list = assets.filter((a) => a.category === category);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        const url = await fileToStudioImage(file);
        await saveMediaAsset({ name: file.name.slice(0, 60), category, url });
      }
      await queryClient.invalidateQueries({ queryKey: ["media-assets"] });
      toast.success("Imagens adicionadas.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha no envio.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("media_assets").delete().eq("id", id);
    if (error) {
      toast.error("Não foi possível excluir.");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["media-assets"] });
    toast.success("Imagem excluída.");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={category} onValueChange={(v) => setCategory(v as MediaCategory)}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MEDIA_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_IMAGE_TYPES}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <ImagePlus className="mr-2 size-4" />
          )}
          Enviar imagens
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : list.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma imagem nesta categoria ainda.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {list.map((asset) => (
            <div
              key={asset.id}
              className="overflow-hidden rounded-lg border border-border/60 bg-card"
            >
              <img
                src={asset.url}
                alt={asset.name}
                className="h-28 w-full bg-secondary object-cover"
              />
              <div className="flex items-center justify-between gap-1 p-2">
                <span className="truncate text-xs text-muted-foreground">{asset.name}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  aria-label="Excluir"
                  onClick={() => handleDelete(asset.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
