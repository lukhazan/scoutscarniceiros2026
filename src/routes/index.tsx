import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/**
 * Porta de entrada do app:
 * - administrador logado -> Visão Geral
 * - outro usuário logado -> Agenda do time
 * - sem login -> página pública de Estatísticas
 */
export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Carniceiros Fut 7 — Painel do time" },
      {
        name: "description",
        content:
          "Painel do Carniceiros Fut 7: visão geral do elenco, estatísticas, agenda e financeiro.",
      },
      { property: "og:title", content: "Carniceiros Fut 7 — Painel do time" },
      {
        property: "og:description",
        content:
          "Painel do Carniceiros Fut 7: visão geral do elenco, estatísticas, agenda e financeiro.",
      },
    ],
  }),
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    const user = error ? null : data.user;
    if (!user) throw redirect({ to: "/estatisticas", replace: true });

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");

    throw redirect({
      to: roles && roles.length > 0 ? "/visao-geral" : "/agenda-time",
      replace: true,
    });
  },
  component: Splash,
});

function Splash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Carregando…</p>
    </div>
  );
}
