import { supabase } from "@/integrations/supabase/client";

export type MatchResultRow = {
  match_id: string;
  match_date: string;
  opponent: string | null;
  scored: number;
  conceded: number;
  outcome: "V" | "E" | "D";
};

/**
 * Fonte única do resultado de cada partida:
 * gols feitos = soma dos gols dos atletas + gols contra (gols da equipe sem autor cadastrado);
 * gols sofridos = gols sofridos pelos goleiros.
 * O gol contra nunca entra nas estatísticas individuais.
 */
export const matchResultsQueryOptions = {
  queryKey: ["overview", "match_results"],
  queryFn: async (): Promise<MatchResultRow[]> => {
    const [matchesRes, statsRes] = await Promise.all([
      supabase.from("matches").select("id, match_date, opponent, own_goals"),
      supabase.from("match_stats").select("match_id, goals, goals_conceded"),
    ]);
    if (matchesRes.error) throw new Error(matchesRes.error.message);
    if (statsRes.error) throw new Error(statsRes.error.message);

    const totals = new Map<string, { scored: number; conceded: number; rows: number }>();
    for (const row of statsRes.data ?? []) {
      const entry = totals.get(row.match_id) ?? { scored: 0, conceded: 0, rows: 0 };
      entry.scored += row.goals ?? 0;
      entry.conceded += row.goals_conceded ?? 0;
      entry.rows += 1;
      totals.set(row.match_id, entry);
    }

    return (matchesRes.data ?? [])
      .map((match) => {
        const t = totals.get(match.id) ?? { scored: 0, conceded: 0, rows: 0 };
        const scored = t.scored + (match.own_goals ?? 0);
        const conceded = t.conceded;
        return {
          match_id: match.id,
          match_date: match.match_date,
          opponent: match.opponent,
          scored,
          conceded,
          outcome: (scored > conceded ? "V" : scored === conceded ? "E" : "D") as "V" | "E" | "D",
          _hasData: t.rows > 0 || (match.own_goals ?? 0) > 0,
        };
      })
      .filter((row) => row._hasData)
      .map(({ _hasData, ...row }) => row)
      .sort((a, b) => b.match_date.localeCompare(a.match_date));
  },
};

export function seasonSummary(rows: MatchResultRow[], year: string) {
  const scoped = year === "all" ? rows : rows.filter((r) => r.match_date.startsWith(year));
  return {
    matches: scoped.length,
    wins: scoped.filter((r) => r.outcome === "V").length,
    draws: scoped.filter((r) => r.outcome === "E").length,
    losses: scoped.filter((r) => r.outcome === "D").length,
    scored: scoped.reduce((sum, r) => sum + r.scored, 0),
    conceded: scoped.reduce((sum, r) => sum + r.conceded, 0),
  };
}
