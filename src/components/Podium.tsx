import { PlayerAvatar } from "@/components/PlayerAvatar";
import { displayName, type PlayerTotals } from "@/lib/team-data";

type Props = {
  rows: PlayerTotals[];
  metric: "goals" | "assists";
  title: string;
  suffix: string;
};

const ORDER = [1, 0, 2];
const HEIGHTS = ["h-24", "h-32", "h-20"];

export function Podium({ rows, metric, title, suffix }: Props) {
  const other = metric === "goals" ? "assists" : "goals";
  const top = [...rows]
    .filter((r) => r[metric] > 0)
    .sort((a, b) => b[metric] - a[metric] || b[other] - a[other] || a.name.localeCompare(b.name))
    .slice(0, 3);

  if (top.length === 0) return null;

  return (
    <section className="rounded-lg border border-border/60 bg-card p-4">
      <p className="text-center text-[11px] uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="mt-4 grid grid-cols-3 items-end gap-2">
        {ORDER.map((slot, i) => {
          const player = top[slot];
          const place = slot + 1;
          if (!player) return <div key={slot} aria-hidden />;
          return (
            <div key={player.player_id} className="flex flex-col items-center">
              <PlayerAvatar
                src={player.photo_url}
                name={displayName(player)}
                className={place === 1 ? "size-20" : "size-14"}
              />
              <p className="mt-1 w-full truncate text-center text-xs font-semibold leading-tight">
                {displayName(player)}
              </p>
              <p className="text-[11px] text-primary">
                {player[metric]} {suffix}
              </p>
              <div
                className={`mt-2 flex w-full items-start justify-center rounded-t-md pt-1.5 ${
                  HEIGHTS[i]
                } ${place === 1 ? "bg-primary/25" : "bg-secondary"}`}
              >
                <span className="font-display text-2xl leading-none tabular text-foreground">
                  {place}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
