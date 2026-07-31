import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ensureAdminRole } from "@/lib/admin.functions";

/** Reaproveita a mesma checagem do AdminGate, mas sem bloquear a tela. */
export function useIsAdmin() {
  const ensure = useServerFn(ensureAdminRole);
  const { data } = useQuery({
    queryKey: ["is-admin"],
    queryFn: () => ensure(),
    retry: false,
  });
  return !!data?.isAdmin;
}
