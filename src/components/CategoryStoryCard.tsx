import { forwardRef } from "react";
import { displayName, type PlayerTotals } from "@/lib/team-data";

const teamLogo = "/team-logo.png";

export type StoryCategory = "goals" | "assists" | "clean_sheets";

export const CATEGORY_META: Record<
  StoryCategory,
  { title: string; icon: string; suffix: string }
> = {
  goals: { title: "Artilharia", icon: "⚽", suffix: "gols" },
  assists: { title: "Assistências", icon: "🎯", suffix: "assist." },
  clean_sheets: { title: "Goleiros", icon: "🧤", suffix: "gols sofridos" },
};

const MEDALS = ["🏆", "🥈", "🥉"];
const ORDER = [1, 0, 2];

type Props = {
  category: StoryCategory;
  rows: PlayerTotals[];
  getValue: (row: PlayerTotals) => number;
  periodLabel: string;
};

/** Arte 1080x1920 (stories) com pódio + ranking geral da categoria. */
export const CategoryStoryCard = forwardRef<HTMLDivElement, Props>(function CategoryStoryCard(
  { category, rows, getValue, periodLabel },
  ref,
) {
  const meta = CATEGORY_META[category];
  const isKeeper = category === "clean_sheets";

  const list = isKeeper
    ? [...rows]
        .filter((r) => r.position === "Goleiro" && r.matches_played > 0)
        .sort(
          (a, b) =>
            a.goals_conceded - b.goals_conceded ||
            b.matches_played - a.matches_played ||
            a.name.localeCompare(b.name),
        )
    : [...rows]
        .filter((r) => getValue(r) > 0)
        .sort((a, b) => getValue(b) - getValue(a) || a.name.localeCompare(b.name));
  const top = list.slice(0, 3);
  const rest = list.slice(3);
  const columns = rest.length > 10 ? 2 : 1;
  const avatar = columns > 1 ? 52 : 64;
  const nameSize = columns > 1 ? 24 : 30;
  const valueSize = columns > 1 ? 28 : 36;
  const heights = [190, 250, 150];


  return (
    <div
      ref={ref}
      style={{ width: 1080, height: 1920 }}
      className="relative flex flex-col overflow-hidden bg-[#0a0a0a] px-16 py-14 text-white"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-3 bg-gradient-to-r from-red-700 via-red-500 to-red-700" />

      <header className="flex items-center gap-6 border-b border-white/10 pb-8">
        <img src={teamLogo} alt="" width={110} height={110} className="h-[110px] w-[110px] object-contain" />
        <div className="flex-1">
          <p className="font-display text-6xl font-bold uppercase leading-none tracking-tight text-white">
            {meta.icon} {meta.title}
          </p>
          <p className="mt-3 text-xl font-semibold uppercase tracking-[0.2em] text-red-500">
            {periodLabel}
          </p>
        </div>
      </header>

      {top.length > 0 ? (
        <div className="mt-12 grid grid-cols-3 items-end gap-6">
          {ORDER.map((slot, i) => {
            const player = top[slot];
            if (!player) return <div key={slot} aria-hidden />;
            const first = slot === 0;
            return (
              <div key={player.player_id} className="flex flex-col items-center">
                {player.photo_url ? (
                  <img
                    src={player.photo_url}
                    alt=""
                    style={{ height: first ? 200 : 150, width: first ? 200 : 150 }}
                    className="rounded-full border-4 border-red-600 bg-white/5 object-cover"
                  />
                ) : (
                  <div
                    style={{ height: first ? 200 : 150, width: first ? 200 : 150 }}
                    className="flex items-center justify-center rounded-full border-4 border-red-600 bg-white/10 font-display text-6xl"
                  >
                    {displayName(player).charAt(0)}
                  </div>
                )}
                <p
                  className="mt-4 flex w-full items-center justify-center gap-2 truncate text-center font-bold"
                  style={{ fontSize: first ? 38 : 30 }}
                >
                  <span style={{ fontSize: first ? 44 : 34, lineHeight: 1 }}>{MEDALS[slot]}</span>
                  <span className="truncate">{displayName(player)}</span>
                </p>
                <p
                  className="mt-1 font-display font-bold text-red-500"
                  style={{ fontSize: first ? 52 : 40 }}
                >
                  {isKeeper ? player.goals_conceded : getValue(player)}
                </p>
                {isKeeper && (
                  <p className="text-lg text-white/70">
                    {player.matches_played} jogo{player.matches_played === 1 ? "" : "s"}
                  </p>
                )}
                <div
                  style={{ height: heights[i] }}
                  className={`mt-2 flex w-full items-start justify-center rounded-t-2xl pt-4 ${
                    first ? "bg-red-600/40" : "bg-white/10"
                  }`}
                >
                  <span className="font-display text-6xl font-bold leading-none">{slot + 1}º</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="mt-8 flex min-h-0 flex-1 flex-col">
        <p className="mb-5 text-xl font-bold uppercase tracking-[0.3em] text-red-500">
          Ranking geral
        </p>
        {rest.length > 0 && (
          <ol
            className="grid gap-x-6"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${Math.ceil(rest.length / columns)}, min-content)`,
              gridAutoFlow: "column",
              rowGap: columns > 1 ? 10 : 12,
            }}
          >
            {rest.map((row, index) => (
              <li
                key={row.player_id}
                className="flex items-center rounded-2xl bg-white/5"
                style={{
                  gap: columns > 1 ? 14 : 20,
                  paddingLeft: columns > 1 ? 12 : 20,
                  paddingRight: columns > 1 ? 12 : 20,
                  paddingTop: columns > 1 ? 8 : 12,
                  paddingBottom: columns > 1 ? 8 : 12,
                }}
              >
                <span
                  className="flex shrink-0 items-center justify-center rounded-full bg-[#1f1f22] font-display font-bold"
                  style={{
                    height: avatar,
                    width: avatar,
                    fontSize: columns > 1 ? 22 : 28,
                  }}
                >
                  {index + 4}
                </span>
                {row.photo_url ? (
                  <img
                    src={row.photo_url}
                    alt=""
                    style={{ height: avatar, width: avatar }}
                    className="shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div
                    style={{ height: avatar, width: avatar, fontSize: columns > 1 ? 22 : 28 }}
                    className="flex shrink-0 items-center justify-center rounded-full bg-white/10 font-bold"
                  >
                    {displayName(row).charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <span
                    className="block truncate font-semibold"
                    style={{ fontSize: nameSize }}
                  >
                    {displayName(row)}
                  </span>
                  {isKeeper && (
                    <span className="text-base text-white/60">
                      {row.matches_played} jogo{row.matches_played === 1 ? "" : "s"}
                    </span>
                  )}
                </div>
                <span
                  className="font-display font-bold tabular text-red-500"
                  style={{ fontSize: valueSize }}
                >
                  {isKeeper ? row.goals_conceded : getValue(row)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>


      <footer className="mt-6 flex items-center justify-between border-t border-white/10 pt-6">
        <p className="text-xl font-semibold uppercase tracking-[0.2em] text-white/50">
          Carniceiros Fut 7
        </p>
        <p className="text-xl font-semibold tracking-wide text-white/50">
          scoutscarniceiros2026.lovable.app
        </p>
      </footer>
    </div>
  );
});
