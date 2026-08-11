import { AGENDA_LAYOUT, BASE_LAYOUT, STORY_HEIGHT, STORY_WIDTH, type TemplateLayout } from "@/lib/studio/layout";
import { TemplateRenderer, artPlayerName } from "@/lib/studio/TemplateRenderer";
import { EMPTY_ART_DATA, type ArtData, type ArtPlayer, type TemplateRenderProps } from "@/lib/studio/types";

export { STORY_HEIGHT, STORY_WIDTH, artPlayerName, EMPTY_ART_DATA };
export type { ArtData, ArtPlayer, TemplateRenderProps };

/** Campos que um template pode pedir ao administrador. */
export type StudioField =
  | "player"
  | "goals"
  | "title"
  | "subtitle"
  | "background"
  | "playerPhoto"
  | "agenda";

export type StudioTemplate = {
  slug: string;
  name: string;
  emoji: string;
  category: string;
  fields: StudioField[];
  /** arquivo de configuração de áreas/camadas do template */
  layout: TemplateLayout;
  /** título automático calculado a partir dos dados (editável) */
  autoTitle: (data: ArtData) => string;
  defaults: Partial<ArtData>;
};

export function goalsHeadline(goals: number) {
  if (goals <= 1) return "GOL";
  if (goals === 3) return "HAT-TRICK";
  return `${goals} GOLS`;
}

/**
 * Catálogo de templates. Um novo template = um novo objeto de configuração,
 * sem qualquer alteração no motor de renderização.
 */
export const STUDIO_TEMPLATES: StudioTemplate[] = [
  {
    slug: "gol",
    name: "Gol",
    emoji: "⚽",
    category: "partida",
    fields: ["player", "goals", "title", "subtitle", "background", "playerPhoto"],
    layout: BASE_LAYOUT,
    autoTitle: (data) => goalsHeadline(data.goals),
    defaults: { goals: 1, subtitle: "" },
  },
  {
    slug: "craque",
    name: "Craque da Partida",
    emoji: "⭐",
    category: "partida",
    fields: ["player", "title", "subtitle", "background", "playerPhoto"],
    layout: BASE_LAYOUT,
    autoTitle: () => "CRAQUE DA PARTIDA",
    defaults: { subtitle: "", title: "CRAQUE DA PARTIDA" },
  },
  {
    slug: "agenda-semana",
    name: "Agenda da Semana",
    emoji: "🗓️",
    category: "equipe",
    fields: ["agenda", "title", "subtitle", "background"],
    layout: AGENDA_LAYOUT,
    autoTitle: () => "AGENDA DA SEMANA",
    defaults: { title: "AGENDA DA SEMANA", subtitle: "", agendaMode: "auto", agendaWeekOffset: 0 },
  },
];

export function getTemplate(slug: string) {
  return STUDIO_TEMPLATES.find((t) => t.slug === slug) ?? STUDIO_TEMPLATES[0];
}

/** Render único usado por prévia e exportação. */
export function TemplateArt({
  template,
  ...props
}: TemplateRenderProps & { template: StudioTemplate }) {
  return (
    <TemplateRenderer
      {...props}
      layout={template.layout}
      headline={props.data.title || template.autoTitle(props.data)}
    />
  );
}
