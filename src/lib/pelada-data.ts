import { supabase } from "@/integrations/supabase/client";

export type PeladaStatus = "aberta" | "fechada" | "cancelada";

export type Pelada = {
  id: string;
  name: string;
  weekday: number | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  next_date: string | null;
  max_players: number | null;
  status: PeladaStatus;
  confirm_deadline: string | null;
  notes: string | null;
  public_token: string;
  kind: PeladaKind;
  position_slots: Record<string, number>;
};

export type PeladaKind = "pelada" | "amistoso";

export type PeladaParticipant = {
  id: string;
  pelada_id: string;
  player_id: string | null;
  guest_name: string | null;
  status: "confirmado" | "fora" | "espera";
  team_no: number | null;
  created_at: string;
  confirmed_at: string;
};

export const PELADA_FIELDS =
  "id, name, weekday, start_time, end_time, location, next_date, max_players, status, confirm_deadline, notes, public_token, kind, position_slots";

export const PARTICIPANT_FIELDS =
  "id, pelada_id, player_id, guest_name, status, team_no, created_at, confirmed_at";

export const PELADA_STATUS_OPTIONS = [
  { value: "aberta", label: "Aberta" },
  { value: "fechada", label: "Fechada" },
  { value: "cancelada", label: "Cancelada" },
] as const;

export const WEEKDAYS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
] as const;

export function weekdayLabel(value: number | null) {
  return WEEKDAYS.find((d) => d.value === value)?.label ?? "";
}

/** Pelada ativa mais recente (versão enxuta: uma pelada por equipe). */
export const currentPeladaQueryOptions = peladaQueryOptions("pelada");

export function peladaQueryOptions(kind: PeladaKind) {
  return {
  queryKey: ["pelada", "current", kind],
  queryFn: async (): Promise<Pelada | null> => {
    const { data, error } = await supabase
      .from("peladas")
      .select(PELADA_FIELDS)
      .eq("kind", kind)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as unknown as Pelada | null) ?? null;
  },
  };
}

export function peladaByTokenQueryOptions(token: string) {
  return {
    queryKey: ["pelada", "token", token],
    queryFn: async (): Promise<Pelada | null> => {
      const { data, error } = await supabase
        .from("peladas")
        .select(PELADA_FIELDS)
        .eq("public_token", token)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data as unknown as Pelada | null) ?? null;
    },
  };
}

export function participantsQueryOptions(peladaId: string | null | undefined) {
  return {
    queryKey: ["pelada_participants", peladaId ?? null],
    enabled: Boolean(peladaId),
    queryFn: async (): Promise<PeladaParticipant[]> => {
      if (!peladaId) return [];
      const { data, error } = await supabase
        .from("pelada_participants")
        .select(PARTICIPANT_FIELDS)
        .eq("pelada_id", peladaId)
        .order("created_at");
      if (error) throw new Error(error.message);
      return (data ?? []) as PeladaParticipant[];
    },
  };
}

/** Confirmados dentro do limite + lista de espera calculada pela ordem de chegada. */
export function splitParticipants(list: PeladaParticipant[], maxPlayers: number | null) {
  const confirmed = list.filter((p) => p.status === "confirmado");
  const out = list.filter((p) => p.status === "fora");
  if (!maxPlayers || confirmed.length <= maxPlayers) {
    return { confirmed, waiting: [] as PeladaParticipant[], out };
  }
  return {
    confirmed: confirmed.slice(0, maxPlayers),
    waiting: confirmed.slice(maxPlayers),
    out,
  };
}

/** Sorteio simples e equilibrado: goleiros distribuídos primeiro, resto embaralhado. */
export function drawTeams(
  ids: string[],
  teamsCount: number,
  isGoalkeeper: (id: string) => boolean,
): Record<string, number> {
  const shuffle = <T,>(arr: T[]) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };
  const keepers = shuffle(ids.filter(isGoalkeeper));
  const others = shuffle(ids.filter((id) => !isGoalkeeper(id)));
  const result: Record<string, number> = {};
  let index = 0;
  for (const id of [...keepers, ...others]) {
    result[id] = (index % teamsCount) + 1;
    index += 1;
  }
  return result;
}

/** Amistoso: titulares por posição (ordem de confirmação) e suplentes que sobem automaticamente. */
export function splitByPosition(
  list: PeladaParticipant[],
  slots: Record<string, number>,
  positionOf: (playerId: string | null) => string,
) {
  const confirmed = list
    .filter((p) => p.status === "confirmado")
    .sort((a, b) => a.confirmed_at.localeCompare(b.confirmed_at));
  const groups: Record<string, { starters: PeladaParticipant[]; subs: PeladaParticipant[] }> = {};
  for (const p of confirmed) {
    const pos = positionOf(p.player_id) || "Sem posição";
    const g = (groups[pos] ??= { starters: [], subs: [] });
    const limit = slots[pos];
    if (limit == null || g.starters.length < limit) g.starters.push(p);
    else g.subs.push(p);
  }
  return groups;
}
