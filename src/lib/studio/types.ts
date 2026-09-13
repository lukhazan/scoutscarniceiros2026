import type { BrandIdentity } from "@/lib/studio-data";
import type { LayerId, SelectableLayerId } from "@/lib/studio/layout";
import type { AgendaArtItem } from "@/lib/studio/agenda-art";
import { DEFAULT_SPONSOR_CONFIG, type SponsorConfig } from "@/lib/studio/sponsors";

/** Caixa de fundo reutilizável por qualquer camada de texto. */
export type TextBackground = {
  enabled: boolean;
  /** auto = acompanha o texto; manual = tamanho definido pelo usuário */
  mode: "auto" | "manual";
  color: string;
  opacity: number;
  radius: number;
  paddingX: number;
  paddingY: number;
  width?: number;
  height?: number;
  offsetX: number;
  offsetY: number;
};

export const DEFAULT_TEXT_BACKGROUND: TextBackground = {
  enabled: false,
  mode: "auto",
  color: "#e11d2e",
  opacity: 1,
  radius: 0,
  paddingX: 26,
  paddingY: 10,
  offsetX: 0,
  offsetY: 0,
};

export type TextOverride = {
  color?: string;
  font?: "primary" | "secondary";
  /** família tipográfica explícita (ex.: "Bebas Neue") */
  fontFamily?: string;
  /** tamanho máximo em px definido pelo usuário */
  fontSize?: number;
  /** multiplicador do tamanho máximo definido pelo template (0.5 a 1.3) */
  sizeScale?: number;
  align?: "flex-start" | "center" | "flex-end";
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  uppercase?: boolean;
  /** fundo próprio deste texto (independente das outras camadas) */
  background?: TextBackground;
};


export type ArtData = {
  playerId: string | null;
  goals: number;
  title: string;
  subtitle: string;
  playerName: string;
  backgroundUrl: string | null;
  playerPhotoUrl: string | null;
  playerScale: number;
  playerOffsetX: number;
  playerOffsetY: number;
  playerRotation: number;
  /** camadas ocultas pelo usuário */
  hiddenLayers: LayerId[];
  /** camadas bloqueadas (não selecionáveis no canvas) */
  lockedLayers: LayerId[];
  /** ordem personalizada das camadas (de baixo para cima) */
  layerOrder: LayerId[] | null;
  textStyles: Partial<Record<"playerName" | "title" | "subtitle", TextOverride>>;
  /** Template Agenda da Semana: modo de preenchimento */
  agendaMode: "auto" | "manual";
  /** Semana selecionada (0 = atual, -1 = anterior, 1 = próxima) */
  agendaWeekOffset: number;
  /** Compromissos usados na arte (cópia somente de leitura da Agenda) */
  agendaItems: AgendaArtItem[];
  /** Template Relacionados: apelidos da lista, na ordem definida pelo usuário */
  rosterNames: string[];
  /** Template Relacionados: nomes (de rosterNames) que são goleiros — exibidos com 🧤 */
  rosterGoalkeepers: string[];
  /** Template Relacionados: exibir numeração manual ao lado dos apelidos */
  rosterShowNumbers: boolean;
  /** Template Relacionados: número de cada atleta (chave = apelido exibido) */
  rosterNumbers: Record<string, string>;
  /** Área e logos de patrocinadores (salva junto com o template) */
  sponsorConfig: SponsorConfig;
};

export type ArtPlayer = {
  id: string;
  name: string;
  nickname: string | null;
  position: string | null;
  shirt_number: number | null;
  photo_url: string | null;
  photo_original_url?: string | null;
};

export type TemplateRenderProps = {
  data: ArtData;
  brand: BrandIdentity | null;
  player: ArtPlayer | null;
  /** camada destacada no editor (não afeta a exportação) */
  selected?: SelectableLayerId | null;
  onSelect?: (layer: SelectableLayerId) => void;
  /** edição visual da área de patrocinadores (apenas no estúdio) */
  onSponsorAreaChange?: (area: { x: number; y: number; width: number; height: number }) => void;
};

export const EMPTY_ART_DATA: ArtData = {
  playerId: null,
  goals: 1,
  title: "GOL",
  subtitle: "",
  playerName: "",
  backgroundUrl: null,
  playerPhotoUrl: null,
  playerScale: 1,
  playerOffsetX: 0,
  playerOffsetY: 0,
  playerRotation: 0,
  hiddenLayers: [],
  lockedLayers: [],
  layerOrder: null,
  textStyles: {},
  agendaMode: "auto",
  agendaWeekOffset: 0,
  agendaItems: [],
  rosterNames: [],
  rosterGoalkeepers: [],
  sponsorConfig: DEFAULT_SPONSOR_CONFIG,
};
