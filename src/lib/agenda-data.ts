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

/** Número de WhatsApp padrão, usado só enquanto o admin não configurar um. */
export const DEFAULT_WHATSAPP_NUMBER = "5511999999999";

export const whatsappNumberQueryOptions = {
  queryKey: ["team_settings", "whatsapp_number"],
  queryFn: async (): Promise<string> => {
    const { data, error } = await supabase
      .from("team_settings")
      .select("value")
      .eq("key", "whatsapp_number")
      .maybeSingle();
    if (error) throw new Error(error.message);
    const digits = (data?.value ?? "").replace(/\D/g, "");
    return digits || DEFAULT_WHATSAPP_NUMBER;
  },
};

export async function saveWhatsappNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  const { error } = await supabase
    .from("team_settings")
    .upsert({ key: "whatsapp_number", value: digits }, { onConflict: "key" });
  if (error) throw new Error(error.message);
  return digits;
}


export function toLocalDate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function isThursday(value: string) {
  return toLocalDate(value).getDay() === 4;
}

export function weekdayLabel(value: string) {
  return toLocalDate(value).toLocaleDateString("pt-BR", { weekday: "long" });
}

export function interestWhatsappLink(slot: TeamEvent) {
  const date = toLocalDate(slot.event_date).toLocaleDateString("pt-BR");
  const time = formatTime(slot.start_time);
  const message = `Olá! Vi que a ${weekdayLabel(slot.event_date)} ${date}${
    time ? ` às ${time}` : ""
  } está disponível para amistoso e gostaria de conversar sobre essa data.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
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
