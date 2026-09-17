import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, CalendarDays, LogIn, LogOut, Menu, PanelLeft } from "lucide-react";
const teamLogo = "/team-logo-white-sm.png";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useSession } from "@/hooks/useSession";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { cn } from "@/lib/utils";
import {
  navOrderQueryOptions,
  orderModules,
  type NavModule,
} from "@/lib/nav-modules";

const PUBLIC_MODULES = [
  { id: "estatisticas", label: "Estatísticas", to: "/estatisticas", icon: BarChart3 },
  { id: "agenda-time", label: "Agenda", to: "/agenda-time", icon: CalendarDays },
] as const;

function NavList({
  modules,
  collapsed,
  onNavigate,
}: {
  modules: readonly { id: string; label: string; to: string; icon: NavModule["icon"] }[];
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="flex flex-col gap-1">
      {modules.map((m) => {
        const active = pathname === m.to || pathname.startsWith(`${m.to}/`);
        const Icon = m.icon;
        return (
          <Link
            key={m.id}
            to={m.to}
            onClick={onNavigate}
            title={m.label}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary/15 text-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
              collapsed && "justify-center px-0",
            )}
          >
            <Icon className="size-5 shrink-0" />
            {!collapsed && <span className="truncate">{m.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppHeader() {
  const { session, loading } = useSession();
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);

  const { data: order } = useQuery({ ...navOrderQueryOptions, enabled: !!session && isAdmin });

  const modules = isAdmin
    ? orderModules(order)
    : session
      ? PUBLIC_MODULES
      : PUBLIC_MODULES;

  useEffect(() => {
    document.body.classList.add("has-app-nav");
    document.documentElement.style.setProperty("--app-nav", collapsed ? "4.5rem" : "15rem");
    return () => {
      document.body.classList.remove("has-app-nav");
    };
  }, [collapsed]);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const brand = (
    <div className="flex min-w-0 items-center gap-2">
      <img
        src={teamLogo}
        alt="Escudo do Carniceiros Fut 7"
        width={32}
        height={32}
        className="size-8 shrink-0 object-contain"
      />
      {!collapsed && (
        <span className="truncate font-display text-lg leading-none">Carniceiros Fut 7</span>
      )}
    </div>
  );

  const footer =
    !loading && session ? (
      <Button
        variant="ghost"
        size="sm"
        className={cn("w-full justify-start gap-3", collapsed && "justify-center px-0")}
        onClick={handleSignOut}
      >
        <LogOut className="size-5 shrink-0" />
        {!collapsed && "Sair"}
      </Button>
    ) : !loading ? (
      <Button asChild size="sm" className={cn("w-full gap-2", collapsed && "px-0")}>
        <Link to="/auth">
          <LogIn className="size-4" />
          {!collapsed && "Entrar"}
        </Link>
      </Button>
    ) : null;

  return (
    <>
      {/* Sidebar — desktop */}
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border/70 bg-background lg:flex"
        style={{ width: "var(--app-nav, 15rem)" }}
      >
        <div
          className={cn(
            "flex items-center gap-2 border-b border-border/70 px-3 py-3",
            collapsed && "justify-center",
          )}
        >
          {brand}
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <NavList modules={modules} collapsed={collapsed} />
        </div>
        <div className="space-y-2 border-t border-border/70 p-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn("w-full justify-start gap-3", collapsed && "justify-center px-0")}
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            <PanelLeft className="size-5 shrink-0" />
            {!collapsed && "Recolher"}
          </Button>
          {footer}
        </div>
      </aside>

      {/* Topo — mobile */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur lg:hidden">
        <div className="flex items-center gap-2 px-3 py-2.5">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Abrir menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[17rem] p-0">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="flex h-full flex-col">
                <div className="flex items-center gap-2 border-b border-border/70 px-4 py-4">
                  <img src={teamLogo} alt="" width={32} height={32} className="size-8 object-contain" />
                  <span className="truncate font-display text-lg leading-none">
                    Carniceiros Fut 7
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  <NavList modules={modules} collapsed={false} onNavigate={() => setOpen(false)} />
                </div>
                <div className="border-t border-border/70 p-2">{footer}</div>
              </div>
            </SheetContent>
          </Sheet>
          <div className="min-w-0 flex-1">
            <span className="truncate font-display text-lg leading-none">Carniceiros Fut 7</span>
          </div>
          <img src={teamLogo} alt="" width={28} height={28} className="size-7 shrink-0 object-contain" />
        </div>
      </header>
    </>
  );
}
