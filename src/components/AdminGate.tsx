import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { ReactNode } from "react";
import { ensureAdminRole } from "@/lib/admin.functions";

/**
 * Garante que apenas o administrador do time veja as telas de edição.
 * O primeiro usuário que acessa vira administrador automaticamente.
 */
export function AdminGate({ children }: { children: ReactNode }) {
  const ensure = useServerFn(ensureAdminRole);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["is-admin"],
    queryFn: () => ensure(),
    retry: false,
  });

  if (isLoading) {
    return <p className="py-16 text-center text-sm text-muted-foreground">Carregando…</p>;
  }

  if (isError || !data?.isAdmin) {
    return (
      <div className="rounded-lg border border-dashed border-border/70 p-8 text-center">
        <h1 className="font-display text-3xl">Acesso restrito</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Somente o administrador do time pode lançar jogos e editar o elenco.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
