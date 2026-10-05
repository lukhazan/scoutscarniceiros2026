import type { PeladaParticipant } from "@/lib/pelada-data";
import { splitByPosition } from "@/lib/pelada-data";

export function AmistosoLineup({
  list,
  slots,
  positions,
  positionOf,
  nameOf,
}: {
  list: PeladaParticipant[];
  slots: Record<string, number>;
  positions: readonly string[];
  positionOf: (playerId: string | null) => string;
  nameOf: (p: PeladaParticipant) => string;
}) {
  const groups = splitByPosition(list, slots, positionOf);
  const order = [...positions, ...Object.keys(groups).filter((k) => !positions.includes(k))];
  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      {order.map((pos) => {
        const g = groups[pos] ?? { starters: [], subs: [] };
        const limit = slots[pos];
        if (!limit && g.starters.length === 0) return null;
        return (
          <div key={pos} className="rounded-md border border-border/60 p-3">
            <p className="flex justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span>{pos}</span>
              <span>
                {g.starters.length}
                {limit != null ? `/${limit}` : ""}
              </span>
            </p>
            <ul className="mt-2 grid gap-1 text-sm">
              {g.starters.map((p) => (
                <li key={p.id}>• {nameOf(p)}</li>
              ))}
              {g.starters.length === 0 ? (
                <li className="text-muted-foreground">Ninguém ainda.</li>
              ) : null}
            </ul>
            {g.subs.length ? (
              <>
                <p className="mt-2 text-xs font-semibold text-muted-foreground">Suplentes</p>
                <ol className="mt-1 grid gap-1 text-sm text-muted-foreground">
                  {g.subs.map((p, i) => (
                    <li key={p.id}>
                      {i + 1}. {nameOf(p)}
                    </li>
                  ))}
                </ol>
              </>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
