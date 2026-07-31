import { supabase } from "@/integrations/supabase/client";

export type TeamEvent = {
  id: string;
  title: string;
  event_type: "jogo" | "evento" | "festa" | "outro" | "disponivel";
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  opponent: string | null;
  notes: string | null;
  status: "confirmado" | "pendente" | "disponivel";
};

export const EVENT_FIELDS =
  "id, title, event_type, event_date, start_time, end_time, location, opponent, notes, status";

export const EVENT_TYPES = [
  { value: "jogo", label: "Jogo", dot: "bg-primary" },
  { value: "evento", label: "Evento", dot: "bg-sky-500" },
  { value: "festa", label: "Festa", dot: "bg-fuchsia-500" },
  { value: "outro", label: "Outro", dot: "bg-muted-foreground" },
  { value: "disponivel", label: "Horário disponível", dot: "bg-emerald-500" },
] as const;

export const EVENT_STATUS = [
  { value: "confirmado", label: "Confirmado" },
  { value: "pendente", label: "Pendente" },
  { value: "disponivel", label: "Horário disponível" },
] as const;

export function typeMeta(value: string) {
  return EVENT_TYPES.find((t) => t.value === value) ?? EVENT_TYPES[3];
}

export function statusLabel(value: string) {
  return EVENT_STATUS.find((s) => s.value === value)?.label ?? value;
}

export function formatTime(value: string | null) {
  return value ? value.slice(0, 5) : null;
}

export const eventsQueryOptions = {
  queryKey: ["team_events"],
  queryFn: async (): Promise<TeamEvent[]> => {
    const { data, error } = await supabase
      .from("team_events")
      .select(EVENT_FIELDS)
      .order("event_date")
      .order("start_time", { nullsFirst: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as TeamEvent[];
  },
};

export const availableSlotsQueryOptions = {
  queryKey: ["team_events", "disponivel"],
  queryFn: async (): Promise<TeamEvent[]> => {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("team_events")
      .select(EVENT_FIELDS)
      .eq("event_type", "disponivel")
      .gte("event_date", today)
      .order("event_date")
      .order("start_time", { nullsFirst: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as TeamEvent[];
  },
};
