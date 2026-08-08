import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toPng } from "html-to-image";
import { ScaledCanvas } from "@/lib/studio/Canvas";
import { toast } from "sonner";
import { Download, ImagePlus, Loader2, Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BackgroundGallery,
  readDefaultBackground,
} from "@/components/studio/BackgroundGallery";
import { saveFile } from "@/lib/download-file";
import { displayName, playersQueryOptions } from "@/lib/team-data";
import {
  ACCEPTED_IMAGE_TYPES,
  brandIdentityQueryOptions,
  fileToStudioImage,
} from "@/lib/studio-data";
import {
  PLAYER_SCALE_MAX,
  PLAYER_SCALE_MIN,
} from "@/lib/studio/PlayerFrame";
import type { SelectableLayerId } from "@/lib/studio/layout";
import {
  EMPTY_ART_DATA,
  STORY_HEIGHT,
  STORY_WIDTH,
  STUDIO_TEMPLATES,
  TemplateArt,
  getTemplate,
  type ArtData,
} from "@/lib/studio/templates";
import type { TextOverride } from "@/lib/studio/types";

const TEXT_LAYERS = ["playerName", "title", "subtitle"] as const;
type TextLayerKey = (typeof TEXT_LAYERS)[number];

const LAYER_LABELS: Record<SelectableLayerId, string> = {
  photo: "Foto do atleta",
  playerName: "Nome do atleta",
  title: "Título",
  subtitle: "Subtítulo",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </Label>
        <span className="text-[11px] tabular-nums text-muted-foreground">
          {format ? format(value) : value}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  );
}

