import { memo } from "react";
import { DEFAULT_ZONES, zoneStyle, type Zone } from "@/lib/studio/zones";

/** Limites de escala da foto do atleta. */
export const PLAYER_SCALE_MIN = 0.6;
export const PLAYER_SCALE_MAX = 1.8;
export const DEFAULT_PLAYER_SCALE = 1;

/** Compatibilidade com o controle antigo por passos. */
export const PLAYER_SCALES = [0.85, 1, 1.15, 1.3, 1.45] as const;
export type PlayerScale = number;

export type PlayerFrameProps = {
  photoUrl: string | null;
  scale?: number;
  /** deslocamento horizontal em % da largura da área (-50 a 50) */
  offsetX?: number;
  /** deslocamento vertical em % da altura da área (-50 a 50) */
  offsetY?: number;
  /** Zona configurada do template para a foto do atleta. */
  zone?: Zone;
};

/**
 * Camada independente da foto: mantém proporção, centraliza automaticamente
 * e corta somente o excedente fora da área configurada.
 */
export const PlayerFrame = memo(function PlayerFrame({
  photoUrl,
  scale = DEFAULT_PLAYER_SCALE,
  offsetX = 0,
  offsetY = 0,
  zone = DEFAULT_ZONES.photoArea,
}: PlayerFrameProps) {
  if (!photoUrl) return null;

  return (
    <div style={{ ...zoneStyle(zone), overflow: "hidden" }}>
      <img
        src={photoUrl}
        alt=""
        style={{
          position: "absolute",
          left: "50%",
          bottom: (offsetY / 100) * zone.height * -1,
          width: zone.width * scale,
          height: zone.height * scale,
          transform: `translateX(calc(-50% + ${(offsetX / 100) * zone.width}px))`,
          objectFit: "contain",
          objectPosition: "center bottom",
          filter: "drop-shadow(0 40px 60px rgba(0,0,0,0.55))",
        }}
      />
    </div>
  );
});
