import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Loader2, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScaledCanvas } from "@/lib/studio/Canvas";
import { renderStoryBlob } from "@/lib/studio/export-image";
import {
  ExportResultDialog,
  type ExportResult,
} from "@/components/studio/ExportResultDialog";
import { canShareFile, downloadFile, isMobileDevice } from "@/lib/download-file";
import { brandIdentityQueryOptions } from "@/lib/studio-data";
import { displayName, playersQueryOptions } from "@/lib/team-data";
import {
  EMPTY_ART_DATA,
  STORY_HEIGHT,
  STORY_WIDTH,
  STUDIO_TEMPLATES,
  TemplateArt,
  getTemplate,
  type ArtData,
} from "@/lib/studio/templates";
import {
  DEFAULT_EDITABLE_FIELDS,
  savedArtTemplatesQueryOptions,
  type QuickField,
  type SavedArtTemplate,
} from "@/lib/studio/saved-templates";

type QuickOption = {
  id: string;
  name: string;
  emoji: string;
  baseSlug: string;
  data: ArtData;
  editable: QuickField[];
};

/** Templates internos (GOL, CRAQUE...) continuam disponíveis no modo rápido. */
function builtinOptions(): QuickOption[] {
  return STUDIO_TEMPLATES.filter((t) => !t.fields.includes("agenda")).map((t) => ({
    id: `builtin:${t.slug}`,
    name: t.name,
    emoji: t.emoji,
    baseSlug: t.slug,
    data: { ...EMPTY_ART_DATA, ...t.defaults },
    editable: DEFAULT_EDITABLE_FIELDS,
  }));
}

function savedToOption(row: SavedArtTemplate): QuickOption {
  const base = getTemplate(row.base_slug);
  return {
    id: row.id,
    name: row.name,
    emoji: base.emoji,
    baseSlug: row.base_slug,
    data: row.art_data,
    editable: row.editable_fields,
  };
}

/**
 * Modo Arte Rápida: escolher template + atleta e exportar.
 * Nenhum controle de composição é exposto — o padrão do designer é preservado.
 */
