import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import teamLogo from "@/assets/team-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/useSession";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export function AppHeader() {
  const { session, loading } = useSession();
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto grid max-w-3xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-4 py-3">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <img
            src={teamLogo}
            alt="Escudo do Carniceiros Fut 7"
            width={32}
            height={32}
            className="size-8 shrink-0 object-contain"
          />
          <span className="truncate font-display text-lg leading-none sm:text-xl">
            Carniceiros Fut 7
          </span>
        </Link>

        <nav className="flex shrink-0 items-center gap-1">
          {!loading && session ? (
            <>
              <Button asChild variant="ghost" size="sm" className="px-2 sm:px-3">
                <Link to="/elenco">Elenco</Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="px-2 sm:px-3">
                <Link to="/jogos">Jogos</Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="px-2 sm:px-3">
                <Link to="/agenda">Agenda</Link>
              </Button>
              {isAdmin ? (
                <Button asChild variant="ghost" size="sm" className="px-2 sm:px-3">
                  <Link to="/financeiro">Financeiro</Link>
                </Button>
              ) : null}
              <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sair">
                <LogOut className="size-4" />
              </Button>
            </>
          ) : (
            !loading && (
              <Button asChild size="sm">
                <Link to="/auth">Entrar</Link>
              </Button>
            )
          )}
        </nav>

      </div>
    </header>
  );
}
