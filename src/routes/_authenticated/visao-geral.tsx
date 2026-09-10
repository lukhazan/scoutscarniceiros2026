import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  ChevronRight,
  Image as ImageIcon,
  MapPin,
  Trophy,
  Users,
  Wallet,
  ClipboardList,
  BarChart3,
} from "lucide-react";

import { AppHeader } from "@/components/AppHeader";
import { AdminGate } from "@/components/AdminGate";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  displayName,
  formatDate,
  statsByYearQueryOptions,
  totalsQueryOptions,
  type PlayerTotals,
} from "@/lib/team-data";
import {
  currentCompetence,
  competenceLabel,
  debtsQueryOptions,
  feesQueryOptions,
  formatMoney,
  isOverdue,
  summarize,
  overdueByPlayer,
} from "@/lib/finance-data";
import {
  eventsQueryOptions,
  formatTime,
  typeMeta,
  toLocalDate,
} from "@/lib/agenda-data";
import { matchResultsQueryOptions, seasonSummary } from "@/lib/overview-data";

export const Route = createFileRoute("/_authenticated/visao-geral")({
  head: () => ({
    meta: [
      { title: "Visão Geral — Carniceiros Fut 7" },
      {
        name: "description",
        content:
          "Resumo do time: rankings, financeiro do mês, próximo compromisso e desempenho da temporada.",
      },
      { property: "og:title", content: "Visão Geral — Carniceiros Fut 7" },
      {
        property: "og:description",
        content:
          "Resumo do time: rankings, financeiro do mês, próximo compromisso e desempenho da temporada.",
      },
    ],
  }),
  component: () => (
    <AdminGate>
      <OverviewPage />
    </AdminGate>
  ),
});

const MEDALS = ["🥇", "🥈", "🥉"];

type RankingSlide = {
  key: string;
  emoji: string;
  title: string;
  suffix: string;
  rows: PlayerTotals[];
  getValue: (row: PlayerTotals) => number;
};

