import { memo } from "react";
import { zoneStyle, type Zone } from "@/lib/studio/zones";

type Colors = {
  primary: string;
  secondary: string;
  accent: string;
  fontPrimary: string;
  fontSecondary: string;
};

/**
 * Lista de relacionados — apenas texto (apelidos), sem avatar/foto automática.
 * Quebra em duas colunas quando a lista fica longa.
 */
export const RosterLayer = memo(function RosterLayer({
  zone,
  names,
  goalkeepers = [],
  showNumbers = false,
  numbers = {},
  colors,
}: {
  zone: Zone;
  names: string[];
  goalkeepers?: string[];
  showNumbers?: boolean;
  numbers?: Record<string, string>;
  colors: Colors;
}) {
  const list = names.filter((n) => n.trim().length > 0);
  if (!list.length) return null;

  const twoColumns = list.length > 9;
  const rows = twoColumns ? Math.ceil(list.length / 2) : list.length;
  const gap = 14;
  const rowHeight = Math.min(88, (zone.height - gap * (rows - 1)) / rows);
  const fontSize = Math.max(24, Math.min(56, rowHeight * 0.62));

  return (
    <div
      style={{
        ...zoneStyle(zone),
        display: "grid",
        gridTemplateColumns: twoColumns ? "1fr 1fr" : "1fr",
        gridAutoFlow: "column",
        gridTemplateRows: `repeat(${rows}, minmax(0, ${rowHeight}px))`,
        columnGap: 40,
        rowGap: gap,
        alignContent: "center",
      }}
    >
      {list.map((name, i) => (
        <div
          key={`${name}-${i}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            height: rowHeight,
          }}
        >
          <span
            style={{
              width: fontSize * 1.5,
              textAlign: "right",
              fontFamily: colors.fontPrimary,
              fontSize: fontSize * 0.8,
              fontWeight: 900,
              color: colors.primary,
            }}
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          {goalkeepers.includes(name) ? (
            <span
              aria-label="Goleiro"
              style={{ fontSize: fontSize * 0.9, lineHeight: 1, flexShrink: 0 }}
            >
              🧤
            </span>
          ) : null}
          <span
            style={{
              flex: 1,
              minWidth: 0,
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              fontFamily: colors.fontSecondary,
              fontSize,
              fontWeight: 800,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: colors.accent,
            }}
          >
            {name}
          </span>
        </div>
      ))}
    </div>
  );
});
