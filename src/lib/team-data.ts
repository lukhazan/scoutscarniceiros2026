import { supabase } from "@/integrations/supabase/client";

export type Player = {
  id: string;
  name: string;
  nickname: string | null;
  position: string | null;
  shirt_number: number | null;
  active: boolean;
  initial_goals: number;
  initial_assists: number;
  initial_conceded: number;
  /** avatar recortado usado no elenco/rankings */
  photo_url: string | null;
};

export type PlayerTotals = {
  player_id: string;
  name: string;
  nickname: string | null;
  position: string | null;
  shirt_number: number | null;
  active: boolean;
  photo_url: string | null;
  matches_played: number;
  goals: number;
  assists: number;
  goals_conceded: number;
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
  goals_conceded: number;
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

/**
 * Lista do elenco SEM a foto original (que pode ter megabytes por atleta).
 * A foto original é carregada sob demanda, apenas para o atleta escolhido.
 */
export const playersQueryOptions = {
  queryKey: ["players"],
  queryFn: async (): Promise<Player[]> => {
    const { data, error } = await supabase
      .from("players")
      .select(
        "id, name, nickname, position, shirt_number, active, initial_goals, initial_assists, initial_conceded, photo_url",
      )
      .order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  },
};

/** Foto original completa de um único atleta (usada na Central de Artes). */
export function playerOriginalPhotoQueryOptions(playerId: string | null | undefined) {
  return {
    queryKey: ["player-original-photo", playerId ?? null],
    enabled: Boolean(playerId),
    queryFn: async (): Promise<string | null> => {
      if (!playerId) return null;
      const { data, error } = await supabase
        .from("players")
        .select("photo_original_url")
        .eq("id", playerId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data?.photo_original_url ?? null;
    },
  };
}

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

export function matchQueryOptions(matchId: string) {
  return {
    queryKey: ["matches", matchId],
    queryFn: async (): Promise<Match> => {
      const { data, error } = await supabase
        .from("matches")
        .select("id, match_date, opponent, notes")
        .eq("id", matchId)
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    refetchOnMount: "always" as const,
  };
}

export function matchStatsQueryOptions(matchId: string) {
  return {
    queryKey: ["match_stats", matchId],
    queryFn: async (): Promise<MatchStat[]> => {
      const { data, error } = await supabase
        .from("match_stats")
        .select("id, match_id, player_id, goals, assists, goals_conceded, played")
        .eq("match_id", matchId);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    refetchOnMount: "always" as const,
  };
}

export const matchTotalsQueryOptions = {
  queryKey: ["match_stats_all"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("match_stats")
      .select("match_id, goals, assists, goals_conceded, played");
    if (error) throw new Error(error.message);
    return data ?? [];
  },
};

type StatRow = {
  player_id: string;
  goals: number;
  assists: number;
  goals_conceded: number;
  played: boolean;
  matches: { match_date: string } | null;
  players: {
    name: string;
    nickname: string | null;
    position: string | null;
    shirt_number: number | null;
    active: boolean;
    photo_url: string | null;
  } | null;
};

export type SeasonStat = {
  id: string;
  player_id: string;
  season: number;
  goals: number;
  assists: number;
  goals_conceded: number;
};

export const seasonStatsQueryOptions = {
  queryKey: ["player_season_stats"],
  queryFn: async (): Promise<SeasonStat[]> => {
    const { data, error } = await supabase
      .from("player_season_stats")
      .select("id, player_id, season, goals, assists, goals_conceded");
    if (error) throw new Error(error.message);
    return data ?? [];
  },
};

type SeasonStatRow = SeasonStat & {
  players: {
    name: string;
    nickname: string | null;
    position: string | null;
    shirt_number: number | null;
    active: boolean;
    photo_url: string | null;
  } | null;
};

export const statsByYearQueryOptions = {
  queryKey: ["stats_by_year"],
  queryFn: async (): Promise<Record<string, PlayerTotals[]>> => {
    const [matchRes, seasonRes] = await Promise.all([
      supabase
        .from("match_stats")
        .select(
          "player_id, goals, assists, goals_conceded, played, matches(match_date), players(name, nickname, position, shirt_number, active, photo_url)",
        ),
      supabase
        .from("player_season_stats")
        .select(
          "id, player_id, season, goals, assists, goals_conceded, players(name, nickname, position, shirt_number, active, photo_url)",
        ),
    ]);
    if (matchRes.error) throw new Error(matchRes.error.message);
    if (seasonRes.error) throw new Error(seasonRes.error.message);

    const byYear: Record<string, Map<string, PlayerTotals>> = {};

    function bucketEntry(
      year: string,
      playerId: string,
      player: SeasonStatRow["players"],
    ): PlayerTotals | null {
      if (!player) return null;
      const bucket = (byYear[year] ??= new Map());
      let entry = bucket.get(playerId);
      if (!entry) {
        entry = {
          player_id: playerId,
          name: player.name,
          nickname: player.nickname,
          position: player.position,
          shirt_number: player.shirt_number,
          active: player.active,
          photo_url: player.photo_url,
          matches_played: 0,
          goals: 0,
          assists: 0,
          goals_conceded: 0,
          contributions: 0,
        };
        bucket.set(playerId, entry);
      }
      return entry;
    }

    for (const row of (matchRes.data ?? []) as unknown as StatRow[]) {
      const date = row.matches?.match_date;
      if (!date) continue;
      const entry = bucketEntry(date.slice(0, 4), row.player_id, row.players);
      if (!entry) continue;
      if (row.played) entry.matches_played += 1;
      entry.goals += row.goals;
      entry.assists += row.assists;
      entry.goals_conceded += row.goals_conceded ?? 0;
      entry.contributions = entry.goals + entry.assists;
    }

    for (const row of (seasonRes.data ?? []) as unknown as SeasonStatRow[]) {
      const entry = bucketEntry(String(row.season), row.player_id, row.players);
      if (!entry) continue;
      entry.goals += row.goals;
      entry.assists += row.assists;
      entry.goals_conceded += row.goals_conceded ?? 0;
      entry.contributions = entry.goals + entry.assists;
    }

    return Object.fromEntries(
      Object.entries(byYear).map(([year, map]) => [year, [...map.values()]]),
    );
  },
};


export function displayName(p: { name: string; nickname: string | null }) {
  return p.nickname?.trim() ? p.nickname : p.name;
}


export function formatDate(value: string) {
  const [y, m, d] = value.split("-");
  return `${d}/${m}/${y}`;
}
