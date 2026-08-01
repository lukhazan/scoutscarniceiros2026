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

export function interestWhatsappLink(slot: TeamEvent, phone?: string) {
  const date = toLocalDate(slot.event_date).toLocaleDateString("pt-BR");
  const time = formatTime(slot.start_time);
  const message = `Olá! Vi que a ${weekdayLabel(slot.event_date)} ${date}${
    time ? ` às ${time}` : ""
  } está disponível para amistoso e gostaria de conversar sobre essa data.`;
  const number = (phone ?? "").replace(/\D/g, "") || DEFAULT_WHATSAPP_NUMBER;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
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

/* ---------- Agenda de amistosos (horários recorrentes) ---------- */

export type RecurringSlot = {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  location: string | null;
  whatsapp: string | null;
  active: boolean;
};

export const WEEKDAY_OPTIONS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
] as const;

export function weekdayName(value: number) {
  return WEEKDAY_OPTIONS.find((d) => d.value === value)?.label ?? "";
}

export const RECURRING_FIELDS = "id, weekday, start_time, end_time, location, whatsapp, active";

export const recurringSlotsQueryOptions = {
  queryKey: ["recurring_slots"],
  queryFn: async (): Promise<RecurringSlot[]> => {
    const { data, error } = await supabase
      .from("recurring_slots")
      .select(RECURRING_FIELDS)
      .order("weekday")
      .order("start_time");
    if (error) throw new Error(error.message);
    return (data ?? []) as RecurringSlot[];
  },
};

/** Quantas semanas à frente geramos as disponibilidades automáticas. */
export const AVAILABILITY_WEEKS = 8;

export type GeneratedSlot = {
  key: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  whatsapp: string | null;
};

type BusyPeriod = { event_date: string; start_time: string | null; end_time: string | null };

