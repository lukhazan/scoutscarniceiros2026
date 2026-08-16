import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { renderStoryBlob } from "@/lib/studio/export-image";
import { ScaledCanvas } from "@/lib/studio/Canvas";
import { toast } from "sonner";
import {
  Bold,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  GripVertical,
  Image as ImageIcon,
  ImagePlus,
  Italic,
  Layers,
  LayoutTemplate,
  Loader2,
  Lock,
  Minus,
  Plus,
  Redo2,
  Share2,
  Shapes,
  RefreshCw,
  Trash2,
  CalendarDays,
  Type,
  Underline,
  Undo2,
  Unlock,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { publicAgendaQueryOptions } from "@/lib/agenda-data";
import {
  MAX_AGENDA_ITEMS,
  emptyAgendaItem,
  eventsToAgendaItems,
  weekRangeLabel,
  type AgendaArtItem,
} from "@/lib/studio/agenda-art";
import { displayName, playersQueryOptions } from "@/lib/team-data";
import {
  ACCEPTED_IMAGE_TYPES,
  brandIdentityQueryOptions,
  fileToStudioImage,
} from "@/lib/studio-data";
import { PLAYER_SCALE_MAX, PLAYER_SCALE_MIN } from "@/lib/studio/PlayerFrame";
import type { LayerId, SelectableLayerId } from "@/lib/studio/layout";
import {
  EMPTY_ART_DATA,
  STORY_HEIGHT,
  STORY_WIDTH,
  STUDIO_TEMPLATES,
  TemplateArt,
  getTemplate,
  type ArtData,
} from "@/lib/studio/templates";
import type { TextBackground, TextOverride } from "@/lib/studio/types";
import { DEFAULT_TEXT_BACKGROUND } from "@/lib/studio/types";

type ToolId = "template" | "agenda" | "foto" | "fundo" | "textos" | "elementos" | "camadas";
type TextLayerKey = "playerName" | "title" | "subtitle";

const TOOLS: { id: ToolId; label: string; icon: typeof Type }[] = [
  { id: "template", label: "Template", icon: LayoutTemplate },
  { id: "agenda", label: "Agenda", icon: CalendarDays },
  { id: "foto", label: "Foto", icon: ImageIcon },
  { id: "fundo", label: "Fundo", icon: ImagePlus },
  { id: "textos", label: "Textos", icon: Type },
  { id: "elementos", label: "Elementos", icon: Shapes },
  { id: "camadas", label: "Camadas", icon: Layers },
];

const LAYER_LABELS: Record<LayerId, string> = {
  background: "Fundo",
  graphics: "Elementos gráficos",
  overlay: "Sombreamento",
  watermark: "Marca d'água",
  crest: "Logo",
  teamName: "Nome do time",
  photo: "Foto do atleta",
  playerName: "Nome do atleta",
  title: "Título principal",
  subtitle: "Subtítulo",
  agenda: "Compromissos",
  sponsors: "Patrocinadores",
};

const FONT_OPTIONS = [
  "Bebas Neue",
  "Anton",
  "Oswald",
  "Playfair Display",
  "Montserrat",
  "Barlow",
  "Inter",
];

const FONT_SIZES = [18, 24, 28, 34, 42, 56, 72, 90, 110, 130, 156];

const TEXT_SECTIONS: { key: TextLayerKey; label: string; defaultSize: number }[] = [
  { key: "playerName", label: "Nome do atleta", defaultSize: 28 },
  { key: "title", label: "Título principal", defaultSize: 110 },
  { key: "subtitle", label: "Subtítulo", defaultSize: 24 },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
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
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <span className="text-[11px] font-semibold tabular-nums">
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

/**
 * Controles reutilizáveis do fundo de uma camada de texto.
 * Basta passar `style.background` de qualquer texto para habilitar o recurso.
 */
function TextBackgroundControls({
  value,
  primaryColor,
  onChange,
}: {
  value?: TextBackground;
  primaryColor: string;
  onChange: (bg: TextBackground) => void;
}) {
  const bg: TextBackground = value ?? DEFAULT_TEXT_BACKGROUND;
  const patch = (p: Partial<TextBackground>) => onChange({ ...bg, ...p });

  const presets: { id: string; label: string; apply: Partial<TextBackground> }[] = [
    { id: "none", label: "Sem fundo", apply: { enabled: false } },
    {
      id: "solid",
      label: "Sólido",
      apply: { enabled: true, color: "#111111", opacity: 1, radius: 0 },
    },
    {
      id: "red",
      label: "Vermelho",
      apply: { enabled: true, color: primaryColor, opacity: 1, radius: 0 },
    },
    { id: "custom", label: "Personalizado", apply: { enabled: true } },
  ];

  return (
    <div className="space-y-2 rounded-md border border-border/60 p-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Fundo do texto
      </p>
      <div className="flex flex-wrap gap-1">
        {presets.map((p) => (
          <Button
            key={p.id}
            size="sm"
            variant={
              (p.id === "none" && !bg.enabled) ||
              (p.id !== "none" &&
                bg.enabled &&
                (p.id === "custom" ||
                  (p.id === "red" && bg.color.toLowerCase() === primaryColor.toLowerCase()) ||
                  (p.id === "solid" && bg.color.toLowerCase() === "#111111")))
                ? "default"
                : "secondary"
            }
            className="h-7 px-2 text-[10px]"
            onClick={() => patch(p.apply)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {bg.enabled ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-md border border-border/60 px-2 py-1">
              <input
                type="color"
                value={bg.color}
                onChange={(e) => patch({ color: e.target.value })}
                className="size-5 cursor-pointer rounded border-0 bg-transparent p-0"
              />
              <span className="text-[11px] uppercase tabular-nums text-muted-foreground">
                {bg.color.toUpperCase()}
              </span>
            </div>
            {(["auto", "manual"] as const).map((m) => (
              <Button
                key={m}
                size="sm"
                variant={bg.mode === m ? "default" : "secondary"}
                className="h-7 px-2 text-[10px] capitalize"
                onClick={() => patch({ mode: m })}
              >
                {m === "auto" ? "Auto" : "Manual"}
              </Button>
            ))}
          </div>

          <SliderRow
            label="Opacidade"
            value={bg.opacity}
            min={0}
            max={1}
            step={0.05}
            format={(v) => `${Math.round(v * 100)}%`}
            onChange={(v) => patch({ opacity: v })}
          />
          <SliderRow
            label="Cantos"
            value={bg.radius}
            min={0}
            max={80}
            step={2}
            onChange={(v) => patch({ radius: v })}
          />
          <SliderRow
            label="Espaço horizontal"
            value={bg.paddingX}
            min={0}
            max={120}
            step={2}
            onChange={(v) => patch({ paddingX: v })}
          />
          <SliderRow
            label="Espaço vertical"
            value={bg.paddingY}
            min={0}
            max={100}
            step={2}
            onChange={(v) => patch({ paddingY: v })}
          />
          {bg.mode === "manual" ? (
            <>
              <SliderRow
                label="Largura"
                value={bg.width ?? 960}
                min={120}
                max={1080}
                step={10}
                onChange={(v) => patch({ width: v })}
              />
              <SliderRow
                label="Altura"
                value={bg.height ?? 220}
                min={60}
                max={800}
                step={10}
                onChange={(v) => patch({ height: v })}
              />
            </>
          ) : null}
          <SliderRow
            label="Posição X"
            value={bg.offsetX}
            min={-400}
            max={400}
            step={5}
            onChange={(v) => patch({ offsetX: v })}
          />
          <SliderRow
            label="Posição Y"
            value={bg.offsetY}
            min={-400}
            max={400}
            step={5}
            onChange={(v) => patch({ offsetY: v })}
          />
        </div>
      ) : null}
    </div>
  );
}

const HANDLES = [
  "left-0 top-0",
  "left-1/2 top-0 -translate-x-1/2",
  "right-0 top-0",
  "left-0 top-1/2 -translate-y-1/2",
  "right-0 top-1/2 -translate-y-1/2",
  "left-0 bottom-0",
  "left-1/2 bottom-0 -translate-x-1/2",
  "right-0 bottom-0",
];

export function ArtStudioPanel() {
  const { data: players = [] } = useQuery(playersQueryOptions);
  const { data: brand = null } = useQuery(brandIdentityQueryOptions);
  const queryClient = useQueryClient();
  const { data: agendaEvents = [], isFetching: agendaFetching } = useQuery(
    publicAgendaQueryOptions,
  );
  const exportRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [exporting, setExporting] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [slug, setSlug] = useState(STUDIO_TEMPLATES[0].slug);
  const [titleEdited, setTitleEdited] = useState(false);
  const [tool, setTool] = useState<ToolId>("template");
  const [selected, setSelected] = useState<SelectableLayerId>("photo");
  const [previewMode, setPreviewMode] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [data, setData] = useState<ArtData>(() => ({
    ...EMPTY_ART_DATA,
    backgroundUrl: readDefaultBackground(),
  }));

  const past = useRef<ArtData[]>([]);
  const future = useRef<ArtData[]>([]);
  const [historyTick, setHistoryTick] = useState(0);

  const template = getTemplate(slug);
  const isAgendaTemplate = template.fields.includes("agenda");

  const commit = useCallback((updater: (prev: ArtData) => ArtData) => {
    setData((prev) => {
      past.current = [...past.current.slice(-40), prev];
      future.current = [];
      return updater(prev);
    });
    setHistoryTick((t) => t + 1);
  }, []);

  const set = useCallback(
    (patch: Partial<ArtData>) => commit((prev) => ({ ...prev, ...patch })),
    [commit],
  );

  const setStyle = (layer: TextLayerKey, patch: TextOverride) =>
    commit((prev) => ({
      ...prev,
      textStyles: { ...prev.textStyles, [layer]: { ...prev.textStyles[layer], ...patch } },
    }));

  function undo() {
    const prev = past.current.pop();
    if (!prev) return;
    setData((current) => {
      future.current = [...future.current, current];
      return prev;
    });
    setHistoryTick((t) => t + 1);
  }

  function redo() {
    const next = future.current.pop();
    if (!next) return;
    setData((current) => {
      past.current = [...past.current, current];
      return next;
    });
    setHistoryTick((t) => t + 1);
  }

  useEffect(() => {
    if (titleEdited) return;
    setData((prev) => {
      const title = template.autoTitle(prev);
      return prev.title === title ? prev : { ...prev, title };
    });
  }, [template, data.goals, titleEdited]);

  const autoAgendaItems = useMemo(
    () => eventsToAgendaItems(agendaEvents, data.agendaWeekOffset ?? 0),
    [agendaEvents, data.agendaWeekOffset],
  );

  // Modo automático: só copia (leitura) os compromissos da Agenda para a arte.
  useEffect(() => {
    if (!isAgendaTemplate || data.agendaMode !== "auto") return;
    setData((prev) =>
      JSON.stringify(prev.agendaItems) === JSON.stringify(autoAgendaItems)
        ? prev
        : { ...prev, agendaItems: autoAgendaItems },
    );
  }, [isAgendaTemplate, data.agendaMode, autoAgendaItems]);

  function setAgendaItem(id: string, patch: Partial<AgendaArtItem>) {
    set({
      agendaItems: (data.agendaItems ?? []).map((it) =>
        it.id === id ? { ...it, ...patch } : it,
      ),
    });
  }

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
        photo_original_url: player.photo_original_url,
      }
    : null;

  /** Ao escolher um atleta, carrega a FOTO ORIGINAL (nunca o avatar recortado). */
  function selectPlayer(id: string) {
    const p = players.find((x) => x.id === id) ?? null;
    const original = p?.photo_original_url ?? null;
    if (original) {
      set({
        playerId: id,
        playerPhotoUrl: original,
        playerOffsetX: 0,
        playerOffsetY: 0,
        playerRotation: 0,
      });
    } else {
      set({ playerId: id });
      if (p && !p.photo_original_url) {
        toast.message(
          "Este atleta ainda não tem foto original. Cadastre no Elenco ou envie uma foto aqui.",
        );
      }
    }
  }

  async function handlePhoto(file: File | undefined) {
    if (!file) return;
    setPhotoBusy(true);
    try {
      const url = await fileToStudioImage(file);
      set({ playerPhotoUrl: url, playerOffsetX: 0, playerOffsetY: 0, playerRotation: 0 });
      setSelected("photo");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao carregar imagem.");
    } finally {
      setPhotoBusy(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  }

  async function renderBlob(format: "png" | "jpg") {
    if (!exportRef.current) return null;
    return renderStoryBlob(exportRef.current, format);
  }


  async function handleExport(format: "png" | "jpg" | "share") {
    setExporting(true);
    const toastId = toast.loading("Gerando arte...");
    try {
      const blob = await renderBlob(format === "jpg" ? "jpg" : "png");
      if (!blob) {
        toast.error("Não foi possível gerar a imagem. Tente novamente.", { id: toastId });
        return;
      }
      const ext = format === "jpg" ? "jpg" : "png";
      const filename = `${template.slug}-${Date.now()}.${ext}`;
      const file = new File([blob], filename, { type: blob.type });

      // Desktop com download funcional: mantém o comportamento tradicional.
      if (format !== "share" && !isMobileDevice() && !canShareFile(file)) {
        if (downloadFile(blob, filename)) {
          toast.success("Arte baixada!", { id: toastId });
          return;
        }
      }

      // Celular (ou pedido explícito de compartilhar): o menu nativo precisa de
      // um toque do usuário, então abrimos o diálogo de entrega da arte.
      toast.dismiss(toastId);
      setExportResult({ blob, filename, title: template.name });
    } catch {
      toast.error("Não foi possível gerar a imagem. Tente novamente.", { id: toastId });
    } finally {
      setExporting(false);
    }
  }

  const styleOf = (layer: TextLayerKey): TextOverride => data.textStyles[layer] ?? {};
  const hidden = data.hiddenLayers ?? [];
  const locked = data.lockedLayers ?? [];
  const layerList = (data.layerOrder ?? template.layout.layers).filter((id) =>
    template.layout.layers.includes(id),
  );

  function toggleHidden(id: LayerId) {
    set({
      hiddenLayers: hidden.includes(id) ? hidden.filter((l) => l !== id) : [...hidden, id],
    });
  }

  function toggleLocked(id: LayerId) {
    set({
      lockedLayers: locked.includes(id) ? locked.filter((l) => l !== id) : [...locked, id],
    });
  }

  function moveLayer(id: LayerId, dir: -1 | 1) {
    const order = [...layerList];
    const i = order.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    set({ layerOrder: order });
  }

  function nudge(dx: number, dy: number) {
    set({
      playerOffsetX: data.playerOffsetX + dx,
      playerOffsetY: data.playerOffsetY + dy,
    });
  }

  const art = (
    <TemplateArt
      template={template}
      data={data}
      brand={brand}
      player={artPlayer}
      selected={previewMode ? null : selected}
      onSelect={previewMode ? undefined : setSelected}
    />
  );

  return (
    <div className="rounded-2xl border border-border/60 bg-card">
      {/* ------------------------------ barra superior ----------------------------- */}
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border/60 p-3 sm:flex sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary">
            <LayoutTemplate className="size-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-base tracking-wide">ESTÚDIO DE ARTES</p>
            <p className="truncate text-xs text-muted-foreground">
              Crie artes profissionais para o seu time
            </p>
          </div>
        </div>

        <div className="col-span-2 flex flex-wrap items-center justify-end gap-2 sm:col-auto">
          <div className="flex items-center rounded-lg border border-border/60">
            <Button
              variant="ghost"
              size="icon"
              className="size-9 rounded-r-none"
              title="Desfazer"
              disabled={past.current.length === 0}
              onClick={undo}
            >
              <Undo2 className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-9 rounded-l-none"
              title="Refazer"
              disabled={future.current.length === 0}
              onClick={redo}
            >
              <Redo2 className="size-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Pré-visualização</span>
            <Switch checked={previewMode} onCheckedChange={setPreviewMode} />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled={exporting}>
                {exporting ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Download className="mr-2 size-4" />
                )}
                Exportar
                <ChevronDown className="ml-1 size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => handleExport("png")}>
                <Download className="mr-2 size-4" /> Baixar PNG
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleExport("jpg")}>
                <Download className="mr-2 size-4" /> Baixar JPG
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleExport("share")}>
                <Share2 className="mr-2 size-4" /> Compartilhar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="grid gap-3 p-3 xl:grid-cols-[300px_minmax(0,1fr)_280px]">
        {/* --------------------------- coluna esquerda --------------------------- */}
        <div className="grid grid-cols-[68px_minmax(0,1fr)] gap-2 rounded-xl border border-border/60 bg-background/40 p-2">
          <nav className="flex flex-col gap-1">
            {TOOLS.filter(
              (t) =>
                (t.id !== "agenda" || isAgendaTemplate) &&
                (t.id !== "foto" || !isAgendaTemplate),
            ).map((t) => {
              const Icon = t.icon;
              const active = tool === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTool(t.id)}
                  className={`flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] transition-colors ${
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <Icon className="size-4" />
                  {t.label}
                </button>
              );
            })}
          </nav>

          <div className="min-w-0 space-y-4 overflow-y-auto p-1">
            {tool === "template" ? (
              <>
                <section className="rounded-lg border border-border/60 p-2">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Template atual
                  </p>
                  <div className="overflow-hidden rounded-md border border-border/60">
                    <div className="pointer-events-none">
                      <ScaledCanvas>{art}</ScaledCanvas>
                    </div>
                  </div>
                  <p className="mt-2 text-center text-xs">{template.name}</p>
                </section>

                <section>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Templates
                  </p>
                  <div className="space-y-2">
                    {STUDIO_TEMPLATES.map((t) => (
                      <button
                        key={t.slug}
                        type="button"
                        onClick={() => {
                          setSlug(t.slug);
                          setTitleEdited(false);
                          setSelected(t.fields.includes("agenda") ? "title" : "photo");
                          set({ ...t.defaults });
                        }}
                        className={`flex w-full items-center gap-2 rounded-lg border p-2 text-left transition-colors ${
                          slug === t.slug
                            ? "border-primary bg-primary/10"
                            : "border-border/60 hover:border-primary/50"
                        }`}
                      >
                        <span className="grid size-10 shrink-0 place-items-center rounded bg-secondary text-lg">
                          {t.emoji}
                        </span>
                        <span className="min-w-0 truncate text-xs font-semibold">{t.name}</span>
                      </button>
                    ))}
                  </div>
                </section>
              </>
            ) : null}

            {tool === "agenda" && isAgendaTemplate ? (
              <div className="space-y-3">
                <Field label="Modo">
                  <div className="grid grid-cols-2 gap-1 rounded-lg border border-border/60 p-1">
                    {(["auto", "manual"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() =>
                          set({
                            agendaMode: m,
                            agendaItems:
                              m === "manual" && (data.agendaItems ?? []).length === 0
                                ? [emptyAgendaItem()]
                                : data.agendaItems,
                          })
                        }
                        className={`rounded-md px-2 py-1.5 text-xs font-semibold ${
                          (data.agendaMode ?? "auto") === m
                            ? "bg-primary/15 text-primary"
                            : "text-muted-foreground hover:bg-secondary"
                        }`}
                      >
                        {m === "auto" ? "Automático" : "Manual"}
                      </button>
                    ))}
                  </div>
                </Field>

                {(data.agendaMode ?? "auto") === "auto" ? (
                  <>
                    <Field label="Semana">
                      <Select
                        value={String(data.agendaWeekOffset ?? 0)}
                        onValueChange={(v) => set({ agendaWeekOffset: Number(v) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="-1">Semana anterior</SelectItem>
                          <SelectItem value="0">Semana atual</SelectItem>
                          <SelectItem value="1">Próxima semana</SelectItem>
                          <SelectItem value="2">Daqui a 2 semanas</SelectItem>
                          <SelectItem value="3">Daqui a 3 semanas</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <p className="text-[11px] text-muted-foreground">
                      {weekRangeLabel(data.agendaWeekOffset ?? 0)}
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      disabled={agendaFetching}
                      onClick={() =>
                        queryClient.invalidateQueries({ queryKey: ["team_events"] })
                      }
                    >
                      {agendaFetching ? (
                        <Loader2 className="mr-1 size-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-1 size-4" />
                      )}
                      Atualizar da Agenda
                    </Button>
                    {autoAgendaItems.length === 0 ? (
                      <p className="rounded-lg border border-border/60 p-2 text-xs text-muted-foreground">
                        Nenhum compromisso público encontrado nesta semana. Escolha outra semana ou
                        use o modo Manual.
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {autoAgendaItems.map((it) => (
                          <p key={it.id} className="truncate text-xs text-muted-foreground">
                            {it.weekday} • {it.date} {it.time} — {it.opponent || it.title}
                          </p>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-3">
                    {(data.agendaItems ?? []).map((item, idx) => (
                      <div key={item.id} className="space-y-2 rounded-lg border border-border/60 p-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold uppercase text-muted-foreground">
                            Compromisso {idx + 1}
                          </span>
                          <button
                            type="button"
                            className="rounded p-1 text-muted-foreground hover:bg-secondary"
                            onClick={() =>
                              set({
                                agendaItems: (data.agendaItems ?? []).filter(
                                  (i) => i.id !== item.id,
                                ),
                              })
                            }
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                        <Select
                          value={item.type}
                          onValueChange={(v) =>
                            setAgendaItem(item.id, { type: v as AgendaArtItem["type"] })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="jogo">Jogo</SelectItem>
                            <SelectItem value="evento">Evento</SelectItem>
                            <SelectItem value="festa">Festa</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            value={item.weekday}
                            placeholder="QUINTA"
                            onChange={(e) => setAgendaItem(item.id, { weekday: e.target.value })}
                          />
                          <Input
                            value={item.date}
                            placeholder="06 AGO"
                            onChange={(e) => setAgendaItem(item.id, { date: e.target.value })}
                          />
                        </div>
                        <Input
                          value={item.time}
                          placeholder="20:30"
                          onChange={(e) => setAgendaItem(item.id, { time: e.target.value })}
                        />
                        {item.type === "jogo" ? (
                          <Input
                            value={item.opponent}
                            placeholder="Adversário"
                            onChange={(e) => setAgendaItem(item.id, { opponent: e.target.value })}
                          />
                        ) : (
                          <Input
                            value={item.title}
                            placeholder="Título do compromisso"
                            onChange={(e) => setAgendaItem(item.id, { title: e.target.value })}
                          />
                        )}
                        <Input
                          value={item.location}
                          placeholder="Local"
                          onChange={(e) => setAgendaItem(item.id, { location: e.target.value })}
                        />
                      </div>
                    ))}
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      disabled={(data.agendaItems ?? []).length >= MAX_AGENDA_ITEMS}
                      onClick={() =>
                        set({ agendaItems: [...(data.agendaItems ?? []), emptyAgendaItem()] })
                      }
                    >
                      <Plus className="mr-1 size-4" /> Adicionar compromisso
                    </Button>
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground">
                  A arte não altera a Agenda — os dados são apenas lidos.
                </p>
              </div>
            ) : null}

            {tool === "foto" ? (
              <div className="space-y-3">
                <Field label="Atleta">
                  <Select value={data.playerId ?? ""} onValueChange={selectPlayer}>
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
                      className="h-28 w-full rounded-lg border border-border/60 bg-secondary object-contain"
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
                  A foto pode ser ampliada e movida livremente por todo o layout no painel
                  de propriedades.
                </p>
              </div>
            ) : null}

            {tool === "fundo" ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-lg border border-border/60 p-2">
                  <div className="size-14 shrink-0 overflow-hidden rounded bg-secondary">
                    {data.backgroundUrl ? (
                      <img src={data.backgroundUrl} alt="" className="size-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">
                      {data.backgroundUrl ? "Fundo aplicado" : "Sem fundo"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">1080x1920, sem cortes</p>
                  </div>
                </div>
                <BackgroundGallery
                  value={data.backgroundUrl}
                  onChange={(v) => set({ backgroundUrl: v })}
                />
              </div>
            ) : null}

            {tool === "textos" ? (
              <div className="space-y-3">
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

                <Field label="Título principal">
                  <Input
                    value={data.title}
                    onChange={(e) => {
                      setTitleEdited(true);
                      set({ title: e.target.value });
                    }}
                    onFocus={() => setSelected("title")}
                  />
                </Field>

                <Field label="Subtítulo">
                  <Input
                    value={data.subtitle}
                    maxLength={70}
                    placeholder="Ex.: amistoso"
                    onChange={(e) => set({ subtitle: e.target.value })}
                    onFocus={() => setSelected("subtitle")}
                  />
                </Field>
              </div>
            ) : null}

            {tool === "elementos" ? (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Elementos do template
                </p>
                {(["crest", "teamName", "sponsors", "watermark", "graphics", "overlay"] as LayerId[])
                  .filter((id) => template.layout.layers.includes(id))
                  .map((id) => (
                    <div
                      key={id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border/60 p-2"
                    >
                      <span className="min-w-0 truncate text-xs">{LAYER_LABELS[id]}</span>
                      <Switch
                        checked={!hidden.includes(id)}
                        onCheckedChange={() => toggleHidden(id)}
                      />
                    </div>
                  ))}
              </div>
            ) : null}

            {tool === "camadas" ? (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Camadas
                </p>
                {[...layerList].reverse().map((id) => (
                  <div
                    key={id}
                    className={`flex items-center gap-1 rounded-lg border p-2 ${
                      selected === id ? "border-primary bg-primary/10" : "border-border/60"
                    }`}
                  >
                    <GripVertical className="size-3.5 shrink-0 text-muted-foreground" />
                    <button
                      type="button"
                      className="min-w-0 flex-1 truncate text-left text-xs"
                      onClick={() => {
                        if (["photo", "playerName", "title", "subtitle"].includes(id)) {
                          setSelected(id as SelectableLayerId);
                        }
                      }}
                    >
                      {LAYER_LABELS[id]}
                    </button>
                    <button
                      type="button"
                      title="Bloquear"
                      className="rounded p-1 text-muted-foreground hover:bg-secondary"
                      onClick={() => toggleLocked(id)}
                    >
                      {locked.includes(id) ? (
                        <Lock className="size-3.5 text-primary" />
                      ) : (
                        <Unlock className="size-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      title="Subir"
                      className="rounded p-1 text-muted-foreground hover:bg-secondary"
                      onClick={() => moveLayer(id, 1)}
                    >
                      <ChevronUp className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Descer"
                      className="rounded p-1 text-muted-foreground hover:bg-secondary"
                      onClick={() => moveLayer(id, -1)}
                    >
                      <ChevronDown className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* ------------------------------- canvas -------------------------------- */}
        <section className="flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-background/40 p-3">
          <p className="w-full text-left text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Canvas 1080x1920
          </p>

          <div className="relative w-full max-w-[420px] p-2">
            <ScaledCanvas zoom={zoom}>{art}</ScaledCanvas>
            {previewMode ? null : (
              <>
                <div className="pointer-events-none absolute inset-0 rounded-lg border border-dashed border-foreground/30" />
                {HANDLES.map((pos) => (
                  <span
                    key={pos}
                    className={`pointer-events-none absolute size-2 rounded-[2px] bg-foreground/70 ${pos}`}
                  />
                ))}
              </>
            )}
          </div>

          <div className="flex items-center gap-1 rounded-full border border-border/60 px-2 py-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))}
            >
              <Minus className="size-4" />
            </Button>
            <span className="w-12 text-center text-xs tabular-nums">
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
            <Button variant="ghost" size="sm" className="h-7" onClick={() => setZoom(1)}>
              Ajustar
            </Button>
          </div>
        </section>

        {/* -------------------------- coluna de propriedades ------------------------- */}
        <aside className="space-y-4 overflow-y-auto rounded-xl border border-border/60 bg-background/40 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Propriedades
          </p>

          <section
            className={`space-y-3 rounded-lg border p-3 ${
              selected === "photo" ? "border-primary/60" : "border-border/60"
            }`}
            onClick={() => setSelected("photo")}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              Foto do atleta
            </p>
            {data.playerPhotoUrl ? (
              <>
                <SliderRow
                  label="Escala"
                  value={data.playerScale}
                  min={PLAYER_SCALE_MIN}
                  max={PLAYER_SCALE_MAX}
                  step={0.01}
                  format={(v) => `${Math.round(v * 100)}%`}
                  onChange={(v) => set({ playerScale: v })}
                />
                <SliderRow
                  label="Posição X"
                  value={data.playerOffsetX}
                  min={-STORY_WIDTH / 2}
                  max={STORY_WIDTH / 2}
                  step={1}
                  onChange={(v) => set({ playerOffsetX: v })}
                />
                <SliderRow
                  label="Posição Y"
                  value={data.playerOffsetY}
                  min={-STORY_HEIGHT / 2}
                  max={STORY_HEIGHT / 2}
                  step={1}
                  onChange={(v) => set({ playerOffsetY: v })}
                />
                <SliderRow
                  label="Rotação"
                  value={data.playerRotation}
                  min={-180}
                  max={180}
                  step={1}
                  format={(v) => `${v}°`}
                  onChange={(v) => set({ playerRotation: v })}
                />

                <div className="flex flex-col items-center gap-1 pt-1">
                  <Button variant="secondary" size="icon" className="size-8" onClick={() => nudge(0, -10)}>
                    <ChevronUp className="size-4" />
                  </Button>
                  <div className="flex items-center gap-1">
                    <Button variant="secondary" size="icon" className="size-8" onClick={() => nudge(-10, 0)}>
                      <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="size-8"
                      title="Centralizar"
                      onClick={() =>
                        set({
                          playerOffsetX: 0,
                          playerOffsetY: 0,
                          playerScale: 1,
                          playerRotation: 0,
                        })
                      }
                    >
                      <Plus className="size-4" />
                    </Button>
                    <Button variant="secondary" size="icon" className="size-8" onClick={() => nudge(10, 0)}>
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                  <Button variant="secondary" size="icon" className="size-8" onClick={() => nudge(0, 10)}>
                    <ChevronDown className="size-4" />
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Envie uma foto na ferramenta “Foto” para liberar os ajustes.
              </p>
            )}
          </section>

          {TEXT_SECTIONS.map((section) => {
            const style = styleOf(section.key);
            return (
              <section
                key={section.key}
                className={`space-y-2 rounded-lg border p-3 ${
                  selected === section.key ? "border-primary/60" : "border-border/60"
                }`}
                onClick={() => setSelected(section.key)}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                  {section.label}
                </p>

                <Select
                  value={style.fontFamily ?? ""}
                  onValueChange={(v) => setStyle(section.key, { fontFamily: v })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Fonte do template" />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                  <Select
                    value={String(style.fontSize ?? section.defaultSize)}
                    onValueChange={(v) => setStyle(section.key, { fontSize: Number(v) })}
                  >
                    <SelectTrigger className="h-8 w-20 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_SIZES.map((s) => (
                        <SelectItem key={s} value={String(s)}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-1 items-center gap-2 rounded-md border border-border/60 px-2 py-1">
                    <input
                      type="color"
                      value={style.color ?? brand?.accent_color ?? "#ffffff"}
                      onChange={(e) => setStyle(section.key, { color: e.target.value })}
                      className="size-5 cursor-pointer rounded border-0 bg-transparent p-0"
                    />
                    <span className="text-[11px] uppercase tabular-nums text-muted-foreground">
                      {(style.color ?? brand?.accent_color ?? "#ffffff").toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {(
                    [
                      ["bold", Bold],
                      ["italic", Italic],
                      ["underline", Underline],
                    ] as const
                  ).map(([key, Icon]) => (
                    <Button
                      key={key}
                      size="icon"
                      variant={style[key] ? "default" : "secondary"}
                      className="size-8"
                      onClick={() => setStyle(section.key, { [key]: !style[key] })}
                    >
                      <Icon className="size-3.5" />
                    </Button>
                  ))}
                  <span className="mx-1 h-5 w-px bg-border" />
                  {(
                    [
                      ["flex-start", "Esq."],
                      ["center", "Centro"],
                      ["flex-end", "Dir."],
                    ] as const
                  ).map(([value, label]) => (
                    <Button
                      key={value}
                      size="sm"
                      variant={style.align === value ? "default" : "secondary"}
                      className="h-8 px-2 text-[10px]"
                      onClick={() => setStyle(section.key, { align: value })}
                    >
                      {label}
                    </Button>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">Maiúsculas</span>
                  <Switch
                    checked={style.uppercase ?? true}
                    onCheckedChange={(v) => setStyle(section.key, { uppercase: v })}
                  />
                </div>

                <TextBackgroundControls
                  value={style.background}
                  primaryColor={brand?.primary_color ?? "#e11d2e"}
                  onChange={(bg) => setStyle(section.key, { background: bg })}
                />

              </section>
            );
          })}

          <p className="text-[11px] text-muted-foreground">
            Todas as alterações são aplicadas em tempo real no canvas.
          </p>
          <span className="hidden">{historyTick}</span>
        </aside>
      </div>

      {/* nó em resolução real usado apenas na exportação.
          Fica dentro da viewport (invisível e reduzido) porque navegadores
          móveis não decodificam imagens de nós posicionados muito fora da tela.
          A escala fica no wrapper — nunca no nó exportado. */}
      <div
        className="pointer-events-none fixed left-0 top-0 overflow-hidden"
        style={{ width: 2, height: 2, opacity: 0.01, zIndex: -1 }}
        aria-hidden
      >
        <div style={{ transform: "scale(0.001)", transformOrigin: "top left" }}>
          <div ref={exportRef} style={{ width: STORY_WIDTH, height: STORY_HEIGHT }}>
            <TemplateArt template={template} data={data} brand={brand} player={artPlayer} />
          </div>
        </div>
      </div>
    </div>
  );
}
