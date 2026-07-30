import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { Search, Target, Handshake, ImageDown } from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { RankingExportCard } from "@/components/RankingExportCard";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { displayName, totalsQueryOptions, type PlayerTotals } from "@/lib/team-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Súmula — Artilharia e assistências do time" },
      {
        name: "description",
        content:
          "Ranking de gols e assistências do time amador, atualizado a cada jogo lançado.",
      },
      { property: "og:title", content: "Súmula — Artilharia e assistências do time" },
      {
        property: "og:description",
        content: "Ranking de gols e assistências do time amador, atualizado a cada jogo.",
      },
    ],
  }),
  component: Index,
});

type Metric = "goals" | "assists";

function Ranking({
  rows,
  metric,
  loading,
}: {
  rows: PlayerTotals[];
  metric: Metric;
  loading: boolean;
}) {
  const sorted = useMemo(() => {
    const other: Metric = metric === "goals" ? "assists" : "goals";
    return [...rows].sort(
      (a, b) => b[metric] - a[metric] || b[other] - a[other] || a.name.localeCompare(b.name),
    );
  }, [rows, metric]);

  if (loading) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Carregando…</p>;
  }

  if (sorted.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Nenhum jogador encontrado ainda.
      </p>
    );
  }

  return (
    <ol className="divide-y divide-border/60 overflow-hidden rounded-lg border border-border/60 bg-card">
      {sorted.map((row, index) => (
        <li key={row.player_id} className="flex items-center gap-3 px-3 py-3">
          <span
            className={`w-7 shrink-0 text-center font-display text-xl tabular ${
              index === 0 ? "text-primary" : index < 3 ? "text-accent" : "text-muted-foreground"
            }`}
          >
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold leading-tight">{displayName(row)}</p>
            <p className="truncate text-xs text-muted-foreground">
              {[row.position, `${row.matches_played} jogo${row.matches_played === 1 ? "" : "s"}`]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <div className="text-right">
            <span className="font-display text-3xl leading-none tabular text-primary">
              {row[metric]}
            </span>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {metric === "goals" ? `${row.assists} assist.` : `${row.goals} gols`}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Index() {
  const { data, isLoading } = useQuery(totalsQueryOptions);
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const list = data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter(
      (r) =>
        r.name.toLowerCase().includes(term) ||
        (r.nickname ?? "").toLowerCase().includes(term),
    );
  }, [data, search]);

  const totals = useMemo(() => {
    const list = data ?? [];
    return {
      goals: list.reduce((sum, r) => sum + r.goals, 0),
      assists: list.reduce((sum, r) => sum + r.assists, 0),
      players: list.length,
    };
  }, [data]);

  const leaders = useMemo(() => {
    const list = data ?? [];
    const top = (metric: Metric) => {
      const best = [...list].sort((a, b) => b[metric] - a[metric])[0];
      return best && best[metric] > 0 ? best : null;
    };
    return { goals: top("goals"), assists: top("assists") };
  }, [data]);


  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-6">
        <h1 className="font-display text-4xl leading-none sm:text-5xl">
          Artilharia &amp; assistências
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Os números somam automaticamente todos os jogos lançados. Nada de bloco de notas.
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {[
            { label: "Gols", value: totals.goals },
            { label: "Assistências", value: totals.assists },
            { label: "Jogadores", value: totals.players },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-border/60 bg-card px-3 py-2 text-center"
            >
              <p className="font-display text-3xl leading-none tabular">{item.value}</p>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {item.label}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {[
            {
              key: "goals" as const,
              title: "Artilheiro do ano",
              icon: Target,
              leader: leaders.goals,
              suffix: "gols",
            },
            {
              key: "assists" as const,
              title: "Garçom do ano",
              icon: Handshake,
              leader: leaders.assists,
              suffix: "assistências",
            },
          ].map((award) => (
            <div key={award.key} className="rounded-lg border border-primary/40 bg-card px-4 py-3">
              <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                <award.icon className="size-3.5" /> {award.title}
              </p>
              {award.leader ? (
                <p className="mt-1 flex items-baseline gap-2">
                  <span className="truncate font-display text-2xl leading-none">
                    {displayName(award.leader)}
                  </span>
                  <span className="whitespace-nowrap text-sm text-primary">
                    {award.leader[award.key]} {award.suffix}
                  </span>
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">Ainda sem lançamentos</p>
              )}
            </div>
          ))}
        </div>



        <div className="relative mt-5">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar jogador"
            className="pl-9"
            aria-label="Buscar jogador"
          />
        </div>

        <Tabs defaultValue="goals" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="goals">
              <Target className="mr-1.5 size-4" /> Gols
            </TabsTrigger>
            <TabsTrigger value="assists">
              <Handshake className="mr-1.5 size-4" /> Assistências
            </TabsTrigger>
          </TabsList>
          <TabsContent value="goals" className="mt-3">
            <Ranking rows={rows} metric="goals" loading={isLoading} />
          </TabsContent>
          <TabsContent value="assists" className="mt-3">
            <Ranking rows={rows} metric="assists" loading={isLoading} />
          </TabsContent>
        </Tabs>

        <div className="mt-8 rounded-lg border border-dashed border-border/70 p-4 text-center">
          <p className="text-sm text-muted-foreground">
            É você que lança os jogos? Entre para atualizar a tabela.
          </p>
          <Button asChild className="mt-3">
            <Link to="/jogos/novo">Lançar jogo</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
