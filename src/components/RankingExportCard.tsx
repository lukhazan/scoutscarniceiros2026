import { forwardRef } from "react";
import { displayName, type PlayerTotals } from "@/lib/team-data";
import { teamLogoColor } from "@/assets/team-logo-data";

const teamLogo = teamLogoColor;

export type ExportMetric = "goals" | "assists";

function sortBy(rows: PlayerTotals[], metric: ExportMetric) {
  const other: ExportMetric = metric === "goals" ? "assists" : "goals";
  return [...rows].sort(
    (a, b) => b[metric] - a[metric] || b[other] - a[other] || a.name.localeCompare(b.name),
  );
}

function Column({ rows, metric }: { rows: PlayerTotals[]; metric: ExportMetric }) {
  const list = sortBy(rows, metric).filter((r) => r[metric] > 0);

  const title = metric === "goals" ? "Artilharia" : "Assistências";
  const accent = metric === "goals" ? "text-red-600" : "text-red-500";

  return (
    <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className={`mb-4 border-b-2 border-red-600 pb-3 font-display text-2xl font-bold tracking-wide ${accent}`}>
        {title}
      </p>
      {list.length === 0 ? (
        <p className="text-sm text-slate-500">Sem lançamentos</p>
      ) : (
        <ol className="space-y-2">
          {list.map((row, index) => (
            <li key={row.player_id} className="flex items-center gap-3">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold tabular ${
                  index === 0
                    ? "bg-red-600 text-white"
                    : index === 1
                      ? "bg-slate-800 text-white"
                      : index === 2
                        ? "bg-slate-500 text-white"
                        : "bg-slate-100 text-slate-600"
                }`}
              >
                {index + 1}
              </span>
              {row.photo_url ? (
                <img
                  src={row.photo_url}
                  alt=""
                  className="h-9 w-9 shrink-0 bg-transparent object-contain"
                />
              ) : null}
              <span className="min-w-0 flex-1 truncate text-base font-semibold text-slate-800">
                {displayName(row)}
              </span>

              <span className={`font-display text-2xl font-bold tabular ${accent}`}>{row[metric]}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export const RankingExportCard = forwardRef<
  HTMLDivElement,
  { rows: PlayerTotals[]; teamName: string; periodLabel?: string }
>(function RankingExportCard({ rows, teamName, periodLabel }, ref) {
  const goals = rows.reduce((sum, r) => sum + r.goals, 0);
  const assists = rows.reduce((sum, r) => sum + r.assists, 0);

  return (
    <div
      ref={ref}
      style={{ width: 1080 }}
      className="relative overflow-hidden bg-white px-14 py-12 text-slate-900"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-red-700 via-red-500 to-red-700" />

      <div className="flex items-center gap-6 border-b border-slate-200 pb-8">
        <div className="flex h-28 w-28 items-center justify-center rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <img src={teamLogo} alt="" width={88} height={88} className="h-[88px] w-[88px] object-contain" />
        </div>
        <div className="flex-1">
          <p className="font-display text-5xl font-bold leading-none tracking-tight text-slate-900">
            {teamName}
          </p>
          <p className="mt-2 text-sm font-semibold uppercase tracking-[0.2em] text-red-600">
            {periodLabel ?? "Artilharia & assistências"}
          </p>
        </div>
        <div className="flex gap-6 text-right">
          <div className="rounded-xl bg-slate-50 px-5 py-3">
            <p className="font-display text-4xl font-bold leading-none tabular text-red-600">{goals}</p>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">gols</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-5 py-3">
            <p className="font-display text-4xl font-bold leading-none tabular text-red-500">{assists}</p>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">assist.</p>
          </div>
        </div>
      </div>

      <div className="mt-10 flex gap-8">
        <Column rows={rows} metric="goals" />
        <Column rows={rows} metric="assists" />
      </div>

      <div className="mt-10 flex items-center justify-between border-t border-slate-200 pt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Carniceiros Fut 7
        </p>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Atualizado em{" "}
          {new Date().toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            timeZone: "America/Sao_Paulo",
          })}
        </p>
      </div>
    </div>
  );
});
