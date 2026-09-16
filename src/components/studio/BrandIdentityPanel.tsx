import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MediaPicker } from "@/components/studio/MediaPicker";
import { brandIdentityQueryOptions, type BrandIdentity } from "@/lib/studio-data";

type Form = Omit<BrandIdentity, "id">;

const EMPTY: Form = {
  team_name: "Carniceiros Fut 7",
  crest_url: null,
  crest_white_url: null,
  crest_black_url: null,
  footer_logo_url: null,
  primary_color: "#e11d2e",
  secondary_color: "#111111",
  accent_color: "#ffffff",
  font_primary: "Anton",
  font_secondary: "Inter",
  watermark_url: null,
  sponsors: [],
  short_name: null,
  modality: "fut7",
  city: null,
  state: null,
  contact_email: null,
};

function ColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide">
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded-md border border-border/60 bg-transparent"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-9" />
      </div>
    </div>
  );
}

export function BrandIdentityPanel() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery(brandIdentityQueryOptions);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      const { id: _id, ...rest } = data;
      setForm({ ...EMPTY, ...rest });
    }
  }, [data]);

  const set = (patch: Partial<Form>) => setForm((prev) => ({ ...prev, ...patch }));

  async function handleSave() {
    setSaving(true);
    try {
      if (data?.id) {
        const { error } = await supabase
          .from("brand_identity")
          .update(form)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("brand_identity").insert(form);
        if (error) throw error;
      }
      await queryClient.invalidateQueries({ queryKey: ["brand-identity"] });
      toast.success("Identidade visual salva.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">
        <Loader2 className="mr-2 inline size-4 animate-spin" /> Carregando…
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Configure uma única vez. Todas as artes usam automaticamente estes dados.
      </p>

      <div className="space-y-1.5">
        <Label htmlFor="team-name" className="text-xs font-semibold uppercase tracking-wide">
          Nome da equipe
        </Label>
        <Input
          id="team-name"
          value={form.team_name}
          onChange={(e) => set({ team_name: e.target.value })}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <MediaPicker
          label="Escudo principal"
          category="escudo"
          value={form.crest_url}
          onChange={(v) => set({ crest_url: v })}
        />
        <MediaPicker
          label="Escudo branco"
          category="escudo"
          value={form.crest_white_url}
          onChange={(v) => set({ crest_white_url: v })}
        />
        <MediaPicker
          label="Escudo preto"
          category="escudo"
          value={form.crest_black_url}
          onChange={(v) => set({ crest_black_url: v })}
        />
        <MediaPicker
          label="Logo do rodapé"
          category="escudo"
          value={form.footer_logo_url}
          onChange={(v) => set({ footer_logo_url: v })}
        />
        <MediaPicker
          label="Marca d'água"
          category="escudo"
          value={form.watermark_url}
          onChange={(v) => set({ watermark_url: v })}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <ColorField
          id="c-primary"
          label="Cor primária"
          value={form.primary_color}
          onChange={(v) => set({ primary_color: v })}
        />
        <ColorField
          id="c-secondary"
          label="Cor secundária"
          value={form.secondary_color}
          onChange={(v) => set({ secondary_color: v })}
        />
        <ColorField
          id="c-accent"
          label="Cor destaque"
          value={form.accent_color}
          onChange={(v) => set({ accent_color: v })}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="f1" className="text-xs font-semibold uppercase tracking-wide">
            Fonte principal
          </Label>
          <Input
            id="f1"
            value={form.font_primary}
            onChange={(e) => set({ font_primary: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="f2" className="text-xs font-semibold uppercase tracking-wide">
            Fonte secundária
          </Label>
          <Input
            id="f2"
            value={form.font_secondary}
            onChange={(e) => set({ font_secondary: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide">
          Patrocinadores oficiais
        </Label>
        <div className="flex flex-wrap gap-2">
          {form.sponsors.map((src, i) => (
            <div key={i} className="relative">
              <img
                src={src}
                alt=""
                className="h-16 w-24 rounded-md border border-border/60 bg-secondary object-contain"
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="absolute -right-1 -top-1 h-6 px-1 text-xs"
                onClick={() =>
                  set({ sponsors: form.sponsors.filter((_, idx) => idx !== i) })
                }
              >
                ×
              </Button>
            </div>
          ))}
        </div>
        <MediaPicker
          label="Adicionar patrocinador"
          category="patrocinador"
          value={null}
          onChange={(v) => v && set({ sponsors: [...form.sponsors, v] })}
        />
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <Save className="mr-2 size-4" />
        )}
        Salvar identidade visual
      </Button>
    </div>
  );
}
