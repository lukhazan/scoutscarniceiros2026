import { PlayerAvatar } from "@/components/PlayerAvatar";
import { displayName, type PlayerTotals } from "@/lib/team-data";

type Props = {
  rows: PlayerTotals[];
};

const ORDER = [1, 0, 2];
const HEIGHTS = ["h-24", "h-32", "h-20"];
const MEDALS = ["🏆", "🥈", "🥉"];

function topKeepers(rows: PlayerTotals[]) {
  return [...rows]
    .filter((r) => r.position === "Goleiro" && r.matches_played > 0)
    .sort(
      (a, b) =>
        a.goals_conceded - b.goals_conceded ||
        b.matches_played - a.matches_played ||
        a.name.localeCompare(b.name),
    )
    .slice(0, 3);
}

export function GoalkeeperPodium({ rows }: Props) {
  const top = topKeepers(rows);

  if (top.length === 0) return null;

  return (
    <section className="rounded-lg border border-border/60 bg-card p-4">
      <p className="text-center text-[11px] uppercase tracking-wide text-muted-foreground">
        Pódio · Goleiros
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
              <p className="text-[11px] text-muted-foreground">
                Goleiro · {player.matches_played} jogo{player.matches_played === 1 ? "" : "s"}
              </p>
              <p
                className={`text-[11px] uppercase tracking-wide ${
                  place === 1 ? "font-bold text-primary" : "text-muted-foreground"
                }`}
              >
                {player.goals_conceded} gols sofridos
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
