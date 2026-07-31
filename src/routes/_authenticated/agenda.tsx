import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Share2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { MatchRequestsSection } from "@/components/MatchRequestsSection";
import { RecurringSlotsSection } from "@/components/RecurringSlotsSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/team-data";
import {
  EVENT_STATUS,
  EVENT_TYPES,
  eventsQueryOptions,
  formatTime,
  saveWhatsappNumber,
  statusLabel,
  typeMeta,
  whatsappNumberQueryOptions,
  type TeamEvent,
} from "@/lib/agenda-data";

export const Route = createFileRoute("/_authenticated/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda — Carniceiros Fut 7" },
      {
        name: "description",
        content: "Calendário com jogos, eventos, festas e horários disponíveis do time.",
      },
      { property: "og:title", content: "Agenda — Carniceiros Fut 7" },
      {
        property: "og:description",
        content: "Calendário com jogos, eventos, festas e horários disponíveis do time.",
      },
    ],
  }),
  component: AgendaPage,
});

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

type FormState = {
  id?: string;
  title: string;
  event_type: TeamEvent["event_type"];
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
  opponent: string;
  notes: string;
  status: TeamEvent["status"];
};

function emptyForm(date?: string): FormState {
  return {
    title: "",
    event_type: "jogo",
    event_date: date ?? new Date().toISOString().slice(0, 10),
    start_time: "",
    end_time: "",
    location: "",
    opponent: "",
    notes: "",
    status: "pendente",
  };
}

