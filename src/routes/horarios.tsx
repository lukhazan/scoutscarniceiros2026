import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Send } from "lucide-react";
const teamLogo = "/team-logo.png";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/team-data";
import {
  createMatchRequest,
  formatTime,
  generatedAvailabilityQueryOptions,
  publicAgendaQueryOptions,
  statusLabel,
  typeMeta,
  weekdayLabel,
  type GeneratedSlot,
  type TeamEvent,
} from "@/lib/agenda-data";

export const Route = createFileRoute("/horarios")({
  head: () => ({
    meta: [
      { title: "Horários disponíveis — Carniceiros Fut 7" },
      {
        name: "description",
        content: "Datas e horários livres do Carniceiros Fut 7 para marcar amistosos.",
      },
      { property: "og:title", content: "Horários disponíveis — Carniceiros Fut 7" },
      {
        property: "og:description",
        content: "Datas e horários livres do Carniceiros Fut 7 para marcar amistosos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HorariosPublicos,
});

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

type RequestForm = {
  team_name: string;
  contact_name: string;
  whatsapp: string;
  notes: string;
};

function HorariosPublicos() {
  const queryClient = useQueryClient();
  const { data: slots, isLoading } = useQuery(generatedAvailabilityQueryOptions);
  const { data: events } = useQuery(publicAgendaQueryOptions);
  const [slot, setSlot] = useState<GeneratedSlot | null>(null);
  const [form, setForm] = useState<RequestForm>({
    team_name: "",
    contact_name: "",
    whatsapp: "",
    notes: "",
  });
  const [sending, setSending] = useState(false);

  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const byDate = useMemo(() => {
    const map = new Map<string, TeamEvent[]>();
    for (const event of events ?? []) {
      const list = map.get(event.event_date) ?? [];
      list.push(event);
      map.set(event.event_date, list);
    }
    return map;
  }, [events]);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = useMemo(
    () => (events ?? []).filter((e) => e.event_date >= today && e.event_type !== "disponivel").slice(0, 20),
    [events, today],
  );
  const history = useMemo(
    () =>
      (events ?? [])
        .filter((e) => e.event_date < today && e.event_type !== "disponivel")
        .sort((a, b) => b.event_date.localeCompare(a.event_date))
        .slice(0, 20),
    [events, today],
  );

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

  async function submit() {
    if (!slot) return;
    if (!form.team_name.trim() || !form.contact_name.trim() || !form.whatsapp.trim()) {
      toast.error("Preencha equipe, responsável e WhatsApp.");
      return;
    }
    setSending(true);
    try {
      await createMatchRequest({
        team_name: form.team_name.trim().slice(0, 100),
        contact_name: form.contact_name.trim().slice(0, 100),
        whatsapp: form.whatsapp.replace(/\D/g, "").slice(0, 20),
        request_date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        location: slot.location,
        notes: form.notes.trim().slice(0, 500) || null,
      });
      toast.success("Solicitação enviada! O time entrará em contato.");
      setSlot(null);
      setForm({ team_name: "", contact_name: "", whatsapp: "", notes: "" });
      queryClient.invalidateQueries({ queryKey: ["match_requests"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível enviar.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-xl px-4 pb-16 pt-10">
        <div className="flex flex-col items-center text-center">
          <img
            src={teamLogo}
            alt="Escudo do Carniceiros Fut 7"
            width={72}
            height={72}
            className="size-18 object-contain"
          />
          <h1 className="mt-3 font-display text-3xl sm:text-4xl">Horários disponíveis</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Datas livres para marcar amistosos com o Carniceiros Fut 7.
          </p>
        </div>

        <Tabs defaultValue="horarios" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="horarios">Horários</TabsTrigger>
            <TabsTrigger value="agenda">Agenda</TabsTrigger>
          </TabsList>

          <TabsContent value="horarios">
        {isLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Carregando…</p>
        ) : (slots ?? []).length === 0 ? (
          <div className="mt-8 rounded-lg border border-dashed border-border/70 p-8 text-center">
            <CalendarDays className="mx-auto size-6 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              Nenhum horário disponível no momento.
            </p>
          </div>
        ) : (
          <ul className="mt-8 space-y-3">
            {(slots ?? []).map((item) => (
              <li key={item.key} className="rounded-lg border border-border/60 bg-card p-4">
                <p className="font-semibold">
                  {formatDate(item.date)} · {item.start_time} às {item.end_time}
                </p>
                <p className="text-xs capitalize text-muted-foreground">{weekdayLabel(item.date)}</p>
                {item.location && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="size-3.5" /> {item.location}
                  </p>
                )}
                <Button className="mt-3 h-11 w-full" onClick={() => setSlot(item)}>
                  <Send className="mr-2 size-4" /> Solicitar este horário
                </Button>
              </li>
            ))}
          </ul>
        )}

        <section className="mt-6 rounded-lg border border-border/60 bg-card p-3">
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
              <span key={`${d}-${i}`}>{d}</span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {days.map((date, i) => {
              if (!date) return <div key={`empty-${i}`} />;
              const list = (byDate.get(date) ?? []).filter((e) => e.event_type !== "disponivel");
              const isToday = date === today;
              return (
                <div
                  key={date}
                  className={`min-h-12 rounded-md border p-1 text-left text-xs ${
                    isToday ? "border-primary" : "border-border/50"
                  } ${list.length ? "bg-muted/40" : ""}`}
                >
                  <span className={isToday ? "font-bold text-primary" : ""}>
                    {Number(date.slice(8, 10))}
                  </span>
                  <span className="mt-1 flex flex-wrap gap-0.5">
                    {list.slice(0, 3).map((e) => (
                      <span
                        key={e.id}
                        className={`size-1.5 rounded-full ${typeMeta(e.event_type).dot}`}
                      />
                    ))}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

          </TabsContent>

          <TabsContent value="agenda">
        <h2 className="mt-6 font-display text-2xl">Próximos compromissos</h2>
        {upcoming.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nenhum compromisso agendado.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border/60 overflow-hidden rounded-lg border border-border/60 bg-card">
            {upcoming.map((event) => (
              <li key={event.id} className="flex gap-3 px-3 py-3">
                <span
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${typeMeta(event.event_type).dot}`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold leading-tight">{event.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {typeMeta(event.event_type).label}
                    {` · ${formatDate(event.event_date)}`}
                    {formatTime(event.start_time) ? ` · ${formatTime(event.start_time)}` : ""}
                    {formatTime(event.end_time) ? ` às ${formatTime(event.end_time)}` : ""}
                    {` · ${statusLabel(event.status)}`}
                  </span>
                  {event.location && (
                    <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3" /> {event.location}
                    </span>
                  )}
                  {event.opponent && (
                    <span className="block text-xs text-muted-foreground">
                      Adversário: {event.opponent}
                    </span>
                  )}
                  {event.notes && (
                    <span className="block text-xs text-muted-foreground">{event.notes}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}

        {history.length > 0 && (
          <>
            <h2 className="mt-6 font-display text-2xl">Histórico</h2>
            <ul className="mt-3 divide-y divide-border/60 overflow-hidden rounded-lg border border-border/60 bg-card">
              {history.map((event) => (
                <li key={event.id} className="flex items-center gap-3 px-3 py-3">
                  <span className={`size-2 shrink-0 rounded-full ${typeMeta(event.event_type).dot}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold leading-tight">{event.title}</span>
                    <span className="block text-xs text-muted-foreground">
                      {formatDate(event.event_date)}
                      {` · ${typeMeta(event.event_type).label}`}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
          </TabsContent>
        </Tabs>

      </main>

      <Dialog open={!!slot} onOpenChange={(o) => !o && setSlot(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Solicitar horário</DialogTitle>
            <DialogDescription>
              {slot
                ? `${formatDate(slot.date)} · ${slot.start_time} às ${slot.end_time}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="req-team">Nome da equipe</Label>
              <Input
                id="req-team"
                className="h-11"
                value={form.team_name}
                onChange={(e) => setForm({ ...form, team_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="req-name">Responsável</Label>
              <Input
                id="req-name"
                className="h-11"
                value={form.contact_name}
                onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="req-zap">WhatsApp</Label>
              <Input
                id="req-zap"
                inputMode="numeric"
                placeholder="5511987654321"
                className="h-11"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="req-obs">Observações (opcional)</Label>
              <Textarea
                id="req-obs"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button className="h-11 w-full" onClick={submit} disabled={sending}>
              {sending ? "Enviando…" : "Enviar solicitação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
