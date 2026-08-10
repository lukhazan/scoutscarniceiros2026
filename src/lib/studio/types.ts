import type { BrandIdentity } from "@/lib/studio-data";
import type { LayerId, SelectableLayerId } from "@/lib/studio/layout";

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
};

export type ArtPlayer = {
  id: string;
  name: string;
  nickname: string | null;
  position: string | null;
  shirt_number: number | null;
  photo_url: string | null;
};

export type TemplateRenderProps = {
  data: ArtData;
  brand: BrandIdentity | null;
  player: ArtPlayer | null;
  /** camada destacada no editor (não afeta a exportação) */
  selected?: SelectableLayerId | null;
  onSelect?: (layer: SelectableLayerId) => void;
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
};
