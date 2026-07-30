import { forwardRef } from "react";
import teamLogo from "@/assets/team-logo.png";
import { displayName, type PlayerTotals } from "@/lib/team-data";

export type ExportMetric = "goals" | "assists";

function sortBy(rows: PlayerTotals[], metric: ExportMetric) {
  const other: ExportMetric = metric === "goals" ? "assists" : "goals";
  return [...rows].sort(
    (a, b) => b[metric] - a[metric] || b[other] - a[other] || a.name.localeCompare(b.name),
  );
}

function Column({ rows, metric }: { rows: PlayerTotals[]; metric: ExportMetric }) {
  const list = sortBy(rows, metric)
    .filter((r) => r[metric] > 0)
    .slice(0, 10);

  return (
    <div className="flex-1">
      <p className="mb-3 border-b border-primary/50 pb-2 font-display text-2xl tracking-wide text-primary">
        {metric === "goals" ? "Artilharia" : "Assistências"}
      </p>
      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem lançamentos</p>
      ) : (
        <ol className="space-y-1.5">
          {list.map((row, index) => (
            <li key={row.player_id} className="flex items-center gap-2.5">
              <span
                className={`w-6 text-center font-display text-lg tabular ${
                  index === 0 ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {index + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                {displayName(row)}
              </span>
              <span className="font-display text-xl tabular text-primary">{row[metric]}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export const RankingExportCard = forwardRef<
  HTMLDivElement,
  { rows: PlayerTotals[]; teamName: string }
>(function RankingExportCard({ rows, teamName }, ref) {
  const goals = rows.reduce((sum, r) => sum + r.goals, 0);
  const assists = rows.reduce((sum, r) => sum + r.assists, 0);

  return (
    <div
      ref={ref}
      style={{ width: 1080 }}
      className="bg-background px-14 py-12 text-foreground"
    >
      <div className="flex items-center gap-5 border-b border-border pb-6">
        <img src={teamLogo} alt="" width={96} height={96} className="size-24 object-contain" />
        <div>
          <p className="font-display text-5xl leading-none tracking-wide">{teamName}</p>
          <p className="mt-1 text-sm uppercase tracking-[0.25em] text-muted-foreground">
            Artilharia &amp; assistências da temporada
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="font-display text-4xl leading-none tabular text-primary">{goals}</p>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">gols</p>
          <p className="mt-2 font-display text-4xl leading-none tabular text-accent">{assists}</p>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">assist.</p>
        </div>
      </div>

      <div className="mt-8 flex gap-12">
        <Column rows={rows} metric="goals" />
        <Column rows={rows} metric="assists" />
      </div>

      <p className="mt-10 text-center text-xs uppercase tracking-[0.3em] text-muted-foreground">
        Atualizado em{" "}
        {new Date().toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })}
      </p>
    </div>
  );
});
