import { createFileRoute } from "@tanstack/react-router";

/**
 * Serve imagens do armazenamento "media" (fotos de atletas, escudos, patrocinadores).
 * Os nomes são o hash do conteúdo, então o cache pode ser permanente.
 * Somente leitura e só arquivos com nome de hash — nada privado é exposto.
 */
export const Route = createFileRoute("/api/public/media/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = params._splat ?? "";
        if (!/^[a-f0-9]{64}\.(png|jpe?g|webp|gif|svg)$/.test(path)) {
          return new Response("Not found", { status: 404 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("media").download(path);
        if (error || !data) return new Response("Not found", { status: 404 });
        return new Response(data, {
          headers: {
            "Content-Type": data.type || "image/png",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