function toISO(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function minutes(value: string) {
  const [h, m] = value.slice(0, 5).split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function overlaps(slot: GeneratedSlot, busy: BusyPeriod) {
  if (!busy.start_time) return true; // compromisso sem horário ocupa o dia todo
  const bStart = minutes(busy.start_time);
  const bEnd = busy.end_time ? minutes(busy.end_time) : bStart + 120;
  return minutes(slot.start_time) < bEnd && bStart < minutes(slot.end_time);
}

export const generatedAvailabilityQueryOptions = {
  queryKey: ["availability", "generated"],
  queryFn: async (): Promise<GeneratedSlot[]> => {
    const { data: slots, error } = await supabase
      .from("recurring_slots")
      .select(RECURRING_FIELDS)
      .eq("active", true);
    if (error) throw new Error(error.message);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const horizon = new Date(today);
    horizon.setDate(horizon.getDate() + AVAILABILITY_WEEKS * 7);

    const { data: busyData, error: busyError } = await supabase.rpc("busy_periods", {
      from_date: toISO(today),
      to_date: toISO(horizon),
    });
    if (busyError) throw new Error(busyError.message);
    const busy = (busyData ?? []) as BusyPeriod[];

    const generated: GeneratedSlot[] = [];
    for (const slot of (slots ?? []) as RecurringSlot[]) {
      const first = new Date(today);
      first.setDate(first.getDate() + ((slot.weekday - today.getDay() + 7) % 7));
      for (let i = 0; i < AVAILABILITY_WEEKS; i += 1) {
        const day = new Date(first);
        day.setDate(day.getDate() + i * 7);
        if (day > horizon) break;
        const item: GeneratedSlot = {
          key: `${slot.id}-${toISO(day)}`,
          date: toISO(day),
          start_time: slot.start_time.slice(0, 5),
          end_time: slot.end_time.slice(0, 5),
          location: slot.location,
          whatsapp: slot.whatsapp,
        };
        const taken = busy.some((b) => b.event_date === item.date && overlaps(item, b));
        if (!taken) generated.push(item);
      }
    }
    return generated.sort((a, b) =>
      a.date === b.date ? a.start_time.localeCompare(b.start_time) : a.date.localeCompare(b.date),
    );
  },
};

export function generatedSlotWhatsappLink(slot: GeneratedSlot, fallbackPhone?: string) {
  const date = toLocalDate(slot.date).toLocaleDateString("pt-BR");
  const message = `Olá! Vi que o horário de ${weekdayLabel(slot.date)} (${date}) das ${
    slot.start_time
  } às ${slot.end_time} está disponível para amistoso e gostaria de conversar sobre essa data.`;
  const number =
    (slot.whatsapp ?? "").replace(/\D/g, "") ||
    (fallbackPhone ?? "").replace(/\D/g, "") ||
    DEFAULT_WHATSAPP_NUMBER;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/* ---------- Solicitações de amistoso ---------- */

export type MatchRequest = {
  id: string;
  team_name: string;
  contact_name: string;
  whatsapp: string;
  request_date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  notes: string | null;
  status: "pendente" | "confirmada" | "recusada";
  created_at: string;
};

export const REQUEST_FIELDS =
  "id, team_name, contact_name, whatsapp, request_date, start_time, end_time, location, notes, status, created_at";

export const requestStatusLabel: Record<MatchRequest["status"], string> = {
  pendente: "Pendente",
  confirmada: "Confirmada",
  recusada: "Recusada",
};

export const matchRequestsQueryOptions = {
  queryKey: ["match_requests"],
  queryFn: async (): Promise<MatchRequest[]> => {
    const { data, error } = await supabase
      .from("match_requests")
      .select(REQUEST_FIELDS)
      .order("request_date")
      .order("start_time");
    if (error) throw new Error(error.message);
    return (data ?? []) as MatchRequest[];
  },
};

const matchRequestSchema = z.object({
  team_name: z.string().trim().min(2, "Informe o nome da equipe").max(80),
  contact_name: z.string().trim().min(2, "Informe o responsável").max(80),
  whatsapp: z
    .string()
    .trim()
    .regex(/^[0-9 ()+-]{8,20}$/, "WhatsApp inválido"),
  request_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Horário inválido"),
  end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Horário inválido"),
  location: z.string().trim().max(120).nullable(),
  notes: z.string().trim().max(500, "Observações muito longas").nullable(),
});

export async function createMatchRequest(input: {
  team_name: string;
  contact_name: string;
  whatsapp: string;
  request_date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  notes: string | null;
}) {
  const parsed = matchRequestSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos");
  }
  const value = parsed.data;
  if (value.end_time <= value.start_time) {
    throw new Error("O horário final deve ser maior que o inicial");
  }
  const { error } = await supabase.from("match_requests").insert({ ...value, status: "pendente" });
  if (error) throw new Error(error.message);
}


/** Confirma a solicitação: cria o jogo na agenda (sem duplicar) e marca como confirmada. */
export async function confirmMatchRequest(request: MatchRequest) {
  const { data: existing, error: findError } = await supabase
    .from("team_events")
    .select("id")
    .eq("event_date", request.request_date)
    .eq("start_time", request.start_time)
    .eq("event_type", "jogo")
    .limit(1);
  if (findError) throw new Error(findError.message);

  if (!existing || existing.length === 0) {
    const { error } = await supabase.from("team_events").insert({
      title: `Amistoso vs ${request.team_name}`,
      event_type: "jogo",
      event_date: request.request_date,
      start_time: request.start_time,
      end_time: request.end_time,
      location: request.location,
      opponent: request.team_name,
      notes: [request.contact_name, request.whatsapp, request.notes].filter(Boolean).join(" · "),
      status: "confirmado",
    });
    if (error) throw new Error(error.message);
  }

  const { error: updateError } = await supabase
    .from("match_requests")
    .update({ status: "confirmada" })
    .eq("id", request.id);
  if (updateError) throw new Error(updateError.message);
}

export async function rejectMatchRequest(id: string) {
  const { error } = await supabase.from("match_requests").update({ status: "recusada" }).eq("id", id);
  if (error) throw new Error(error.message);
}

export function requestWhatsappLink(request: MatchRequest) {
  const number = request.whatsapp.replace(/\D/g, "");
  const date = toLocalDate(request.request_date).toLocaleDateString("pt-BR");
  const message = `Olá ${request.contact_name}! Sobre a solicitação de amistoso da equipe ${request.team_name} em ${date} às ${request.start_time.slice(0, 5)}.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
