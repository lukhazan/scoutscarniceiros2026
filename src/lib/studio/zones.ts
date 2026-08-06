import { STORY_HEIGHT, STORY_WIDTH } from "@/lib/studio/constants";

/** Retângulo em px na composição 1080x1920. */
export type Zone = { x: number; y: number; width: number; height: number };

export type TemplateZones = {
  photoArea: Zone;
  nameArea: Zone;
  titleArea: Zone;
  subtitleArea: Zone;
  sponsorArea: Zone;
  crestArea: Zone;
  logoArea: Zone;
};

/** Zonas padrão (referência visual do briefing). */
export const DEFAULT_ZONES: TemplateZones = {
  photoArea: { x: 160, y: 250, width: 760, height: 980 },
  nameArea: { x: 90, y: 1330, width: 900, height: 80 },
  titleArea: { x: 90, y: 1430, width: 900, height: 160 },
  subtitleArea: { x: 90, y: 1600, width: 900, height: 60 },
  sponsorArea: { x: 90, y: 1700, width: 900, height: 120 },
  crestArea: { x: 64, y: 64, width: 150, height: 150 },
  logoArea: { x: 640, y: 84, width: 376, height: 60 },
};

export const RESOLUTION = { width: STORY_WIDTH, height: STORY_HEIGHT };

/** Converte uma zona em estilo absoluto. */
export function zoneStyle(zone: Zone): React.CSSProperties {
  return {
    position: "absolute",
    left: zone.x,
    top: zone.y,
    width: zone.width,
    height: zone.height,
  };
}
