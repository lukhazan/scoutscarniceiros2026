import { supabase } from "@/integrations/supabase/client";

export type BrandIdentity = {
  id: string;
  team_name: string;
  crest_url: string | null;
  crest_white_url: string | null;
  crest_black_url: string | null;
  footer_logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_primary: string;
  font_secondary: string;
  watermark_url: string | null;
  sponsors: string[];
};

export type MediaCategory = "fundo" | "escudo" | "patrocinador" | "foto";

export const MEDIA_CATEGORIES: { value: MediaCategory; label: string }[] = [
  { value: "fundo", label: "Fundos" },
  { value: "escudo", label: "Escudos" },
  { value: "patrocinador", label: "Patrocinadores" },
  { value: "foto", label: "Fotos temporárias" },
];

export type MediaAsset = {
  id: string;
  name: string;
  category: MediaCategory;
  url: string;
  created_at: string;
};

export type ArtTemplateRow = {
  id: string;
  slug: string;
  name: string;
  category: string;
  preview_url: string | null;
  fields: string[];
  default_background_url: string | null;
  status: string;
};

export const brandIdentityQueryOptions = {
  queryKey: ["brand-identity"],
  queryFn: async (): Promise<BrandIdentity | null> => {
    const { data, error } = await supabase
      .from("brand_identity")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      ...data,
      sponsors: Array.isArray(data.sponsors) ? (data.sponsors as string[]) : [],
    } as BrandIdentity;
  },
};

export const mediaAssetsQueryOptions = {
  queryKey: ["media-assets"],
  queryFn: async (): Promise<MediaAsset[]> => {
    const { data, error } = await supabase
      .from("media_assets")
      .select("id,name,category,url,created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as MediaAsset[];
  },
};

export const artTemplatesQueryOptions = {
  queryKey: ["art-templates"],
  queryFn: async (): Promise<ArtTemplateRow[]> => {
    const { data, error } = await supabase
      .from("art_templates")
      .select("id,slug,name,category,preview_url,fields,default_background_url,status")
      .order("name", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((row) => ({
      ...row,
      fields: Array.isArray(row.fields) ? (row.fields as string[]) : [],
    })) as ArtTemplateRow[];
  },
};

export const ACCEPTED_IMAGE_TYPES = "image/png,image/jpeg,image/jpg,image/webp";
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

/**
 * Lê a imagem escolhida (galeria no celular / explorador no desktop),
 * reduz para no máximo `maxSide` px e devolve um data URL.
 * PNG mantém transparência; demais formatos viram JPEG leve.
 */
/**
 * Lê a imagem preservando o arquivo original. Só reduz quando o arquivo é
 * gigantesco (acima de `maxSide`), para não estourar memória no celular —
 * nunca gera thumbnail nem recomprime imagens dentro do limite.
 */
export async function fileToStudioImage(file: File, maxSide = 4096): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Selecione uma imagem PNG, JPG ou WEBP.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Imagem muito grande. Envie um arquivo de até 12 MB.");
  }

  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    el.src = source;
  });

  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  if (scale === 1 && file.size < 900 * 1024) return source;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return source;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const transparent = file.type === "image/png" || file.type === "image/webp";
  return canvas.toDataURL(transparent ? "image/png" : "image/jpeg", 0.92);
}

export async function saveMediaAsset(input: {
  name: string;
  category: MediaCategory;
  url: string;
}) {
  const { error } = await supabase.from("media_assets").insert(input);
  if (error) throw error;
}

export async function deleteMediaAsset(id: string) {
  const { error } = await supabase.from("media_assets").delete().eq("id", id);
  if (error) throw error;
}
