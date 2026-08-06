import { DEFAULT_ZONES, zoneStyle, type Zone } from "@/lib/studio/zones";

/** Escalas permitidas para a foto do atleta. */
export const PLAYER_SCALES = [0.85, 1, 1.15, 1.3, 1.45] as const;
export type PlayerScale = (typeof PLAYER_SCALES)[number];
export const DEFAULT_PLAYER_SCALE: PlayerScale = 1;

export type PlayerFrameProps = {
  photoUrl: string | null;
  scale?: number;
  /** Zona configurada do template para a foto do atleta. */
  zone?: Zone;
};

/**
 * Enquadramento do atleta dentro da zona configurada (photoArea).
 * Mantém proporção, centraliza automaticamente e corta o excedente
 * fora da zona. A escala altera apenas o tamanho da foto na zona.
 */
export function PlayerFrame({
  photoUrl,
  scale = DEFAULT_PLAYER_SCALE,
  zone = DEFAULT_ZONES.photoArea,
}: PlayerFrameProps) {
  if (!photoUrl) return null;

  return (
    <div
      style={{
        ...zoneStyle(zone),
        overflow: "hidden",
      }}
    >
      <img
        src={photoUrl}
        alt=""
        style={{
          position: "absolute",
          left: "50%",
          bottom: 0,
          width: zone.width * scale,
          height: zone.height * scale,
          transform: "translateX(-50%)",
          objectFit: "cover",
          objectPosition: "center top",
          filter: "drop-shadow(0 40px 60px rgba(0,0,0,0.55))",
        }}
      />
    </div>
  );
}
