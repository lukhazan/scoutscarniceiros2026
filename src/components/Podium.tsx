import { PlayerAvatar } from "@/components/PlayerAvatar";
import { displayName, type PlayerTotals } from "@/lib/team-data";

type Props = {
  rows: PlayerTotals[];
  title: string;
  suffix: string;
  /** Valor exibido/ordenado para cada atleta nesta categoria. */
  valueOf: (row: PlayerTotals) => number;
};

const ORDER = [1, 0, 2];
const HEIGHTS = ["h-24", "h-32", "h-20"];
export const MEDALS = ["🏆", "🥈", "🥉"];

export function topThree(rows: PlayerTotals[], valueOf: (row: PlayerTotals) => number) {
  return [...rows]
    .filter((r) => valueOf(r) > 0)
    .sort((a, b) => valueOf(b) - valueOf(a) || a.name.localeCompare(b.name))
    .slice(0, 3);
}

export function Podium({ rows, title, suffix, valueOf }: Props) {
  const top = topThree(rows, valueOf);

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
              <span className={place === 1 ? "text-2xl leading-none" : "text-lg leading-none"}>
                {MEDALS[slot]}
              </span>
              <PlayerAvatar
                src={player.photo_url}
                name={displayName(player)}
                className={`mt-1 ${place === 1 ? "size-20 ring-2 ring-primary" : "size-14"}`}
              />
              <p
                className={`mt-1 w-full truncate text-center font-semibold leading-tight ${
                  place === 1 ? "text-sm" : "text-xs"
                }`}
              >
                {displayName(player)}
              </p>
              <p
                className={`text-[11px] ${place === 1 ? "font-bold text-primary" : "text-muted-foreground"}`}
              >
                {valueOf(player)} {suffix}
              </p>
              <div
                className={`mt-2 flex w-full items-start justify-center rounded-t-md pt-1.5 ${
                  HEIGHTS[i]
                } ${place === 1 ? "bg-primary/30 ring-1 ring-primary/50" : "bg-secondary"}`}
              >
                <span
                  className={`font-display leading-none tabular ${
                    place === 1 ? "text-3xl text-primary" : "text-2xl text-foreground"
                  }`}
                >
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
