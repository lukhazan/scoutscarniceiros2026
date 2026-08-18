import type { Zone } from "@/lib/studio/zones";
import type { BrandIdentity } from "@/lib/studio-data";

/** Um patrocinador da arte (logo + ajustes individuais). */
export type SponsorItem = {
  id: string;
  url: string;
  /** nome opcional, apenas para identificar no painel */
  name?: string;
  /** multiplicador do tamanho base calculado pela área */
  scale: number;
  /** largura fixa em px (opcional, sobrepõe o cálculo automático) */
  width?: number | null;
  /** altura fixa em px (opcional, sobrepõe o cálculo automático) */
  height?: number | null;
  offsetX: number;
  offsetY: number;
};

export type SponsorArrange = "auto" | "row" | "column" | "grid";

/**
 * Configuração completa da área de patrocinadores.
 * Fica dentro do ArtData para poder ser salva junto com o template.
 */
export type SponsorConfig = {
  /** área do canvas destinada às logos (px na composição 1080x1920) */
  area: Zone;
  arrange: SponsorArrange;
  /** colunas usadas no modo grade */
  columns: number;
  gapX: number;
  gapY: number;
  padding: number;
  alignX: "flex-start" | "center" | "flex-end";
  alignY: "flex-start" | "center" | "flex-end";
  /** escala global aplicada a todas as logos */
  logoScale: number;
  items: SponsorItem[];
  /** preparação para templates salvos: logos fixas (não editáveis na Arte Rápida) */
  locked: boolean;
  /** true após a migração dos patrocinadores da identidade visual */
  migrated: boolean;
};

export const DEFAULT_SPONSOR_AREA: Zone = { x: 60, y: 1660, width: 960, height: 160 };

export const DEFAULT_SPONSOR_CONFIG: SponsorConfig = {
  area: DEFAULT_SPONSOR_AREA,
  arrange: "auto",
  columns: 3,
  gapX: 32,
  gapY: 24,
  padding: 12,
  alignX: "center",
  alignY: "center",
  logoScale: 1,
  items: [],
  locked: false,
  migrated: false,
};

export function newSponsorItem(url: string, name?: string): SponsorItem {
  return {
    id: `sp-${Math.random().toString(36).slice(2, 9)}`,
    url,
    name,
    scale: 1,
    width: null,
    height: null,
    offsetX: 0,
    offsetY: 0,
  };
}

/**
 * Migração: converte os patrocinadores já cadastrados na identidade visual
 * (logo do rodapé + logos dos patrocinadores) para a nova estrutura,
 * mantendo-os visíveis exatamente como antes.
 */
export function sponsorsFromBrand(brand: BrandIdentity | null): SponsorItem[] {
  if (!brand) return [];
  const urls = [brand.footer_logo_url, ...(brand.sponsors ?? [])].filter(
    (u): u is string => Boolean(u),
  );
  return urls.map((url, i) => newSponsorItem(url, i === 0 && brand.footer_logo_url ? "Logo do rodapé" : `Patrocinador ${i + 1}`));
}

/** Número de colunas usado no arranjo automático. */
export function autoColumns(count: number) {
  if (count <= 1) return 1;
  if (count <= 3) return count;
  if (count === 4) return 2;
  return 3;
}

export function resolveColumns(config: SponsorConfig, count: number) {
  if (count === 0) return 1;
  switch (config.arrange) {
    case "row":
      return count;
    case "column":
      return 1;
    case "grid":
      return Math.max(1, Math.min(config.columns, count));
    default:
      return autoColumns(count);
  }
}

/** Tamanho base (célula) de cada logo dentro da área configurada. */
export function sponsorCellSize(config: SponsorConfig, count: number) {
  const columns = resolveColumns(config, count);
  const rows = Math.max(1, Math.ceil(count / columns));
  const innerW = Math.max(1, config.area.width - config.padding * 2);
  const innerH = Math.max(1, config.area.height - config.padding * 2);
  const width = Math.max(1, (innerW - config.gapX * (columns - 1)) / columns);
  const height = Math.max(1, (innerH - config.gapY * (rows - 1)) / rows);
  return { columns, rows, width, height };
}