export function QuickArtPanel() {
  const { data: players = [] } = useQuery(playersQueryOptions);
  const { data: brand = null } = useQuery(brandIdentityQueryOptions);
  const { data: saved = [], isLoading } = useQuery(savedArtTemplatesQueryOptions);

  const options = useMemo(
    () => [...saved.map(savedToOption), ...builtinOptions()],
    [saved],
  );

  const [optionId, setOptionId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [extra, setExtra] = useState<Partial<ArtData>>({});
  const [generated, setGenerated] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  const option = options.find((o) => o.id === optionId) ?? null;

  useEffect(() => {
    if (!optionId && options.length) setOptionId(options[0].id);
  }, [options, optionId]);

  useEffect(() => {
    setExtra({});
    setGenerated(false);
  }, [optionId]);

  const template = getTemplate(option?.baseSlug ?? STUDIO_TEMPLATES[0].slug);
  const player = players.find((p) => p.id === playerId) ?? null;

  const artPlayer = player
    ? {
        id: player.id,
        name: player.name,
        nickname: player.nickname,
        position: player.position,
        shirt_number: player.shirt_number,
        photo_url: player.photo_url,
        photo_original_url: player.photo_original_url,
      }
    : null;

  /**
   * Composição final: layout salvo pelo designer + conteúdo variável.
   * Posição, escala, rotação e área de encaixe da foto vêm sempre do template,
   * garantindo que todos os atletas saiam no mesmo padrão visual.
   */
  const data: ArtData = useMemo(() => {
    const base = option?.data ?? EMPTY_ART_DATA;
    const photo = player?.photo_original_url ?? player?.photo_url ?? base.playerPhotoUrl;
    return {
      ...base,
      ...extra,
      playerId: player?.id ?? base.playerId,
      playerPhotoUrl: photo ?? null,
      playerScale: base.playerScale,
      playerOffsetX: base.playerOffsetX,
      playerOffsetY: base.playerOffsetY,
      playerRotation: base.playerRotation,
    };
  }, [option, extra, player]);

  const needsPlayer = !template.fields.includes("agenda");
  const canGenerate = Boolean(option) && (!needsPlayer || Boolean(player));

  async function handleExport(format: "png" | "share") {
    if (!exportRef.current) return;
    setExporting(true);
    const toastId = toast.loading("Gerando arte...");
    try {
      const blob = await renderStoryBlob(exportRef.current, "png");
      if (!blob) {
        toast.error("Não foi possível gerar a imagem. Tente novamente.", { id: toastId });
        return;
      }
      const filename = `${(option?.name ?? template.name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")}-${Date.now()}.png`;
      const file = new File([blob], filename, { type: blob.type });

      if (format !== "share" && !isMobileDevice() && !canShareFile(file)) {
        if (downloadFile(blob, filename)) {
          toast.success("Arte baixada!", { id: toastId });
          return;
        }
      }
      toast.dismiss(toastId);
      setExportResult({ blob, filename, title: option?.name ?? template.name });
    } catch {
      toast.error("Não foi possível gerar a imagem. Tente novamente.", { id: toastId });
    } finally {
      setExporting(false);
    }
  }

  const art = <TemplateArt template={template} data={data} brand={brand} player={artPlayer} />;
  const editable = option?.editable ?? DEFAULT_EDITABLE_FIELDS;

  return (
    <div className="rounded-2xl border border-border/60 bg-card">
      <header className="flex items-center gap-3 border-b border-border/60 p-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary">
          <Wand2 className="size-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-base tracking-wide">ARTE RÁPIDA</p>
          <p className="truncate text-xs text-muted-foreground">
            Escolha o template, o atleta e exporte — o layout já vem pronto.
          </p>
        </div>
      </header>

      <div className="grid gap-4 p-3 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          <section>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              1. Escolha o template
            </p>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando…</p>
            ) : (
              <div className="space-y-2">
                {options.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setOptionId(o.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                      optionId === o.id
                        ? "border-primary bg-primary/10"
                        : "border-border/60 hover:border-primary/50"
                    }`}
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-lg">
                      {o.emoji}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{o.name}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {o.id.startsWith("builtin:") ? "Modelo padrão" : "Template salvo"}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          {needsPlayer ? (
            <section className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                2. Escolha o atleta
              </p>
              <Select value={playerId ?? ""} onValueChange={(v) => setPlayerId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar atleta" />
                </SelectTrigger>
                <SelectContent>
                  {players.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {displayName(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {player && !player.photo_original_url && !player.photo_url ? (
                <p className="text-[11px] text-muted-foreground">
                  Este atleta ainda não tem foto cadastrada no Elenco.
                </p>
              ) : null}
            </section>
          ) : null}

          {editable.some((f) => f === "goals" || f === "title" || f === "subtitle") ? (
            <section className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Campos liberados
              </p>
              {editable.includes("goals") ? (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Gols</Label>
                  <Input
                    type="number"
                    min={1}
                    value={data.goals}
                    onChange={(e) =>
                      setExtra((p) => ({
                        ...p,
                        goals: Math.max(1, Number(e.target.value) || 1),
                        title: "",
                      }))
                    }
                  />
                </div>
              ) : null}
              {editable.includes("title") ? (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Título</Label>
                  <Input
                    value={data.title}
                    onChange={(e) => setExtra((p) => ({ ...p, title: e.target.value }))}
                  />
                </div>
              ) : null}
              {editable.includes("subtitle") ? (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Subtítulo</Label>
                  <Input
                    value={data.subtitle}
                    onChange={(e) => setExtra((p) => ({ ...p, subtitle: e.target.value }))}
                  />
                </div>
              ) : null}
            </section>
          ) : null}

          <div className="space-y-2">
            <Button
              className="w-full"
              disabled={!canGenerate}
              onClick={() => {
                setGenerated(true);
                toast.success("Arte pronta! Confira a pré-visualização.");
              }}
            >
              <Sparkles className="mr-2 size-4" /> Gerar arte
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              disabled={!canGenerate || !generated || exporting}
              onClick={() => handleExport(isMobileDevice() ? "share" : "png")}
            >
              {exporting ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Download className="mr-2 size-4" />
              )}
              Exportar
            </Button>
            <p className="text-[11px] text-muted-foreground">
              A pré-visualização é exatamente a arte final (1080×1920).
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-background/40 p-3">
          <div className="mx-auto max-w-[320px] overflow-hidden rounded-lg border border-border/60">
            <ScaledCanvas>{art}</ScaledCanvas>
          </div>
        </div>
      </div>

      <div
        className="pointer-events-none fixed left-0 top-0 overflow-hidden"
        style={{ width: 2, height: 2, opacity: 0.01, zIndex: -1 }}
        aria-hidden
      >
        <div style={{ transform: "scale(0.001)", transformOrigin: "top left" }}>
          <div ref={exportRef} style={{ width: STORY_WIDTH, height: STORY_HEIGHT }}>
            {art}
          </div>
        </div>
      </div>

      <ExportResultDialog result={exportResult} onClose={() => setExportResult(null)} />
    </div>
  );
}
