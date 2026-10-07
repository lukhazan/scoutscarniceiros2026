import { supabase } from "@/integrations/supabase/client";

export const MEDIA_PREFIX = "/api/public/media/";

/**
 * Converte uma imagem embutida (data URL) em arquivo no armazenamento e devolve
 * um link curto. Assim as listas não baixam megabytes de imagem a cada consulta.
 * Valores que já são links são devolvidos sem alteração.
 */
export async function persistImage<T extends string | null | undefined>(value: T): Promise<T> {
  if (!value || !value.startsWith("data:")) return value;
  const blob = await (await fetch(value)).blob();
  const buf = await blob.arrayBuffer();
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", buf)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const ext = (blob.type.split("/")[1] ?? "png").replace("jpeg", "jpg").replace("svg+xml", "svg");
  const path = `${hash}.${ext}`;
  const { error } = await supabase.storage
    .from("media")
    .upload(path, blob, { contentType: blob.type, upsert: true });
  if (error) throw new Error(error.message);
  return `${MEDIA_PREFIX}${path}` as T;
}

/** Aplica persistImage nos campos indicados (e em arrays de links). */
export async function persistImageFields<T extends Record<string, unknown>>(
  obj: T,
  keys: (keyof T)[],
): Promise<T> {
  const out = { ...obj };
  for (const k of keys) {
    const v = out[k];
    if (Array.isArray(v)) {
      out[k] = (await Promise.all(
        v.map((x) => (typeof x === "string" ? persistImage(x) : x)),
      )) as T[keyof T];
    } else if (typeof v === "string") {
      out[k] = (await persistImage(v)) as T[keyof T];
    }
  }
  return out;
}
