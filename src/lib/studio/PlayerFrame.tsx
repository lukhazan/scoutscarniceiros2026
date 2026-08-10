import { memo } from "react";
import { STORY_HEIGHT, STORY_WIDTH } from "@/lib/studio/constants";
import { DEFAULT_ZONES, type Zone } from "@/lib/studio/zones";

/** Limites de escala da foto do atleta. */
export const PLAYER_SCALE_MIN = 0.3;
export const PLAYER_SCALE_MAX = 3;
export const DEFAULT_PLAYER_SCALE = 1;

/** Compatibilidade com o controle antigo por passos. */
export const PLAYER_SCALES = [0.85, 1, 1.15, 1.3, 1.45] as const;
export type PlayerScale = number;

export type PlayerFrameProps = {
  photoUrl: string | null;
  scale?: number;
  /** deslocamento horizontal em px na composição 1080x1920 */
  offsetX?: number;
  /** deslocamento vertical em px na composição 1080x1920 */
  offsetY?: number;
  rotation?: number;
  /** Zona base do template usada apenas como tamanho inicial da foto. */
  zone?: Zone;
};

/**
 * Camada livre da foto: mantém proporção e pode ser movida/escalada por todo
 * o canvas, sem limites internos (o recorte só acontece na borda do canvas).
 */
export const PlayerFrame = memo(function PlayerFrame({
  photoUrl,
  scale = DEFAULT_PLAYER_SCALE,
  offsetX = 0,
  offsetY = 0,
  rotation = 0,
  zone = DEFAULT_ZONES.photoArea,
}: PlayerFrameProps) {
  if (!photoUrl) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: STORY_WIDTH,
        height: STORY_HEIGHT,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <img
        src={photoUrl}
        alt=""
        style={{
          position: "absolute",
          left: zone.x + zone.width / 2 + offsetX,
          top: zone.y + zone.height / 2 + offsetY,
          width: zone.width,
          height: zone.height,
          transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
          transformOrigin: "center center",
          objectFit: "contain",
          objectPosition: "center bottom",
          filter: "drop-shadow(0 40px 60px rgba(0,0,0,0.55))",
        }}
      />
    </div>
  );
});
