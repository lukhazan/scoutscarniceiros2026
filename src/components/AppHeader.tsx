import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import teamLogo from "@/assets/team-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/useSession";

export function AppHeader() {
  const { session, loading } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <img src={teamLogo} alt="Escudo do Carniceiros Fut 7" width={32} height={32} className="size-8 object-contain" />
          <span className="font-display text-xl leading-none">Carniceiros Fut 7</span>
        </Link>

        <nav className="ml-auto flex items-center gap-1">
          {!loading && session ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/elenco">Elenco</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/jogos">Jogos</Link>
              </Button>
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
