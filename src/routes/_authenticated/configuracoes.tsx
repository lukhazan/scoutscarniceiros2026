import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGate } from "@/components/AdminGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MediaPicker } from "@/components/studio/MediaPicker";
import {
  brandIdentityQueryOptions,
  MODALITIES,
  type BrandIdentity,
} from "@/lib/studio-data";
import {
  whatsappNumberQueryOptions,
  saveWhatsappNumber,
} from "@/lib/agenda-data";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações da equipe — Carniceiros Fut 7" },
      {
        name: "description",
        content:
          "Dados básicos da equipe: nome, escudo, modalidade, cidade e contatos.",
      },
      { property: "og:title", content: "Configurações da equipe" },
      {
        property: "og:description",
        content: "Centralize os dados da equipe em um único lugar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AdminGate>
      <SettingsPage />
    </AdminGate>
  ),
});

type TeamForm = {
  team_name: string;
  short_name: string;
  crest_url: string | null;
  modality: string;
  city: string;
  state: string;
  contact_email: string;
};

const EMPTY: TeamForm = {
  team_name: "",
  short_name: "",
  crest_url: null,
  modality: "fut7",
  city: "",
  state: "",
  contact_email: "",
};

function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: brand, isLoading } = useQuery(brandIdentityQueryOptions);
  const { data: whatsapp } = useQuery(whatsappNumberQueryOptions);
  const [form, setForm] = useState<TeamForm>(EMPTY);
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (brand) {
      setForm({
        team_name: brand.team_name ?? "",
        short_name: brand.short_name ?? "",
        crest_url: brand.crest_url,
        modality: brand.modality ?? "fut7",
        city: brand.city ?? "",
        state: brand.state ?? "",
        contact_email: brand.contact_email ?? "",
      });
    }
  }, [brand]);

  useEffect(() => {
    if (whatsapp) setPhone(whatsapp);
  }, [whatsapp]);

  const set = (patch: Partial<TeamForm>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        team_name: form.team_name.trim() || "Minha equipe",
        short_name: form.short_name.trim() || null,
        crest_url: form.crest_url,
        modality: form.modality,
        city: form.city.trim() || null,
        state: form.state.trim().toUpperCase() || null,
        contact_email: form.contact_email.trim() || null,
      };

      if (brand?.id) {
        const { error } = await supabase
          .from("brand_identity")
          .update(payload)
          .eq("id", brand.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("brand_identity").insert(payload);
        if (error) throw error;
      }

      await saveWhatsappNumber(phone);
      await queryClient.invalidateQueries({ queryKey: ["brand-identity"] });
      await queryClient.invalidateQueries({
        queryKey: ["team_settings", "whatsapp_number"],
      });
      toast.success("Configurações salvas.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Não foi possível salvar.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 inline size-4 animate-spin" /> Carregando…
      </p>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6">
      <header className="space-y-1">
        <h1 className="font-display text-3xl">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Informações da equipe usadas em todo o sistema.
        </p>
      </header>

      <section className="space-y-4 rounded-xl border border-border/70 bg-card p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Informações da equipe
        </h2>

        <div className="space-y-1.5">
          <Label htmlFor="team_name">Nome da equipe</Label>
          <Input
            id="team_name"
            value={form.team_name}
            onChange={(e) => set({ team_name: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="short_name">Nome curto / apelido</Label>
          <Input
            id="short_name"
            value={form.short_name}
            onChange={(e) => set({ short_name: e.target.value })}
            placeholder="Ex.: Carniceiros"
          />
        </div>

        <MediaPicker
          label="Logo / escudo"
          category="escudo"
          value={form.crest_url}
          onChange={(v) => set({ crest_url: v })}
        />

        <div className="space-y-1.5">
          <Label htmlFor="modality">Modalidade</Label>
          <select
            id="modality"
            value={form.modality}
            onChange={(e) => set({ modality: e.target.value })}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {MODALITIES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
          <div className="space-y-1.5">
            <Label htmlFor="city">Cidade</Label>
            <Input
              id="city"
              value={form.city}
              onChange={(e) => set({ city: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="state">UF</Label>
            <Input
              id="state"
              maxLength={2}
              value={form.state}
              onChange={(e) => set({ state: e.target.value })}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border/70 bg-card p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Contato
        </h2>

        <div className="space-y-1.5">
          <Label htmlFor="whatsapp">WhatsApp de contato</Label>
          <Input
            id="whatsapp"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="5511999999999"
          />
          <p className="text-xs text-muted-foreground">
            Mesmo número usado na agenda pública.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail de contato</Label>
          <Input
            id="email"
            type="email"
            value={form.contact_email}
            onChange={(e) => set({ contact_email: e.target.value })}
          />
        </div>
      </section>

      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        {saving ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <Save className="mr-2 size-4" />
        )}
        Salvar configurações
      </Button>
    </div>
  );
}
