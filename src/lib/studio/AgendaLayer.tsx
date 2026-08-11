import { memo } from "react";
import { zoneStyle, type Zone } from "@/lib/studio/zones";
import type { AgendaArtItem } from "@/lib/studio/agenda-art";

type Colors = {
  primary: string;
  secondary: string;
  accent: string;
  fontPrimary: string;
  fontSecondary: string;
};

/** Cards dos compromissos — desenhados dentro da zona do template. */
export const AgendaLayer = memo(function AgendaLayer({
  zone,
  items,
  teamName,
  colors,
}: {
  zone: Zone;
  items: AgendaArtItem[];
  teamName: string;
  colors: Colors;
}) {
  if (!items.length) return null;
  const list = items.slice(0, 5);
  const count = list.length;
  const gap = 26;
  const cardHeight = Math.min(300, (zone.height - gap * (count - 1)) / count);

  return (
    <div
      style={{
        ...zoneStyle(zone),
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap,
      }}
    >
      {list.map((item) => {
        const isGame = item.type === "jogo";
        return (
          <div
            key={item.id}
            style={{
              height: cardHeight,
              display: "flex",
              alignItems: "stretch",
              borderRadius: 22,
              overflow: "hidden",
              background: "rgba(0,0,0,0.62)",
              border: `2px solid ${colors.primary}55`,
            }}
          >
            <div
              style={{
                width: 230,
                background: colors.primary,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: 12,
              }}
            >
              <span
                style={{
                  fontFamily: colors.fontPrimary,
                  fontSize: Math.min(46, cardHeight * 0.26),
                  lineHeight: 1,
                  letterSpacing: 1,
                  color: colors.accent,
                  textAlign: "center",
                }}
              >
                {item.weekday}
              </span>
              <span
                style={{
                  fontFamily: colors.fontSecondary,
                  fontSize: Math.min(30, cardHeight * 0.17),
                  fontWeight: 800,
                  color: colors.accent,
                }}
              >
                {item.date}
              </span>
              {item.time ? (
                <span
                  style={{
                    fontFamily: colors.fontSecondary,
                    fontSize: Math.min(30, cardHeight * 0.17),
                    fontWeight: 700,
                    color: colors.accent,
                    opacity: 0.9,
                  }}
                >
                  {item.time}
                </span>
              ) : null}
            </div>

            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 6,
                padding: "14px 26px",
              }}
            >
              {isGame ? (
                <>
                  <span
                    style={{
                      fontFamily: colors.fontPrimary,
                      fontSize: Math.min(40, cardHeight * 0.22),
                      lineHeight: 1.05,
                      color: colors.accent,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {teamName.toUpperCase()}
                  </span>
                  <span
                    style={{
                      fontFamily: colors.fontSecondary,
                      fontSize: Math.min(22, cardHeight * 0.13),
                      fontWeight: 800,
                      letterSpacing: 4,
                      color: colors.primary,
                    }}
                  >
                    X
                  </span>
                  <span
                    style={{
                      fontFamily: colors.fontPrimary,
                      fontSize: Math.min(40, cardHeight * 0.22),
                      lineHeight: 1.05,
                      color: colors.accent,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {(item.opponent || item.title || "ADVERSÁRIO").toUpperCase()}
                  </span>
                </>
              ) : (
                <span
                  style={{
                    fontFamily: colors.fontPrimary,
                    fontSize: Math.min(48, cardHeight * 0.26),
                    lineHeight: 1.05,
                    color: colors.accent,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {(item.title || "COMPROMISSO").toUpperCase()}
                </span>
              )}

              {item.location ? (
                <span
                  style={{
                    fontFamily: colors.fontSecondary,
                    fontSize: Math.min(24, cardHeight * 0.13),
                    fontWeight: 600,
                    color: colors.accent,
                    opacity: 0.75,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  ▪ {item.location}
                </span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
});
