import { supabase } from "@/integrations/supabase/client";
import { EMPTY_ART_DATA, type ArtData } from "@/lib/studio/types";

/**
 * Campos que um template salvo pode liberar para edição no Modo Arte Rápida.
 * A lista é genérica de propósito: novos campos entram aqui sem tocar no motor.
 */
export type QuickField =
  | "playerPhoto"
  | "playerName"
  | "title"
  | "subtitle"
  | "goals"
  | "background"
  | "agenda";

export const QUICK_FIELDS: { id: QuickField; label: string }[] = [
  { id: "playerPhoto", label: "Foto do atleta" },
  { id: "playerName", label: "Nome do atleta" },
  { id: "title", label: "Título" },
  { id: "subtitle", label: "Subtítulo" },
  { id: "goals", label: "Quantidade de gols" },
  { id: "background", label: "Fundo" },
  { id: "agenda", label: "Compromissos da agenda" },
];

export const DEFAULT_EDITABLE_FIELDS: QuickField[] = ["playerPhoto", "playerName"];

export type SavedArtTemplate = {
  id: string;
  name: string;
  base_slug: string;
  art_data: ArtData;
  editable_fields: QuickField[];
  preview_url: string | null;
  created_at: string;
  updated_at: string;
};

/** Normaliza o JSON salvo garantindo todas as chaves do ArtData atual. */
export function toArtData(raw: unknown): ArtData {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Partial<ArtData>;
  return { ...EMPTY_ART_DATA, ...obj };
}

/**
 * Remove do template salvo o conteúdo variável (aquilo que o usuário do Modo
 * Arte Rápida vai preencher). O restante — composição, posições, escalas,
 * tipografia, camadas — é preservado exatamente como o designer deixou.
 */
export function stripVariableContent(data: ArtData, editable: QuickField[]): ArtData {
  const out: ArtData = { ...data };
  if (editable.includes("playerPhoto")) {
    out.playerId = null;
    out.playerPhotoUrl = null;
  }
  if (editable.includes("playerName")) out.playerName = "";
  return out;
}

export const savedArtTemplatesQueryOptions = {
  queryKey: ["saved-art-templates"],
  queryFn: async (): Promise<SavedArtTemplate[]> => {
    const { data, error } = await supabase
      .from("saved_art_templates")
      .select("id,name,base_slug,art_data,editable_fields,preview_url,created_at,updated_at")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((row) => ({
      ...row,
      art_data: toArtData(row.art_data),
      editable_fields: (Array.isArray(row.editable_fields)
        ? row.editable_fields
        : DEFAULT_EDITABLE_FIELDS) as QuickField[],
    }));
  },
};

export async function createSavedTemplate(input: {
  name: string;
  base_slug: string;
  art_data: ArtData;
  editable_fields: QuickField[];
}) {
  const { data, error } = await supabase
    .from("saved_art_templates")
    .insert({
      name: input.name,
      base_slug: input.base_slug,
      art_data: stripVariableContent(input.art_data, input.editable_fields) as never,
      editable_fields: input.editable_fields,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function updateSavedTemplate(
  id: string,
  input: { name: string; art_data: ArtData; editable_fields: QuickField[] },
) {
  const { error } = await supabase
    .from("saved_art_templates")
    .update({
      name: input.name,
      art_data: stripVariableContent(input.art_data, input.editable_fields) as never,
      editable_fields: input.editable_fields,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function duplicateSavedTemplate(tpl: SavedArtTemplate) {
  return createSavedTemplate({
    name: nextCopyName(tpl.name),
    base_slug: tpl.base_slug,
    art_data: tpl.art_data,
    editable_fields: tpl.editable_fields,
  });
}

export async function deleteSavedTemplate(id: string) {
  const { error } = await supabase.from("saved_art_templates").delete().eq("id", id);
  if (error) throw error;
}

/** "GOL — PADRÃO 01" -> "GOL — PADRÃO 02" (ou sufixo "cópia"). */
export function nextCopyName(name: string) {
  const m = /^(.*?)(\d+)\s*$/.exec(name);
  if (m) {
    const n = String(Number(m[2]) + 1).padStart(m[2].length, "0");
    return `${m[1]}${n}`;
  }
  return `${name} — cópia`;
}