export function ArtStudioPanel() {
  const { data: players = [] } = useQuery(playersQueryOptions);
  const { data: brand = null } = useQuery(brandIdentityQueryOptions);
  const exportRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [exporting, setExporting] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [slug, setSlug] = useState(STUDIO_TEMPLATES[0].slug);
  const [titleEdited, setTitleEdited] = useState(false);
  const [selected, setSelected] = useState<SelectableLayerId>("photo");
  const [zoom, setZoom] = useState(1);
  const [data, setData] = useState<ArtData>(() => ({
    ...EMPTY_ART_DATA,
    backgroundUrl: readDefaultBackground(),
  }));

  const template = getTemplate(slug);
  const set = (patch: Partial<ArtData>) => setData((prev) => ({ ...prev, ...patch }));
  const setStyle = (layer: TextLayerKey, patch: TextOverride) =>
    setData((prev) => ({
      ...prev,
      textStyles: { ...prev.textStyles, [layer]: { ...prev.textStyles[layer], ...patch } },
    }));

  useEffect(() => {
    if (titleEdited) return;
    setData((prev) => ({ ...prev, title: template.autoTitle(prev) }));
  }, [template, data.goals, titleEdited]);

  const player = useMemo(
    () => players.find((p) => p.id === data.playerId) ?? null,
    [players, data.playerId],
  );

  const artPlayer = player
    ? {
        id: player.id,
        name: player.name,
        nickname: player.nickname,
        position: player.position,
        shirt_number: player.shirt_number,
        photo_url: player.photo_url,
      }
    : null;

  async function handlePhoto(file: File | undefined) {
    if (!file) return;
    setPhotoBusy(true);
    try {
      const url = await fileToStudioImage(file);
      set({ playerPhotoUrl: url, playerOffsetX: 0, playerOffsetY: 0 });
      setSelected("photo");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao carregar imagem.");
    } finally {
      setPhotoBusy(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  }

  async function handleExport() {
    if (!exportRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(exportRef.current, {
        width: STORY_WIDTH,
        height: STORY_HEIGHT,
        pixelRatio: 1,
        cacheBust: true,
      });
      const blob = await (await fetch(dataUrl)).blob();
      await saveFile(blob, `${template.slug}-${Date.now()}.png`);
      toast.success("Arte gerada!");
    } catch {
      toast.error("Não foi possível gerar a arte.");
    } finally {
      setExporting(false);
    }
  }

  const currentStyle = (layer: TextLayerKey): TextOverride => data.textStyles[layer] ?? {};

  return (
    <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)_300px]">
      {/* ---------------------------- painel de edição --------------------------- */}
      <aside className="rounded-xl border border-border/60 bg-card p-3">
        <Tabs defaultValue="templates">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="templates" className="px-1 text-[11px]">
              Templates
            </TabsTrigger>
            <TabsTrigger value="foto" className="px-1 text-[11px]">
              Foto
            </TabsTrigger>
            <TabsTrigger value="fundo" className="px-1 text-[11px]">
              Fundo
            </TabsTrigger>
            <TabsTrigger value="textos" className="px-1 text-[11px]">
              Textos
            </TabsTrigger>
            <TabsTrigger value="export" className="px-1 text-[11px]">
              Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="mt-4 space-y-3">
            {STUDIO_TEMPLATES.map((t) => (
              <div
                key={t.slug}
                className={`overflow-hidden rounded-xl border transition-all ${
                  slug === t.slug
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-border/60 hover:border-primary/50"
                }`}
              >
                <div className="flex h-24 items-center justify-center bg-secondary text-4xl">
                  {t.emoji}
                </div>
                <div className="flex items-center justify-between gap-2 p-3">
                  <p className="font-display text-base">{t.name}</p>
                  <Button
                    size="sm"
                    variant={slug === t.slug ? "default" : "secondary"}
                    onClick={() => {
                      setSlug(t.slug);
                      setTitleEdited(false);
                      setData((prev) => ({ ...prev, ...t.defaults }));
                    }}
                  >
                    {slug === t.slug ? "Selecionado" : "Selecionar"}
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="foto" className="mt-4 space-y-3">
            <Field label="Atleta">
              <Select value={data.playerId ?? ""} onValueChange={(v) => set({ playerId: v })}>
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
            </Field>

            <input
              ref={photoInputRef}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES}
              className="hidden"
              onChange={(e) => handlePhoto(e.target.files?.[0])}
            />

            {data.playerPhotoUrl ? (
              <div className="space-y-2">
                <img
                  src={data.playerPhotoUrl}
                  alt=""
                  className="h-32 w-full rounded-lg border border-border/60 bg-secondary object-contain"
                />
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    disabled={photoBusy}
                    onClick={() => photoInputRef.current?.click()}
                  >
                    Trocar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => set({ playerPhotoUrl: null })}
                  >
                    <X className="mr-1 size-3.5" /> Remover
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="secondary"
                className="w-full"
                disabled={photoBusy}
                onClick={() => photoInputRef.current?.click()}
              >
                {photoBusy ? (
                  <Loader2 className="mr-1 size-4 animate-spin" />
                ) : (
                  <ImagePlus className="mr-1 size-4" />
                )}
                Enviar foto do atleta
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              PNG sem fundo fica melhor. A foto é centralizada automaticamente dentro da
              área da foto — ajustes finos ficam no painel de propriedades.
            </p>
          </TabsContent>

          <TabsContent value="fundo" className="mt-4">
            <BackgroundGallery
              value={data.backgroundUrl}
              onChange={(v) => set({ backgroundUrl: v })}
            />
          </TabsContent>

          <TabsContent value="textos" className="mt-4 space-y-3">
            <Field label="Nome exibido (opcional)">
              <Input
                value={data.playerName}
                placeholder="Usa o apelido do atleta"
                onChange={(e) => set({ playerName: e.target.value })}
                onFocus={() => setSelected("playerName")}
              />
            </Field>

            {template.fields.includes("goals") ? (
              <Field label="Quantidade de gols">
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={data.goals}
                  onChange={(e) => {
                    setTitleEdited(false);
                    set({ goals: Math.max(1, Number(e.target.value) || 1) });
                  }}
                />
              </Field>
            ) : null}

            <Field label="Texto principal (automático, editável)">
              <Input
                value={data.title}
                onChange={(e) => {
                  setTitleEdited(true);
                  set({ title: e.target.value });
                }}
                onFocus={() => setSelected("title")}
              />
            </Field>

            <Field label="Texto complementar">
              <Input
                value={data.subtitle}
                maxLength={70}
                placeholder="Ex.: vitória contra o Real Várzea"
                onChange={(e) => set({ subtitle: e.target.value })}
                onFocus={() => setSelected("subtitle")}
              />
            </Field>

            <p className="text-xs text-muted-foreground">
              Nenhum texto ultrapassa sua área: a fonte reduz ou quebra a linha
              automaticamente, sem cortar palavras.
            </p>
          </TabsContent>

          <TabsContent value="export" className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              O PNG exportado usa exatamente o mesmo motor da pré-visualização.
            </p>
            <Button onClick={handleExport} disabled={exporting} className="w-full">
              {exporting ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Download className="mr-2 size-4" />
              )}
              {exporting ? "Gerando arte…" : "Baixar PNG (1080x1920)"}
            </Button>
          </TabsContent>
        </Tabs>
      </aside>

      {/* ------------------------------- prévia -------------------------------- */}
      <section className="flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-secondary/40 p-3">
        <div className="flex w-full items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Pré-visualização · 1080x1920
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))}
            >
              <Minus className="size-4" />
            </Button>
            <span className="w-12 text-center text-xs tabular-nums text-muted-foreground">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(2)))}
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </div>

        <div className="w-full max-w-[420px]">
          <ScaledCanvas zoom={zoom}>
            <TemplateArt
              template={template}
              data={data}
              brand={brand}
              player={artPlayer}
              selected={selected}
              onSelect={setSelected}
            />
          </ScaledCanvas>
        </div>
        <p className="text-xs text-muted-foreground">
          Clique em uma área da arte para editar suas propriedades. O zoom é apenas visual.
        </p>
      </section>

      {/* --------------------------- painel de propriedades --------------------------- */}
      <aside className="space-y-4 rounded-xl border border-border/60 bg-card p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Propriedades
          </p>
          <p className="font-display text-lg">{LAYER_LABELS[selected]}</p>
        </div>

        {selected === "photo" ? (
          data.playerPhotoUrl ? (
            <div className="space-y-4">
              <SliderRow
                label="Escala"
                value={data.playerScale}
                min={PLAYER_SCALE_MIN}
                max={PLAYER_SCALE_MAX}
                step={0.05}
                format={(v) => `${v.toFixed(2)}x`}
                onChange={(v) => set({ playerScale: v })}
              />
              <SliderRow
                label="Posição horizontal"
                value={data.playerOffsetX}
                min={-50}
                max={50}
                step={1}
                format={(v) => `${v}%`}
                onChange={(v) => set({ playerOffsetX: v })}
              />
              <SliderRow
                label="Posição vertical"
                value={data.playerOffsetY}
                min={-50}
                max={50}
                step={1}
                format={(v) => `${v}%`}
                onChange={(v) => set({ playerOffsetY: v })}
              />
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => set({ playerScale: 1, playerOffsetX: 0, playerOffsetY: 0 })}
              >
                Centralizar novamente
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Envie uma foto na aba “Foto” para liberar os ajustes.
            </p>
          )
        ) : (
          <div className="space-y-4">
            <Field label="Fonte">
              <Select
                value={currentStyle(selected as TextLayerKey).font ?? "auto"}
                onValueChange={(v) =>
                  setStyle(
                    selected as TextLayerKey,
                    { font: v === "auto" ? undefined : (v as "primary" | "secondary") },
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Padrão do template</SelectItem>
                  <SelectItem value="primary">Fonte de títulos</SelectItem>
                  <SelectItem value="secondary">Fonte de textos</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Cor">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={
                    currentStyle(selected as TextLayerKey).color ??
                    brand?.accent_color ??
                    "#ffffff"
                  }
                  onChange={(e) =>
                    setStyle(selected as TextLayerKey, { color: e.target.value })
                  }
                  className="h-9 w-14 cursor-pointer rounded border border-border/60 bg-transparent"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStyle(selected as TextLayerKey, { color: undefined })}
                >
                  Padrão
                </Button>
              </div>
            </Field>

            <SliderRow
              label="Tamanho"
              value={currentStyle(selected as TextLayerKey).sizeScale ?? 1}
              min={0.5}
              max={1.3}
              step={0.05}
              format={(v) => `${Math.round(v * 100)}%`}
              onChange={(v) => setStyle(selected as TextLayerKey, { sizeScale: v })}
            />

            <Field label="Alinhamento">
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ["flex-start", "Esq."],
                    ["center", "Centro"],
                    ["flex-end", "Dir."],
                  ] as const
                ).map(([v, label]) => (
                  <Button
                    key={v}
                    size="sm"
                    variant={
                      (currentStyle(selected as TextLayerKey).align ?? "") === v
                        ? "default"
                        : "secondary"
                    }
                    onClick={() => setStyle(selected as TextLayerKey, { align: v })}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </Field>
          </div>
        )}
      </aside>

      {/* nó oculto em resolução real, usado apenas na exportação */}
      <div className="pointer-events-none fixed -left-[10000px] top-0" aria-hidden>
        <div ref={exportRef} style={{ width: STORY_WIDTH, height: STORY_HEIGHT }}>
          <TemplateArt template={template} data={data} brand={brand} player={artPlayer} />
        </div>
      </div>
    </div>
  );
}
