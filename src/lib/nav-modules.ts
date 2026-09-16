import {
  BarChart3,
  CalendarDays,
  Image,
  LayoutDashboard,
  Settings,
  Trophy,
  Users,
  Volleyball,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export type NavModule = {
  id: string;
  label: string;
  to:
    | "/visao-geral"
    | "/estatisticas"
    | "/elenco"
    | "/jogos"
    | "/agenda"
    | "/pelada"
    | "/financeiro"
    | "/estudio"
    | "/configuracoes";
  icon: LucideIcon;
};

/** Ordem padrão dos módulos quando a equipe ainda não personalizou. */
export const NAV_MODULES: NavModule[] = [
  { id: "geral", label: "Geral", to: "/visao-geral", icon: LayoutDashboard },
  { id: "estatisticas", label: "Estatísticas", to: "/estatisticas", icon: BarChart3 },
  { id: "elenco", label: "Elenco", to: "/elenco", icon: Users },
  { id: "jogos", label: "Jogos", to: "/jogos", icon: Trophy },
  { id: "agenda", label: "Agenda", to: "/agenda", icon: CalendarDays },
  { id: "pelada", label: "Pelada", to: "/pelada", icon: Volleyball },
  { id: "financeiro", label: "Financeiro", to: "/financeiro", icon: Wallet },
  { id: "artes", label: "Artes", to: "/estudio", icon: Image },
  { id: "configuracoes", label: "Configurações", to: "/configuracoes", icon: Settings },
];

export const NAV_ORDER_KEY = ["team_settings", "nav_order"] as const;

/** Aplica a ordem salva, mantendo todos os módulos (nada pode ser removido). */
export function orderModules(order: string[] | null | undefined): NavModule[] {
  if (!order || order.length === 0) return NAV_MODULES;
  const byId = new Map(NAV_MODULES.map((m) => [m.id, m]));
  const result: NavModule[] = [];
  for (const id of order) {
    const found = byId.get(id);
    if (found) {
      result.push(found);
      byId.delete(id);
    }
  }
  for (const m of NAV_MODULES) if (byId.has(m.id)) result.push(m);
  return result;
}

export const navOrderQueryOptions = {
  queryKey: NAV_ORDER_KEY,
  queryFn: async (): Promise<string[]> => {
    const { data, error } = await supabase
      .from("team_settings")
      .select("value")
      .eq("key", "nav_order")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data?.value) return [];
    try {
      const parsed = JSON.parse(data.value);
      return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      return [];
    }
  },
};

export async function saveNavOrder(order: string[]) {
  const { error } = await supabase
    .from("team_settings")
    .upsert({ key: "nav_order", value: JSON.stringify(order) }, { onConflict: "key" });
  if (error) throw new Error(error.message);
}
