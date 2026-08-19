import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { MediaPicker } from "@/components/studio/MediaPicker";
import { STORY_HEIGHT, STORY_WIDTH } from "@/lib/studio/constants";
import {
  newSponsorItem,
  resolveColumns,
  type SponsorArrange,
  type SponsorConfig,
  type SponsorItem,
} from "@/lib/studio/sponsors";

function Row({
  label,
  value,
  min,
  max,
  step = 1,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <span className="text-[11px] font-semibold tabular-nums">
          {format ? format(value) : Math.round(value)}
        </span>
      </div>
      <Slider min={min} max={max} step={step} value={[value]} onValueChange={([v]) => onChange(v)} />
    </div>
  );
}

const ARRANGES: { id: SponsorArrange; label: string }[] = [
  { id: "auto", label: "Auto" },
  { id: "row", label: "Linha" },
  { id: "column", label: "Coluna" },
  { id: "grid", label: "Grade" },
];

/**
 * Painel completo da área de patrocinadores: área configurável, organização
 * automática, espaçamentos, alinhamento e controle individual de cada logo.
 */
export function SponsorControls({
  config,
  onChange,
}: {
  config: SponsorConfig;
  onChange: (next: SponsorConfig) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const items = config.items;
  const patch = (p: Partial<SponsorConfig>) => onChange({ ...config, ...p, migrated: true });
  const patchArea = (p: Partial<SponsorConfig["area"]>) =>
    patch({ area: { ...config.area, ...p } });
  const patchItem = (id: string, p: Partial<SponsorItem>) =>
    patch({ items: items.map((it) => (it.id === id ? { ...it, ...p } : it)) });

  return (
    <div className="space-y-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Patrocinadores
      </p>

      {/* --------------------------- lista de logos --------------------------- */}
      <section className="space-y-2 rounded-lg border border-border/60 p-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold">Logos ({items.length})</span>
          <Button
            size="sm"
            variant="secondary"
            className="h-7 px-2 text-[11px]"
            onClick={() => {
              const item = newSponsorItem("", `Patrocinador ${items.length + 1}`);
              patch({ items: [...items, item] });
              setOpenId(item.id);
            }}
          >
            <Plus className="mr-1 size-3.5" /> Adicionar
          </Button>
        </div>

        {items.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">
            Nenhum patrocinador na arte. Use “Adicionar” para enviar uma logo.
          </p>
        ) : null}

        {items.map((item, index) => {
          const open = openId === item.id;
          return (
            <div key={item.id} className="space-y-2 rounded-md border border-border/60 p-2">
              <div className="flex items-center gap-2">
                {item.url ? (
                  <img
                    src={item.url}
                    alt=""
                    className="size-9 shrink-0 rounded bg-secondary object-contain"
                  />
                ) : (
                  <span className="grid size-9 shrink-0 place-items-center rounded bg-secondary text-[10px] text-muted-foreground">
                    {index + 1}
                  </span>
                )}
                <button
                  type="button"
                  className="min-w-0 flex-1 truncate text-left text-xs"
                  onClick={() => setOpenId(open ? null : item.id)}
                >
                  {item.name || `Patrocinador ${index + 1}`}
                </button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  title="Remover"
                  onClick={() => patch({ items: items.filter((it) => it.id !== item.id) })}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>

              {open ? (
                <div className="space-y-2 border-t border-border/60 pt-2">
                  <Input
                    value={item.name ?? ""}
                    placeholder="Nome (opcional)"
                    className="h-8 text-xs"
                    onChange={(e) => patchItem(item.id, { name: e.target.value })}
                  />
                  <MediaPicker
                    label="Logo"
                    category="patrocinador"
                    value={item.url || null}
                    onChange={(url) => patchItem(item.id, { url: url ?? "" })}
                  />
                  <Row
                    label="Escala"
                    value={item.scale}
                    min={0.2}
                    max={3}
                    step={0.05}
                    format={(v) => `${Math.round(v * 100)}%`}
                    onChange={(v) => patchItem(item.id, { scale: v })}
                  />
                  <Row
                    label="Posição X"
                    value={item.offsetX}
                    min={-400}
                    max={400}
                    onChange={(v) => patchItem(item.id, { offsetX: v })}
                  />
                  <Row
                    label="Posição Y"
                    value={item.offsetY}
                    min={-400}
                    max={400}
                    onChange={(v) => patchItem(item.id, { offsetY: v })}
                  />
                  <label className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                    Tamanho manual
                    <Switch
                      checked={item.width != null || item.height != null}
                      onCheckedChange={(on) =>
                        patchItem(item.id, on ? { width: 260, height: 120 } : { width: null, height: null })
                      }
                    />
                  </label>
                  {item.width != null || item.height != null ? (
                    <>
                      <Row
                        label="Largura"
                        value={item.width ?? 260}
                        min={40}
                        max={STORY_WIDTH}
                        step={5}
                        onChange={(v) => patchItem(item.id, { width: v })}
                      />
                      <Row
                        label="Altura"
                        value={item.height ?? 120}
                        min={40}
                        max={800}
                        step={5}
                        onChange={(v) => patchItem(item.id, { height: v })}
                      />
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </section>

      {/* ------------------------------- área --------------------------------- */}
      <section className="space-y-2 rounded-lg border border-border/60 p-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Área no canvas
        </p>
        <Row
          label="Largura"
          value={config.area.width}
          min={80}
          max={STORY_WIDTH}
          step={5}
          onChange={(v) => patchArea({ width: v })}
        />
        <Row
          label="Altura"
          value={config.area.height}
          min={80}
          max={STORY_HEIGHT}
          step={5}
          onChange={(v) => patchArea({ height: v })}
        />
        <Row
          label="Posição X"
          value={config.area.x}
          min={0}
          max={Math.max(0, STORY_WIDTH - config.area.width)}
          step={5}
          onChange={(v) => patchArea({ x: v })}
        />
        <Row
          label="Posição Y"
          value={config.area.y}
          min={0}
          max={Math.max(0, STORY_HEIGHT - config.area.height)}
          step={5}
          onChange={(v) => patchArea({ y: v })}
        />
      </section>

      {/* ---------------------------- organização ----------------------------- */}
      <section className="space-y-2 rounded-lg border border-border/60 p-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Organização
        </p>
        <div className="flex flex-wrap gap-1">
          {ARRANGES.map((a) => (
            <Button
              key={a.id}
              size="sm"
              variant={config.arrange === a.id ? "default" : "secondary"}
              className="h-7 px-2 text-[10px]"
              onClick={() => patch({ arrange: a.id })}
            >
              {a.label}
            </Button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground">
          {resolveColumns(config, items.length)} coluna(s) em uso
        </p>
        {config.arrange === "grid" ? (
          <Row
            label="Colunas"
            value={config.columns}
            min={1}
            max={6}
            onChange={(v) => patch({ columns: Math.round(v) })}
          />
        ) : null}
        <Row
          label="Tamanho das logos"
          value={config.logoScale}
          min={0.2}
          max={2}
          step={0.05}
          format={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => patch({ logoScale: v })}
        />
        <Row
          label="Espaço horizontal"
          value={config.gapX}
          min={0}
          max={200}
          step={2}
          onChange={(v) => patch({ gapX: v })}
        />
        <Row
          label="Espaço vertical"
          value={config.gapY}
          min={0}
          max={200}
          step={2}
          onChange={(v) => patch({ gapY: v })}
        />
        <Row
          label="Margem interna"
          value={config.padding}
          min={0}
          max={120}
          step={2}
          onChange={(v) => patch({ padding: v })}
        />

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Alinhamento horizontal</Label>
          <div className="flex gap-1">
            {([
              ["flex-start", "Esquerda"],
              ["center", "Centro"],
              ["flex-end", "Direita"],
            ] as const).map(([v, label]) => (
              <Button
                key={v}
                size="sm"
                variant={config.alignX === v ? "default" : "secondary"}
                className="h-7 flex-1 px-1 text-[10px]"
                onClick={() => patch({ alignX: v })}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Alinhamento vertical</Label>
          <div className="flex gap-1">
            {([
              ["flex-start", "Topo"],
              ["center", "Centro"],
              ["flex-end", "Base"],
            ] as const).map(([v, label]) => (
              <Button
                key={v}
                size="sm"
                variant={config.alignY === v ? "default" : "secondary"}
                className="h-7 flex-1 px-1 text-[10px]"
                onClick={() => patch({ alignY: v })}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        <label className="flex items-center justify-between gap-2 pt-1 text-[11px] text-muted-foreground">
          Patrocinadores fixos no template
          <Switch checked={config.locked} onCheckedChange={(v) => patch({ locked: v })} />
        </label>
      </section>
    </div>
  );
}
