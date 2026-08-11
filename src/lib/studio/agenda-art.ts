import type { TeamEvent } from "@/lib/agenda-data";

/** Item de agenda usado apenas para desenhar a arte (nunca grava na Agenda). */
export type AgendaArtItem = {
  id: string;
  weekday: string;
  date: string;
  time: string;
  type: "jogo" | "evento" | "festa" | "outro";
  title: string;
  opponent: string;
  location: string;
};

export const MAX_AGENDA_ITEMS = 5;

function startOfWeek(base: Date) {
  const d = new Date(base);
  d.setHours(0, 0, 0, 0);
  const diff = (d.getDay() + 6) % 7; // segunda-feira como início
  d.setDate(d.getDate() - diff);
  return d;
}

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function weekRange(offset: number) {
  const start = startOfWeek(new Date());
  start.setDate(start.getDate() + offset * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { start: toISO(start), end: toISO(end), startDate: start, endDate: end };
}

export function weekRangeLabel(offset: number) {
  const { startDate, endDate } = weekRange(offset);
  const fmt = (d: Date) =>
    d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
  return `${fmt(startDate)} — ${fmt(endDate)}`;
}

function parseDate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function weekdayShort(dateISO: string) {
  return parseDate(dateISO)
    .toLocaleDateString("pt-BR", { weekday: "long" })
    .replace("-feira", "")
    .toUpperCase();
}

export function dayMonth(dateISO: string) {
  return parseDate(dateISO)
    .toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
    .replace(".", "")
    .toUpperCase();
}

/** Converte compromissos públicos da Agenda existente em itens de arte (leitura). */
export function eventsToAgendaItems(events: TeamEvent[], offset: number): AgendaArtItem[] {
  const { start, end } = weekRange(offset);
  return events
    .filter(
      (e) =>
        e.public_visible &&
        e.event_type !== "disponivel" &&
        e.status !== "disponivel" &&
        e.event_date >= start &&
        e.event_date <= end,
    )
    .sort((a, b) =>
      a.event_date === b.event_date
        ? (a.start_time ?? "").localeCompare(b.start_time ?? "")
        : a.event_date.localeCompare(b.event_date),
    )
    .slice(0, MAX_AGENDA_ITEMS)
    .map((e) => ({
      id: e.id,
      weekday: weekdayShort(e.event_date),
      date: dayMonth(e.event_date),
      time: e.start_time ? e.start_time.slice(0, 5) : "",
      type: (e.event_type === "disponivel" ? "outro" : e.event_type) as AgendaArtItem["type"],
      title: e.title,
      opponent: e.opponent ?? "",
      location: e.location ?? "",
    }));
}

export function emptyAgendaItem(): AgendaArtItem {
  const today = new Date();
  const iso = toISO(today);
  return {
    id: `manual-${Math.random().toString(36).slice(2, 9)}`,
    weekday: weekdayShort(iso),
    date: dayMonth(iso),
    time: "20:30",
    type: "jogo",
    title: "",
    opponent: "",
    location: "",
  };
}
