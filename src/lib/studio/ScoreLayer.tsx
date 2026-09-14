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
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 40,
          width: "100%",
        }}
      >
        <Team name={teamName} colors={colors} />
        <div
          style={{
            fontFamily: colors.fontPrimary,
            fontSize: 250,
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: -6,
            whiteSpace: "nowrap",
          }}
        >
          {homeScore || "0"}
          <span style={{ color: colors.primary, padding: "0 14px" }}>x</span>
          {awayScore || "0"}
        </div>
        <Team name={opponentName} colors={colors} />
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

function Team({ name, colors }: { name: string; colors: ScoreColors }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        fontFamily: colors.fontSecondary,
        fontSize: 40,
        fontWeight: 800,
        letterSpacing: 2,
        textTransform: "uppercase",
        lineHeight: 1.1,
        wordBreak: "break-word",
      }}
    >
      {name}
    </div>
  );
}
