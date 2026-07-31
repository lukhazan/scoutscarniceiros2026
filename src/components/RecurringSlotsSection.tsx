import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  recurringSlotsQueryOptions,
  weekdayName,
  WEEKDAY_OPTIONS,
  type RecurringSlot,
} from "@/lib/agenda-data";

type Draft = {
  id?: string;
  weekday: number;
  start_time: string;
  end_time: string;
  location: string;
  whatsapp: string;
  active: boolean;
};

function emptyDraft(): Draft {
  return {
    weekday: 4,
    start_time: "20:00",
    end_time: "22:00",
    location: "",
    whatsapp: "",
    active: true,
  };
}

export function RecurringSlotsSection() {
  const queryClient = useQueryClient();
  const { data: slots } = useQuery(recurringSlotsQueryOptions);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["recurring_slots"] });
    queryClient.invalidateQueries({ queryKey: ["availability", "generated"] });
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    const payload = {
      weekday: draft.weekday,
      start_time: draft.start_time,
      end_time: draft.end_time,
      location: draft.location.trim() || null,
      whatsapp: draft.whatsapp.replace(/\D/g, "") || null,
      active: draft.active,
    };
    const { error } = draft.id
      ? await supabase.from("recurring_slots").update(payload).eq("id", draft.id)
      : await supabase.from("recurring_slots").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Agenda de amistosos atualizada.");
    setDraft(null);
    refresh();
  }

  async function toggleActive(slot: RecurringSlot, active: boolean) {
    const { error } = await supabase.from("recurring_slots").update({ active }).eq("id", slot.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    refresh();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("recurring_slots").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Horário recorrente removido.");
    refresh();
  }

  return (
    <section className="mt-4 rounded-lg border border-border/60 bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <Label>Agenda de Amistosos</Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Horários recorrentes livres. A página pública é gerada automaticamente a partir daqui.
          </p>
        </div>
        <Button
          variant="outline"
          className="h-11 shrink-0"
          onClick={() => setDraft(draft ? null : emptyDraft())}
        >
          <Plus className="mr-1 size-4" /> Adicionar
        </Button>
      </div>

      {(slots ?? []).length > 0 && (
        <ul className="mt-3 divide-y divide-border/60 rounded-md border border-border/60">
          {(slots ?? []).map((slot) => (
            <li key={slot.id} className="flex items-center gap-3 px-3 py-2.5">
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() =>
                  setDraft({
                    id: slot.id,
                    weekday: slot.weekday,
                    start_time: slot.start_time.slice(0, 5),
                    end_time: slot.end_time.slice(0, 5),
                    location: slot.location ?? "",
                    whatsapp: slot.whatsapp ?? "",
                    active: slot.active,
                  })
                }
              >
                <span className="block truncate text-sm font-semibold">
                  {weekdayName(slot.weekday)} · {slot.start_time.slice(0, 5)} às{" "}
                  {slot.end_time.slice(0, 5)}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {slot.location || "Sem local definido"}
                </span>
              </button>
              <Switch
                checked={slot.active}
                onCheckedChange={(v) => toggleActive(slot, v)}
                aria-label="Ativo"
              />
              <Button variant="ghost" size="icon" onClick={() => remove(slot.id)} aria-label="Excluir">
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {draft && (
        <div className="mt-3 space-y-3 rounded-md border border-border/60 p-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <Label>Dia da semana</Label>
              <Select
                value={String(draft.weekday)}
                onValueChange={(v) => setDraft({ ...draft, weekday: Number(v) })}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEEKDAY_OPTIONS.map((d) => (
                    <SelectItem key={d.value} value={String(d.value)}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="rec-start">Início</Label>
              <Input
                id="rec-start"
                type="time"
                className="h-11"
                value={draft.start_time}
                onChange={(e) => setDraft({ ...draft, start_time: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="rec-end">Fim</Label>
              <Input
                id="rec-end"
                type="time"
                className="h-11"
                value={draft.end_time}
                onChange={(e) => setDraft({ ...draft, end_time: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="rec-local">Local padrão</Label>
              <Input
                id="rec-local"
                className="h-11"
                value={draft.location}
                onChange={(e) => setDraft({ ...draft, location: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="rec-zap">WhatsApp para contato</Label>
              <Input
                id="rec-zap"
                inputMode="numeric"
                placeholder="5511987654321"
                className="h-11"
                value={draft.whatsapp}
                onChange={(e) => setDraft({ ...draft, whatsapp: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="rec-active"
              checked={draft.active}
              onCheckedChange={(v) => setDraft({ ...draft, active: v })}
            />
            <Label htmlFor="rec-active">Ativo</Label>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="h-11" onClick={() => setDraft(null)}>
              Cancelar
            </Button>
            <Button className="h-11" onClick={save} disabled={saving}>
              {saving ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