function AgendaPage() {
  const isAdmin = useIsAdmin();
  const queryClient = useQueryClient();
  const { data: events, isLoading } = useQuery(eventsQueryOptions);
  const { data: whatsappNumber } = useQuery(whatsappNumberQueryOptions);
  const [phoneDraft, setPhoneDraft] = useState<string | null>(null);
  const [savingPhone, setSavingPhone] = useState(false);
  const phoneInput = phoneDraft ?? whatsappNumber ?? "";
  const setPhoneInput = setPhoneDraft;

  async function handleSavePhone() {
    const digits = phoneInput.replace(/\D/g, "");
    if (digits.length < 10) {
      toast.error("Informe o número com DDI e DDD, ex.: 5511987654321.");
      return;
    }
    setSavingPhone(true);
    try {
      await saveWhatsappNumber(digits);
      setPhoneDraft(digits);
      toast.success("Número de WhatsApp atualizado.");
      queryClient.invalidateQueries({ queryKey: ["team_settings", "whatsapp_number"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSavingPhone(false);
    }
  }

  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selected, setSelected] = useState<TeamEvent | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  const byDate = useMemo(() => {
    const map = new Map<string, TeamEvent[]>();
    for (const event of events ?? []) {
      const list = map.get(event.event_date) ?? [];
      list.push(event);
      map.set(event.event_date, list);
    }
    return map;
  }, [events]);

  const upcoming = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return (events ?? []).filter((e) => e.event_date >= today).slice(0, 20);
  }, [events]);

  const days = useMemo(() => {
    const first = new Date(cursor.year, cursor.month, 1);
    const total = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const cells: (string | null)[] = Array.from({ length: first.getDay() }, () => null);
    for (let d = 1; d <= total; d += 1) {
      cells.push(
        `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      );
    }
    return cells;
  }, [cursor]);

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  function shiftMonth(delta: number) {
    setCursor((c) => {
      const next = new Date(c.year, c.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  }

  async function copyPublicLink() {
    const url = `${window.location.origin}/horarios`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link dos horários disponíveis copiado!");
    } catch {
      toast.error(url);
    }
  }

  function openEdit(event: TeamEvent) {
    setSelected(null);
    setForm({
      id: event.id,
      title: event.title,
      event_type: event.event_type,
      event_date: event.event_date,
      start_time: formatTime(event.start_time) ?? "",
      end_time: formatTime(event.end_time) ?? "",
      location: event.location ?? "",
      opponent: event.opponent ?? "",
      notes: event.notes ?? "",
      status: event.status,
    });
  }

  async function saveForm() {
    if (!form) return;
    if (!form.title.trim()) {
      toast.error("Informe um título.");
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      event_type: form.event_type,
      event_date: form.event_date,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      location: form.location.trim() || null,
      opponent: form.opponent.trim() || null,
      notes: form.notes.trim() || null,
      status: form.status,
    };
    const { error } = form.id
      ? await supabase.from("team_events").update(payload).eq("id", form.id)
      : await supabase.from("team_events").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Compromisso salvo.");
    setForm(null);
    queryClient.invalidateQueries({ queryKey: ["team_events"] });
    queryClient.invalidateQueries({ queryKey: ["availability", "generated"] });
  }

  async function removeEvent(id: string) {
    const { error } = await supabase.from("team_events").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSelected(null);
    toast.success("Compromisso removido.");
    queryClient.invalidateQueries({ queryKey: ["team_events"] });
    queryClient.invalidateQueries({ queryKey: ["availability", "generated"] });
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 pb-[calc(4rem+env(safe-area-inset-bottom))] pt-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-3xl leading-none sm:text-4xl">Agenda</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Jogos, eventos, festas e horários livres do time.
            </p>
          </div>
          {isAdmin && (
            <Button className="h-11 shrink-0" onClick={() => setForm(emptyForm())}>
              <Plus className="mr-1 size-4" /> Novo
            </Button>
          )}
        </div>

        {isAdmin && (
          <Button variant="outline" className="mt-4 h-11 w-full" onClick={copyPublicLink}>
            <Share2 className="mr-2 size-4" /> Compartilhar horários disponíveis
          </Button>
        )}

        {isAdmin && (
          <section className="mt-4 rounded-lg border border-border/60 bg-card p-4">
            <Label htmlFor="whatsapp-number">WhatsApp oficial do time</Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Usado no botão “Tenho interesse” da página pública. Formato internacional, ex.:
              5511987654321.
            </p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <Input
                id="whatsapp-number"
                inputMode="numeric"
                placeholder="5511987654321"
                className="h-11"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
              />
              <Button className="h-11 shrink-0" onClick={handleSavePhone} disabled={savingPhone}>
                Salvar
              </Button>
            </div>
          </section>
        )}

        {isAdmin && <RecurringSlotsSection />}

        {isAdmin && <MatchRequestsSection />}

        <section className="mt-5 rounded-lg border border-border/60 bg-card p-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => shiftMonth(-1)} aria-label="Mês anterior">
              <ChevronLeft className="size-4" />
            </Button>
            <p className="font-semibold capitalize">{monthLabel}</p>
            <Button variant="ghost" size="icon" onClick={() => shiftMonth(1)} aria-label="Próximo mês">
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">
            {WEEKDAYS.map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {days.map((date, i) => {
              if (!date) return <div key={`empty-${i}`} />;
              const list = byDate.get(date) ?? [];
              const today = date === new Date().toISOString().slice(0, 10);
              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => {
                    if (list[0]) setSelected(list[0]);
                    else if (isAdmin) setForm(emptyForm(date));
                  }}
                  className={`min-h-12 rounded-md border p-1 text-left text-xs ${
                    today ? "border-primary" : "border-border/50"
                  } ${list.length ? "bg-muted/40" : ""}`}
                >
                  <span className={today ? "font-bold text-primary" : ""}>
                    {Number(date.slice(8, 10))}
                  </span>
                  <span className="mt-1 flex flex-wrap gap-0.5">
                    {list.slice(0, 3).map((e) => (
                      <span key={e.id} className={`size-1.5 rounded-full ${typeMeta(e.event_type).dot}`} />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            {EVENT_TYPES.map((t) => (
              <span key={t.value} className="flex items-center gap-1">
                <span className={`size-1.5 rounded-full ${t.dot}`} /> {t.label}
              </span>
            ))}
          </div>
        </section>

        <h2 className="mt-6 font-display text-2xl">Próximos compromissos</h2>
        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Carregando…</p>
        ) : upcoming.length === 0 ? (
          <div className="mt-3 rounded-lg border border-dashed border-border/70 p-8 text-center">
            <CalendarDays className="mx-auto size-6 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Nenhum compromisso agendado.</p>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-border/60 overflow-hidden rounded-lg border border-border/60 bg-card">
            {upcoming.map((event) => (
              <li key={event.id}>
                <button
                  type="button"
                  onClick={() => setSelected(event)}
                  className="flex w-full items-center gap-3 px-3 py-3 text-left"
                >
                  <span className={`size-2 shrink-0 rounded-full ${typeMeta(event.event_type).dot}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold leading-tight">{event.title}</span>
                    <span className="block text-xs text-muted-foreground">
                      {formatDate(event.event_date)}
                      {formatTime(event.start_time) ? ` · ${formatTime(event.start_time)}` : ""}
                      {` · ${typeMeta(event.event_type).label}`}
                      {` · ${statusLabel(event.status)}`}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>

      {/* Detalhes */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.title}</DialogTitle>
                <DialogDescription>
                  {typeMeta(selected.event_type).label} · {statusLabel(selected.status)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>Data:</strong> {formatDate(selected.event_date)}
                </p>
                {formatTime(selected.start_time) && (
                  <p>
                    <strong>Horário:</strong> {formatTime(selected.start_time)}
                    {formatTime(selected.end_time) ? ` às ${formatTime(selected.end_time)}` : ""}
                  </p>
                )}
                {selected.location && (
                  <p>
                    <strong>Local:</strong> {selected.location}
                  </p>
                )}
                {selected.opponent && (
                  <p>
                    <strong>Adversário:</strong> {selected.opponent}
                  </p>
                )}
                {selected.notes && (
                  <p>
                    <strong>Observações:</strong> {selected.notes}
                  </p>
                )}
              </div>
              {isAdmin && (
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => removeEvent(selected.id)}>
                    <Trash2 className="mr-1 size-4 text-destructive" /> Excluir
                  </Button>
                  <Button onClick={() => openEdit(selected)}>Editar</Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Formulário */}
      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form?.id ? "Editar compromisso" : "Novo compromisso"}</DialogTitle>
            <DialogDescription>Preencha os dados do compromisso do time.</DialogDescription>
          </DialogHeader>
          {form && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  className="h-11"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tipo</Label>
                  <Select
                    value={form.event_type}
                    onValueChange={(v) =>
                      setForm({
                        ...form,
                        event_type: v as TeamEvent["event_type"],
                        status: v === "disponivel" ? "disponivel" : form.status,
                      })
                    }
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setForm({ ...form, status: v as TeamEvent["status"] })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_STATUS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="date">Data</Label>
                  <Input
                    id="date"
                    type="date"
                    className="h-11"
                    value={form.event_date}
                    onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="start">Início</Label>
                  <Input
                    id="start"
                    type="time"
                    className="h-11"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end">Fim</Label>
                  <Input
                    id="end"
                    type="time"
                    className="h-11"
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="local">Local</Label>
                  <Input
                    id="local"
                    className="h-11"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="adv">Adversário</Label>
                  <Input
                    id="adv"
                    className="h-11"
                    value={form.opponent}
                    onChange={(e) => setForm({ ...form, opponent: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="obs">Observações</Label>
                <Textarea
                  id="obs"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)}>
              Cancelar
            </Button>
            <Button onClick={saveForm} disabled={saving}>
              {saving ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
