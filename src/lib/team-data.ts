import { supabase } from "@/integrations/supabase/client";

export type Player = {
  id: string;
  name: string;
  nickname: string | null;
  position: string | null;
  shirt_number: number | null;
  active: boolean;
};

export type PlayerTotals = {
  player_id: string;
  name: string;
  nickname: string | null;
  position: string | null;
  shirt_number: number | null;
  active: boolean;
  matches_played: number;
  goals: number;
  assists: number;
  contributions: number;
};

export type Match = {
  id: string;
  match_date: string;
  opponent: string | null;
  notes: string | null;
};

export type MatchStat = {
  id: string;
  match_id: string;
  player_id: string;
  goals: number;
  assists: number;
  played: boolean;
};

export const POSITIONS = [
  "Goleiro",
  "Zagueiro",
  "Lateral",
  "Volante",
  "Meia",
  "Atacante",
] as const;

export const playersQueryOptions = {
  queryKey: ["players"],
  queryFn: async (): Promise<Player[]> => {
    const { data, error } = await supabase
      .from("players")
      .select("id, name, nickname, position, shirt_number, active")
      .order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  },
};

export const totalsQueryOptions = {
  queryKey: ["player_totals"],
  queryFn: async (): Promise<PlayerTotals[]> => {
    const { data, error } = await supabase
      .from("player_totals")
      .select("*")
      .order("goals", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as PlayerTotals[];
  },
};

export const matchesQueryOptions = {
  queryKey: ["matches"],
  queryFn: async (): Promise<Match[]> => {
    const { data, error } = await supabase
      .from("matches")
      .select("id, match_date, opponent, notes")
      .order("match_date", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
};

export function matchStatsQueryOptions(matchId: string) {
  return {
    queryKey: ["match_stats", matchId],
    queryFn: async (): Promise<MatchStat[]> => {
      const { data, error } = await supabase
        .from("match_stats")
        .select("id, match_id, player_id, goals, assists, played")
        .eq("match_id", matchId);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  };
}

export const matchTotalsQueryOptions = {
  queryKey: ["match_stats_all"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("match_stats")
      .select("match_id, goals, assists, played");
    if (error) throw new Error(error.message);
    return data ?? [];
  },
};

export function displayName(p: { name: string; nickname: string | null }) {
  return p.nickname?.trim() ? p.nickname : p.name;
}

export function formatDate(value: string) {
  const [y, m, d] = value.split("-");
  return `${d}/${m}/${y}`;
}
