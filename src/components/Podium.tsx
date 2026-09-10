import { PlayerAvatar } from "@/components/PlayerAvatar";
import { compareDisplayName, displayName, type PlayerTotals } from "@/lib/team-data";

type Props = {
  rows: PlayerTotals[];
  title: string;
  suffix: string;
  /** Valor exibido/ordenado para cada atleta nesta categoria. */
  getValue: (row: PlayerTotals) => number;
};

const ORDER = [1, 0, 2];
const HEIGHTS = ["h-24", "h-32", "h-20"];
export const MEDALS = ["🏆", "🥈", "🥉"];

export function topThree(rows: PlayerTotals[], getValue: (row: PlayerTotals) => number) {
  return [...rows]
    .filter((r) => getValue(r) > 0)
    .sort((a, b) => getValue(b) - getValue(a) || compareDisplayName(a, b))
    .slice(0, 3);
}

export function Podium({ rows, title, suffix, getValue }: Props) {
  const top = topThree(rows, getValue);

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
                className={`${place === 1 ? "size-20" : "size-14"}`}
              />
              <p
                className={`mt-2 flex w-full items-center justify-center gap-1 truncate text-center font-semibold leading-tight ${
                  place === 1 ? "text-sm" : "text-xs"
                }`}
              >
                <span className={place === 1 ? "text-xl leading-none" : "text-base leading-none"}>
                  {MEDALS[slot]}
                </span>
                <span className="truncate">{displayName(player)}</span>
              </p>
              <p
                className={`text-[11px] ${place === 1 ? "font-bold text-primary" : "text-muted-foreground"}`}
              >
                {getValue(player)} {suffix}
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
