import { memo } from "react";
import type { Zone } from "@/lib/studio/zones";
import { zoneStyle } from "@/lib/studio/zones";

export type ScoreColors = {
  primary: string;
  secondary: string;
  accent: string;
  fontPrimary: string;
  fontSecondary: string;
};

export function matchResultLabel(home: string, away: string) {
  const h = Number.parseInt(home, 10);
  const a = Number.parseInt(away, 10);
  if (!Number.isFinite(h) || !Number.isFinite(a)) return "";
  if (h > a) return "VITÓRIA";
  if (h < a) return "DERROTA";
  return "EMPATE";
}

/**
 * Camada do template "Resultado do Jogo": placar em destaque, equipes,
 * competição e data. Somente texto — imagens continuam nas outras camadas.
 */
export const ScoreLayer = memo(function ScoreLayer({
  zone,
  teamName,
  opponentName,
  homeScore,
  awayScore,
  competition,
  matchDate,
  resultLabel,
  homeLogoUrl,
  awayLogoUrl,
  homeLogoScale,
  awayLogoScale,
  homeLogoOffsetX,
  homeLogoOffsetY,
  awayLogoOffsetX,
  awayLogoOffsetY,
  colors,
}: {
  zone: Zone;
  teamName: string;
  opponentName: string;
  homeScore: string;
  awayScore: string;
  competition: string;
  matchDate: string;
  resultLabel: string;
  homeLogoUrl: string | null;
  awayLogoUrl: string | null;
  homeLogoScale: number;
  awayLogoScale: number;
  homeLogoOffsetX: number;
  homeLogoOffsetY: number;
  awayLogoOffsetX: number;
  awayLogoOffsetY: number;
  colors: ScoreColors;
}) {
  const result = resultLabel || matchResultLabel(homeScore, awayScore);

  return (
    <div
      style={{
        ...zoneStyle(zone),
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 34,
        textAlign: "center",
        color: colors.accent,
      }}
    >
      {competition ? (
        <div
          style={{
            fontFamily: colors.fontSecondary,
            fontSize: 34,
            fontWeight: 700,
            letterSpacing: 8,
            textTransform: "uppercase",
            background: colors.primary,
            padding: "10px 30px",
            borderRadius: 8,
          }}
        >
          {competition}
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "220px minmax(0, 1fr) 220px",
          alignItems: "center",
          gap: 20,
          width: "100%",
        }}
      >
        <Team
          name={teamName}
          logoUrl={homeLogoUrl}
          logoScale={homeLogoScale}
          logoOffsetX={homeLogoOffsetX}
          logoOffsetY={homeLogoOffsetY}
          colors={colors}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 92px 1fr",
            alignItems: "center",
            fontFamily: colors.fontPrimary,
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: 0,
            whiteSpace: "nowrap",
            textAlign: "center",
          }}
        >
          <span style={{ fontSize: 220 }}>{homeScore || "0"}</span>
          <span style={{ color: colors.primary, fontSize: 132 }}>X</span>
          <span style={{ fontSize: 220 }}>{awayScore || "0"}</span>
        </div>
        <Team
          name={opponentName}
          logoUrl={awayLogoUrl}
          logoScale={awayLogoScale}
          logoOffsetX={awayLogoOffsetX}
          logoOffsetY={awayLogoOffsetY}
          colors={colors}
        />
      </div>

      {result ? (
        <div
          style={{
            fontFamily: colors.fontPrimary,
            fontSize: 84,
            fontWeight: 900,
            letterSpacing: 4,
            color: colors.primary,
          }}
        >
          {result}
        </div>
      ) : null}

      {matchDate ? (
        <div
          style={{
            fontFamily: colors.fontSecondary,
            fontSize: 36,
            fontWeight: 600,
            letterSpacing: 4,
            opacity: 0.85,
          }}
        >
          {matchDate}
        </div>
      ) : null}
    </div>
  );
});

function Team({
  name,
  logoUrl,
  logoScale,
  logoOffsetX,
  logoOffsetY,
  colors,
}: {
  name: string;
  logoUrl: string | null;
  logoScale: number;
  logoOffsetX: number;
  logoOffsetY: number;
  colors: ScoreColors;
}) {
  if (logoUrl) {
    return (
      <div
        style={{
          width: 220,
          height: 220,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "visible",
        }}
      >
        <img
          src={logoUrl}
          alt={name}
          style={{
            width: 190,
            height: 190,
            objectFit: "contain",
            transform: `translate(${logoOffsetX}px, ${logoOffsetY}px) scale(${logoScale})`,
            transformOrigin: "center",
          }}
        />
      </div>
    );
  }
  return (
    <div
      style={{
        width: 220,
        minWidth: 0,
        fontFamily: colors.fontSecondary,
        fontSize: 40,
        fontWeight: 800,
        letterSpacing: 2,
        textTransform: "uppercase",
        lineHeight: 1.1,
        overflowWrap: "anywhere",
      }}
    >
      {name}
    </div>
  );
}