function TopFive({ slide }: { slide: RankingSlide }) {
  const rows = slide.rows.slice(0, 5);
  return (
    <div className="w-full shrink-0 snap-center px-1">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <span>{slide.emoji}</span>
        {slide.title}
      </p>
      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nenhum dado registrado ainda.
        </p>
      ) : (
        <ol className="mt-3 space-y-1">
          {rows.map((row, index) => (
            <li
              key={row.player_id}
              className={`flex items-center gap-3 rounded-md px-2 py-2 ${
                index === 0 ? "bg-primary/10" : ""
              }`}
            >
              <span className="w-6 shrink-0 text-center font-display text-lg tabular text-muted-foreground">
                {index < 3 ? MEDALS[index] : index + 1}
              </span>
              <PlayerAvatar src={row.photo_url} name={displayName(row)} className="size-9" />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                {displayName(row)}
              </span>
              <span className="font-display text-2xl leading-none tabular text-primary">
                {slide.getValue(row)}
              </span>
              <span className="w-14 text-[10px] uppercase tracking-wide text-muted-foreground">
                {slide.suffix}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function StatBox({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-md bg-secondary/60 px-3 py-2 text-center">
      <p className={`font-display text-2xl leading-none tabular ${tone ?? "text-foreground"}`}>
        {value}
      </p>
      <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

const SHORTCUTS = [
  { to: "/estatisticas", label: "Estatísticas", icon: BarChart3 },
  { to: "/elenco", label: "Elenco", icon: Users },
  { to: "/jogos", label: "Jogos", icon: ClipboardList },
  { to: "/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/financeiro", label: "Financeiro", icon: Wallet },
  { to: "/estudio", label: "Central de Artes", icon: ImageIcon },
] as const;

function OverviewPage() {
  const { data: totals } = useQuery(totalsQueryOptions);
  const { data: byYear } = useQuery(statsByYearQueryOptions);
  const { data: debts } = useQuery(debtsQueryOptions);
  const { data: fees } = useQuery(feesQueryOptions);
  const { data: events } = useQuery(eventsQueryOptions);
  const { data: results } = useQuery(matchResultsQueryOptions);

  const [year, setYear] = useState("all");
  const years = useMemo(
    () => Object.keys(byYear ?? {}).sort((a, b) => Number(b) - Number(a)),
    [byYear],
  );

  // Fotos vêm do ranking geral e são reaproveitadas nas temporadas.
  const photoMap = useMemo(
    () => new Map((totals ?? []).map((r) => [r.player_id, r.photo_url])),
    [totals],
  );

  const rows = useMemo<PlayerTotals[]>(
    () =>
      year === "all"
        ? (totals ?? [])
        : (byYear?.[year] ?? []).map((r) => ({
            ...r,
            photo_url: photoMap.get(r.player_id) ?? r.photo_url,
          })),
    [year, totals, byYear, photoMap],
  );

  const slides = useMemo<RankingSlide[]>(() => {
    const byMetric = (metric: "goals" | "assists") =>
      [...rows]
        .filter((r) => r[metric] > 0)
        .sort((a, b) => b[metric] - a[metric] || a.name.localeCompare(b.name));
    const keepers = [...rows]
      .filter((r) => r.position === "Goleiro" && r.matches_played > 0)
      .sort(
        (a, b) =>
          a.goals_conceded - b.goals_conceded ||
          b.matches_played - a.matches_played ||
          a.name.localeCompare(b.name),
      );
    return [
      {
        key: "goals",
        emoji: "⚽",
        title: "Artilharia · Top 5",
        suffix: "Gols",
        rows: byMetric("goals"),
        getValue: (r) => r.goals,
      },
      {
        key: "assists",
        emoji: "🎯",
        title: "Assistências · Top 5",
        suffix: "Passes",
        rows: byMetric("assists"),
        getValue: (r) => r.assists,
      },
      {
        key: "keepers",
        emoji: "🧤",
        title: "Goleiros · Top 5",
        suffix: "Sofridos",
        rows: keepers,
        getValue: (r) => r.goals_conceded,
      },
    ];
  }, [rows]);

  const comp = currentCompetence();
  const finance = summarize(debts ?? [], fees ?? [], comp);
  const overdueRows = overdueByPlayer(debts ?? []);
  const overdueTotal = (debts ?? []).filter(isOverdue).reduce((sum, d) => sum + d.amount, 0);

  const nextEvent = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return (events ?? [])
      .filter((e) => e.event_type !== "disponivel" && e.event_date >= today)
      .sort(
        (a, b) =>
          a.event_date.localeCompare(b.event_date) ||
          (a.start_time ?? "").localeCompare(b.start_time ?? ""),
      )[0];
  }, [events]);

  const season = seasonSummary(results ?? [], year);
  // Mesmos resultados da aba Jogos, os 5 mais recentes.
  const lastResults = useMemo(() => (results ?? []).slice(0, 5), [results]);

  const alerts: { tone: "danger" | "info"; text: string }[] = [];
  if (overdueRows.length > 0) {
    alerts.push({
      tone: "danger",
      text: `${overdueRows.length} atleta${overdueRows.length === 1 ? "" : "s"} com mensalidade em atraso · ${formatMoney(overdueTotal)}`,
    });
  }
  if (nextEvent) {
    const days = Math.round(
      (toLocalDate(nextEvent.event_date).getTime() -
        toLocalDate(new Date().toISOString().slice(0, 10)).getTime()) /
        86_400_000,
    );
    alerts.push({
      tone: "info",
      text:
        days <= 0
          ? `${typeMeta(nextEvent.event_type).label} hoje: ${nextEvent.title}`
          : `${typeMeta(nextEvent.event_type).label} em ${days} dia${days === 1 ? "" : "s"}: ${nextEvent.title}`,
    });
  }
  if (finance.toReceive > 0) {
    alerts.push({
      tone: "info",
      text: `${formatMoney(finance.toReceive)} a receber em ${competenceLabel(comp)}`,
    });
  }

  return (
    <div className="min-h-screen bg-background pb-[env(safe-area-inset-bottom)]">
      <AppHeader />

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl leading-none">Visão Geral</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Resumo do time em um só lugar.
            </p>
          </div>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Geral</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {alerts.length > 0 && (
          <section className="space-y-2">
            {alerts.map((alert) => (
              <p
                key={alert.text}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs ${
                  alert.tone === "danger"
                    ? "border-destructive/50 bg-destructive/10 text-destructive"
                    : "border-border/60 bg-card text-muted-foreground"
                }`}
              >
                {alert.tone === "danger" ? (
                  <AlertTriangle className="size-4 shrink-0" />
                ) : (
                  <CalendarDays className="size-4 shrink-0" />
                )}
                <span className="min-w-0 flex-1">{alert.text}</span>
              </p>
            ))}
          </section>
        )}

        {/* Rankings em carrossel */}
        <section className="rounded-lg border border-border/60 bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
              <Trophy className="size-3.5" /> Rankings
            </p>
            <span className="text-[10px] text-muted-foreground">arraste para o lado →</span>
          </div>
          <div className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {slides.map((slide) => (
              <TopFive key={slide.key} slide={slide} />
            ))}
          </div>
          <div className="mt-3 flex justify-end">
            <Button asChild variant="ghost" size="sm">
              <Link to="/estatisticas">
                Ver Estatísticas <ChevronRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Financeiro */}
          <section className="rounded-lg border border-border/60 bg-card p-4">
            <p className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
              <Wallet className="size-3.5" /> Financeiro · {competenceLabel(comp)}
            </p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>💰 A receber</span>
                <span className="font-display text-xl tabular">
                  {formatMoney(finance.toReceive)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>✅ Recebido</span>
                <span className="font-display text-xl tabular text-emerald-500">
                  {formatMoney(finance.received)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>🔴 Em atraso</span>
                <span className="font-display text-xl tabular text-destructive">
                  {formatMoney(overdueTotal)}
                </span>
              </div>
            </div>
            <Button asChild variant="ghost" size="sm" className="mt-3 w-full">
              <Link to="/financeiro">Ver Financeiro</Link>
            </Button>
          </section>

          {/* Próximo compromisso */}
          <section className="rounded-lg border border-border/60 bg-card p-4">
            <p className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
              <CalendarDays className="size-3.5" /> Próximo compromisso
            </p>
            {nextEvent ? (
              <div className="mt-3 space-y-1">
                <p className="text-[11px] uppercase tracking-wide text-primary">
                  {typeMeta(nextEvent.event_type).label}
                </p>
                <p className="font-display text-2xl leading-tight">{nextEvent.title}</p>
                {nextEvent.opponent && (
                  <p className="text-sm text-muted-foreground">vs {nextEvent.opponent}</p>
                )}
                <p className="text-sm">
                  {formatDate(nextEvent.event_date)}
                  {formatTime(nextEvent.start_time) ? ` · ${formatTime(nextEvent.start_time)}` : ""}
                </p>
                {nextEvent.location && (
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="size-3.5 shrink-0" />
                    <span className="truncate">{nextEvent.location}</span>
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">Nenhum compromisso próximo.</p>
            )}
            <Button asChild variant="ghost" size="sm" className="mt-3 w-full">
              <Link to="/agenda">Ver Agenda</Link>
            </Button>
          </section>
        </div>

        {/* Últimos resultados */}
        <section className="rounded-lg border border-border/60 bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Últimos Resultados
            </p>
            <Button asChild variant="ghost" size="sm">
              <Link to="/jogos">
                Ver Jogos <ChevronRight className="size-4" />
              </Link>
            </Button>
          </div>
          {lastResults.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Nenhum resultado registrado.</p>
          ) : (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {lastResults.map((r) => (
                <div
                  key={r.match_id}
                  className={`w-36 shrink-0 rounded-md border px-3 py-2 ${
                    r.outcome === "V"
                      ? "border-emerald-500/40 bg-emerald-500/10"
                      : r.outcome === "D"
                        ? "border-destructive/40 bg-destructive/10"
                        : "border-border/60 bg-secondary/50"
                  }`}
                >
                  <p className="truncate text-xs font-semibold">
                    {r.opponent?.trim() ? r.opponent : "Jogo do time"}
                  </p>
                  <p className="mt-1 font-display text-2xl leading-none tabular">
                    {r.scored} <span className="text-muted-foreground">x</span> {r.conceded}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {formatDate(r.match_date)} ·{" "}
                    <span
                      className={
                        r.outcome === "V"
                          ? "text-emerald-500"
                          : r.outcome === "D"
                            ? "text-destructive"
                            : ""
                      }
                    >
                      {r.outcome === "V" ? "Vitória" : r.outcome === "E" ? "Empate" : "Derrota"}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Resumo da temporada */}
        <section className="rounded-lg border border-border/60 bg-card p-4">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Temporada {year === "all" ? "· Geral" : year}
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
            <StatBox label="Jogos" value={String(season.matches)} />
            <StatBox label="Vitórias" value={String(season.wins)} tone="text-emerald-500" />
            <StatBox label="Empates" value={String(season.draws)} />
            <StatBox label="Derrotas" value={String(season.losses)} tone="text-destructive" />
            <StatBox label="Gols pró" value={String(season.scored)} tone="text-primary" />
            <StatBox label="Gols sofridos" value={String(season.conceded)} />
          </div>
        </section>

        {/* Atalhos */}
        <section className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SHORTCUTS.map(({ to, label, icon: Icon }) => (
            <Button key={to} asChild variant="outline" className="h-auto justify-start py-3">
              <Link to={to}>
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{label}</span>
              </Link>
            </Button>
          ))}
        </section>
      </main>
    </div>
  );
}
