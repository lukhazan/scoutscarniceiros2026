import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { DEFAULT_ADJUST, type PhotoAdjust } from "@/lib/player-photo";

type Props = {
  value: PhotoAdjust;
  onChange: (next: PhotoAdjust) => void;
};

function Row({
  id,
  label,
  hint,
  min,
  max,
  step = 1,
  value,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id} className="text-xs font-semibold">
          {label}
        </Label>
        {hint ? <span className="text-[11px] text-muted-foreground">{hint}</span> : null}
      </div>
      <Slider
        id={id}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  );
}

export function PhotoCutoutEditor({ value, onChange }: Props) {
  const set = (patch: Partial<PhotoAdjust>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-3 rounded-md border border-border/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">Ajustar recorte</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8"
          onClick={() => onChange(DEFAULT_ADJUST)}
        >
          <RotateCcw className="mr-1 size-3.5" /> Redefinir
        </Button>
      </div>
      <Row
        id="adj-zoom"
        label="Aproximação"
        hint={`${value.zoom.toFixed(1)}x`}
        min={1}
        max={3}
        step={0.1}
        value={value.zoom}
        onChange={(v) => set({ zoom: v })}
      />
      <Row
        id="adj-x"
        label="Posição horizontal"
        min={-100}
        max={100}
        value={value.offsetX}
        onChange={(v) => set({ offsetX: v })}
      />
      <Row
        id="adj-y"
        label="Posição vertical"
        min={-100}
        max={100}
        value={value.offsetY}
        onChange={(v) => set({ offsetY: v })}
      />
      <Row
        id="adj-trim"
        label="Aparar bordas"
        hint="remove sobras do fundo"
        min={0}
        max={60}
        value={value.trim}
        onChange={(v) => set({ trim: v })}
      />
      <Row
        id="adj-smooth"
        label="Suavizar bordas"
        min={0}
        max={100}
        value={value.smooth}
        onChange={(v) => set({ smooth: v })}
      />
    </div>
  );
}
