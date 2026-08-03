import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CalendarDays, MapPin, Clock, Swords } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/team-data";
import {
  formatTime,
  publicAgendaQueryOptions,
  toLocalDate,
  typeMeta,
  type TeamEvent,
} from "@/lib/agenda-data";

export const Route = createFileRoute("/_authenticated/agenda-time")({
  head: () => ({
    meta: [
      { title: "Agenda do time — Carniceiros Fut 7" },
      {
        name: "description",
        content: "Próximos jogos, eventos e festas do Carniceiros Fut 7 para os atletas.",
      },
      { property: "og:title", content: "Agenda do time — Carniceiros Fut 7" },
      {
        property: "og:description",
        content: "Próximos jogos, eventos e festas do Carniceiros Fut 7 para os atletas.",
      },
    ],
  }),
  component: AgendaTimePage,
});

const FILTERS = [
  { value: "todos", label: "Todos" },
  { value: "jogo", label: "Jogos" },
  { value: "evento", label: "Eventos" },
  { value: "festa", label: "Festas" },
] as const;

function daysUntil(date: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = toLocalDate(date);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function countdownLabel(date: string) {
  const diff = daysUntil(date);
  if (diff <= 0) return "É hoje!";
  if (diff === 1) return "Falta 1 dia";
  return `Faltam ${diff} dias`;
}

function EventLines({ event }: { event: TeamEvent }) {
  const time = formatTime(event.start_time);
  const end = formatTime(event.end_time);
  return (
    <div className="mt-2 grid gap-1 text-sm text-muted-foreground">
      <span className="flex items-center gap-2">
        <CalendarDays className="size-4 shrink-0" />
        {formatDate(event.event_date)}
      </span>
      {time ? (
        <span className="flex items-center gap-2">
          <Clock className="size-4 shrink-0" />
          {time}
          {end ? ` — ${end}` : ""}
        </span>
      ) : null}
      {event.location ? (
        <span className="flex items-center gap-2">
          <MapPin className="size-4 shrink-0" />
          {event.location}
        </span>
      ) : null}
      {event.opponent ? (
        <span className="flex items-center gap-2">
          <Swords className="size-4 shrink-0" />
          {event.opponent}
        </span>
      ) : null}
      {event.notes ? <span className="text-xs">{event.notes}</span> : null}
    </div>
  );
}

function AgendaTimePage() {
  const { data } = useQuery(publicAgendaQueryOptions);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("todos");

  const upcoming = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (data ?? [])
      .filter((e) => toLocalDate(e.event_date).getTime() >= today.getTime())
      .sort((a, b) =>
        a.event_date === b.event_date
          ? (a.start_time ?? "").localeCompare(b.start_time ?? "")
          : a.event_date.localeCompare(b.event_date),
      );
  }, [data]);

  const next = upcoming[0];
  const list = upcoming.filter((e) => filter === "todos" || e.event_type === filter);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="font-display text-2xl">Agenda do time</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Consulte os próximos compromissos do Carniceiros Fut 7.
        </p>

        <section className="mt-4 rounded-xl border border-border bg-card p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Próximo compromisso
          </h2>
          {next ? (
            <div className="mt-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`size-2 rounded-full ${typeMeta(next.event_type).dot}`} />
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  {typeMeta(next.event_type).label}
                </span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {countdownLabel(next.event_date)}
                </span>
              </div>
              <p className="mt-1 font-display text-xl">{next.title}</p>
              <EventLines event={next} />
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Nenhum compromisso agendado por enquanto. Fique de olho, logo teremos novidades!
            </p>
          )}
        </section>

        <div className="mt-6 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Button
              key={f.value}
              size="sm"
              variant={filter === f.value ? "default" : "outline"}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        <ul className="mt-3 grid gap-3">
          {list.map((event) => (
            <li key={event.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`size-2 rounded-full ${typeMeta(event.event_type).dot}`} />
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  {typeMeta(event.event_type).label}
                </span>
              </div>
              <p className="mt-1 font-medium">{event.title}</p>
              <EventLines event={event} />
            </li>
          ))}
          {list.length === 0 ? (
            <li className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nenhum compromisso nesta categoria.
            </li>
          ) : null}
        </ul>
      </main>
    </div>
  );
}
