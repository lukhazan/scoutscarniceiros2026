import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { playersQueryOptions, displayName } from "@/lib/team-data";
import { debtsQueryOptions, formatMoney, overdueByPlayer } from "@/lib/finance-data";

/** Aviso administrativo com atletas que possuem débitos vencidos. */
export function OverdueAlert({ className }: { className?: string }) {
  const { data: debts } = useQuery(debtsQueryOptions);
  const { data: players } = useQuery(playersQueryOptions);

  const rows = overdueByPlayer(debts ?? []);
  if (rows.length === 0) return null;

  return (
    <section
      className={`rounded-lg border border-destructive/50 bg-destructive/10 p-4 ${className ?? ""}`}
    >
      <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
        <AlertTriangle className="size-4" />
        {rows.length} atleta{rows.length === 1 ? "" : "s"} com débitos vencidos
      </p>
      <ul className="mt-2 space-y-1">
        {rows.map((row) => {
          const player = players?.find((p) => p.id === row.player_id);
          return (
            <li
              key={row.player_id}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="min-w-0 truncate">
                {player ? displayName(player) : "Atleta"}
                <span className="text-muted-foreground">
                  {" "}
                  · {row.count} vencido{row.count === 1 ? "" : "s"} · {row.maxDaysLate}d
                </span>
              </span>
              <span className="shrink-0 font-semibold">{formatMoney(row.total)}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
