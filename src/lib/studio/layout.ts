import { STORY_HEIGHT, STORY_WIDTH } from "@/lib/studio/constants";
import type { Zone } from "@/lib/studio/zones";

export { STORY_HEIGHT, STORY_WIDTH };

/** Identificador de cada camada independente do motor de renderização. */
export type LayerId =
  | "background"
  | "graphics"
  | "overlay"
  | "watermark"
  | "crest"
  | "teamName"
  | "photo"
  | "playerName"
  | "title"
  | "subtitle"
  | "agenda"
  | "sponsors";

/** Margens internas do canvas fixo 1080x1920. */
export const SAFE_AREA = { top: 80, bottom: 120, left: 60, right: 60 } as const;

/** Grid invisível apenas para alinhamento (não é renderizado). */
export const GRID = { columns: 12, rows: 24 } as const;

export const SAFE_BOX = {
  x: SAFE_AREA.left,
  y: SAFE_AREA.top,
  width: STORY_WIDTH - SAFE_AREA.left - SAFE_AREA.right,
  height: STORY_HEIGHT - SAFE_AREA.top - SAFE_AREA.bottom,
};

/** Garante que uma zona nunca ultrapasse a área segura. */
export function clampToSafeArea(zone: Zone): Zone {
  const width = Math.min(zone.width, SAFE_BOX.width);
  const height = Math.min(zone.height, SAFE_BOX.height);
  const x = Math.min(Math.max(zone.x, SAFE_BOX.x), SAFE_BOX.x + SAFE_BOX.width - width);
  const y = Math.min(Math.max(zone.y, SAFE_BOX.y), SAFE_BOX.y + SAFE_BOX.height - height);
  return { x, y, width, height };
}


/** Camadas que o usuário pode selecionar e editar no painel de propriedades. */
export type SelectableLayerId = "photo" | "playerName" | "title" | "subtitle";

export type TextLayerConfig = {
  maxFontSize: number;
  charRatio: number;
  maxLines: number;
  lineHeight?: number;
  align?: "flex-start" | "center" | "flex-end";
  /** fonte padrão da camada */
  font?: "primary" | "secondary";
  /** cor padrão da camada */
  color?: "accent" | "primary" | "secondary";
  uppercase?: boolean;
  letterSpacing?: number;
  weight?: number;
  /** desenha um bloco de fundo colorido atrás do texto (ex.: nome do atleta) */
  chip?: boolean;
};

/**
 * Arquivo de configuração do template.
 * O renderizador lê apenas estas áreas — nenhuma posição fixa em código.
 */
export type TemplateLayout = {
  resolution: { width: number; height: number };
  areas: Record<Exclude<LayerId, "background" | "overlay" | "graphics">, Zone>;
  /** camadas ativas, na ordem de empilhamento */
  layers: LayerId[];
  /** elementos gráficos fixos do template (molduras, linhas, texturas) */
  graphics?: string[];
  text: Record<"teamName" | "playerName" | "title" | "subtitle", TextLayerConfig>;
  /** intensidade do gradiente de leitura sobre o fundo (0 desliga) */
  overlayStrength?: number;
};

const FULL = { width: STORY_WIDTH, height: STORY_HEIGHT };

export const BASE_LAYOUT: TemplateLayout = {
  resolution: FULL,
  layers: [
    "background",
    "graphics",
    "overlay",
    "watermark",
    "photo",
    "crest",
    "teamName",
    "playerName",
    "title",
    "subtitle",
    "sponsors",
  ],
  areas: {
    watermark: { x: 160, y: 500, width: 760, height: 760 },
    crest: { x: 60, y: 80, width: 150, height: 150 },
    teamName: { x: 620, y: 100, width: 400, height: 60 },
    photo: { x: 150, y: 80, width: 780, height: 1140 },
    playerName: { x: 60, y: 1240, width: 500, height: 70 },
    title: { x: 60, y: 1330, width: 960, height: 220 },
    subtitle: { x: 60, y: 1570, width: 960, height: 60 },
    agenda: { x: 60, y: 470, width: 960, height: 1170 },
    sponsors: { x: 60, y: 1660, width: 960, height: 110 },
  },

  text: {
    teamName: {
      maxFontSize: 34,
      charRatio: 0.95,
      maxLines: 1,
      align: "flex-end",
      weight: 700,
      letterSpacing: 6,
      uppercase: true,
    },
    playerName: {
      maxFontSize: 34,
      charRatio: 0.78,
      maxLines: 1,
      align: "flex-start",
      weight: 800,
      letterSpacing: 8,
      uppercase: true,
      chip: true,
    },
    title: {
      maxFontSize: 156,
      charRatio: 0.54,
      maxLines: 2,
      lineHeight: 0.94,
      align: "flex-start",
      font: "primary",
      weight: 900,
      letterSpacing: -2,
      uppercase: true,
    },
    subtitle: {
      maxFontSize: 42,
      charRatio: 0.52,
      maxLines: 1,
      align: "flex-start",
      weight: 600,
    },
  },
  overlayStrength: 1,
};

/** Cria um layout novo a partir do base, sobrescrevendo apenas o necessário. */
export function makeLayout(patch: Partial<TemplateLayout> = {}): TemplateLayout {
  const areas = { ...BASE_LAYOUT.areas, ...(patch.areas ?? {}) };
  const safeAreas = Object.fromEntries(
    Object.entries(areas).map(([k, v]) => [k, clampToSafeArea(v)]),
  ) as TemplateLayout["areas"];
  return {
    ...BASE_LAYOUT,
    ...patch,
    areas: safeAreas,
    text: { ...BASE_LAYOUT.text, ...(patch.text ?? {}) },

  };
}

/** Layout do template "Agenda da Semana" (mesmo canvas 1080x1920). */
export const AGENDA_LAYOUT: TemplateLayout = makeLayout({
  layers: [
    "background",
    "graphics",
    "overlay",
    "watermark",
    "crest",
    "teamName",
    "title",
    "agenda",
    "subtitle",
    "sponsors",
  ],
  areas: {
    ...BASE_LAYOUT.areas,
    title: { x: 60, y: 250, width: 960, height: 180 },
    agenda: { x: 60, y: 470, width: 960, height: 1120 },
    subtitle: { x: 60, y: 1600, width: 960, height: 60 },
  },
  text: {
    ...BASE_LAYOUT.text,
    title: {
      ...BASE_LAYOUT.text.title,
      maxFontSize: 120,
      maxLines: 2,
      align: "center",
    },
    subtitle: { ...BASE_LAYOUT.text.subtitle, align: "center" },
  },
});
