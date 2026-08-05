import { STORY_HEIGHT, STORY_WIDTH } from "@/lib/studio/constants";

/** Escalas permitidas para a foto do atleta. */
export const PLAYER_SCALES = [0.85, 1, 1.15, 1.3] as const;
export type PlayerScale = (typeof PLAYER_SCALES)[number];
export const DEFAULT_PLAYER_SCALE: PlayerScale = 1;

/** Altura base: ~65% da altura útil da composição. */
const BASE_HEIGHT_RATIO = 0.65;

export type PlayerFrameProps = {
  photoUrl: string | null;
  scale?: number;
  /** Distância do topo em px na composição 1080x1920. */
  top?: number;
  /** Largura máxima em px. */
  maxWidth?: number;
};

/**
 * Componente reutilizável de enquadramento do atleta.
 * Mantém proporção original, centraliza automaticamente e escala
 * apenas pelo controle "Escala do atleta". Sem foto, não ocupa espaço.
 */
export function PlayerFrame({
  photoUrl,
  scale = DEFAULT_PLAYER_SCALE,
  top = 300,
  maxWidth = 900,
}: PlayerFrameProps) {
  if (!photoUrl) return null;

  const boxHeight = STORY_HEIGHT * BASE_HEIGHT_RATIO;
  const height = boxHeight * scale;
  const width = Math.min(maxWidth * scale, STORY_WIDTH);

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top,
        height: boxHeight,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <img
        src={photoUrl}
        alt=""
        style={{
          maxWidth: width,
          maxHeight: height,
          width: "auto",
          height: "auto",
          objectFit: "contain",
          objectPosition: "bottom center",
          filter: "drop-shadow(0 40px 60px rgba(0,0,0,0.55))",
        }}
      />
    </div>
  );
}
