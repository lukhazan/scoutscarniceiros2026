import { supabase } from "@/integrations/supabase/client";

export type MatchResultRow = {
  match_id: string;
  match_date: string;
  scored: number;
  conceded: number;
};

/**
 * Resultado de cada partida derivado dos scouts já registrados:
 * gols marcados = soma dos gols dos atletas; gols sofridos = soma dos gols
 * sofridos pelos goleiros. Não altera nenhum cálculo existente.
 */
export const matchResultsQueryOptions = {
  queryKey: ["overview", "match_results"],
  queryFn: async (): Promise<MatchResultRow[]> => {
    const { data, error } = await supabase
      .from("match_stats")
      .select("match_id, goals, goals_conceded, matches(match_date)");
    if (error) throw new Error(error.message);

    const map = new Map<string, MatchResultRow>();
    for (const row of (data ?? []) as unknown as {
      match_id: string;
      goals: number;
      goals_conceded: number;
      matches: { match_date: string } | null;
    }[]) {
      const date = row.matches?.match_date;
      if (!date) continue;
      const entry =
        map.get(row.match_id) ??
        ({ match_id: row.match_id, match_date: date, scored: 0, conceded: 0 } as MatchResultRow);
      entry.scored += row.goals ?? 0;
      entry.conceded += row.goals_conceded ?? 0;
      map.set(row.match_id, entry);
    }
    return [...map.values()];
  },
};

export function seasonSummary(rows: MatchResultRow[], year: string) {
  const scoped = year === "all" ? rows : rows.filter((r) => r.match_date.startsWith(year));
  return {
    matches: scoped.length,
    wins: scoped.filter((r) => r.scored > r.conceded).length,
    draws: scoped.filter((r) => r.scored === r.conceded).length,
    losses: scoped.filter((r) => r.scored < r.conceded).length,
    scored: scoped.reduce((sum, r) => sum + r.scored, 0),
    conceded: scoped.reduce((sum, r) => sum + r.conceded, 0),
  };
}
