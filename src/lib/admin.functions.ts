import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Garante que o usuário logado seja administrador quando ainda não existe
 * nenhum administrador cadastrado (bootstrap do primeiro acesso) e devolve
 * se ele é admin.
 */
export const ensureAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: admins, error } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (error) throw new Error(error.message);

    if (!admins || admins.length === 0) {
      const { error: insertError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: context.userId, role: "admin" });
      if (insertError) throw new Error(insertError.message);
      return { isAdmin: true };
    }

    return { isAdmin: admins.some((row) => row.user_id === context.userId) };
  });
