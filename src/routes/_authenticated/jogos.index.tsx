import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { AdminGate } from "@/components/AdminGate";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  formatDate,
  matchTotalsQueryOptions,
  matchesQueryOptions,
  type Match,
} from "@/lib/team-data";

export const Route = createFileRoute("/_authenticated/jogos/")({
  head: () => ({
    meta: [
      { title: "Jogos — Súmula do time" },
      { name: "description", content: "Histórico de jogos lançados do time amador." },
      { property: "og:title", content: "Jogos — Súmula do time" },
      { property: "og:description", content: "Histórico de jogos lançados do time amador." },
    ],
  }),
  component: JogosPage,
});

function JogosPage() {
  const queryClient = useQueryClient();
  const { data: matches, isLoading } = useQuery(matchesQueryOptions);
  const { data: stats } = useQuery(matchTotalsQueryOptions);
  const [toDelete, setToDelete] = useState<Match | null>(null);

  const byMatch = useMemo(() => {
    const map = new Map<string, { goals: number; assists: number; played: number }>();
    for (const row of stats ?? []) {
      const current = map.get(row.match_id) ?? { goals: 0, assists: 0, played: 0 };
      map.set(row.match_id, {
        goals: current.goals + row.goals,
        assists: current.assists + row.assists,
        played: current.played + (row.played ? 1 : 0),
      });
    }
    return map;
  }, [stats]);

  async function confirmDelete() {
    if (!toDelete) return;
    const { error } = await supabase.from("matches").delete().eq("id", toDelete.id);
    setToDelete(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Jogo apagado. Tabela atualizada.");
    queryClient.invalidateQueries();
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-6">
        <AdminGate>
          <div className="flex items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-4xl leading-none">Jogos</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {(matches ?? []).length} jogo{(matches ?? []).length === 1 ? "" : "s"} lançado
                {(matches ?? []).length === 1 ? "" : "s"}
              </p>
            </div>
            <Button asChild>
              <Link to="/jogos/novo">
                <Plus className="mr-1 size-4" /> Lançar
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Carregando…</p>
          ) : (matches ?? []).length === 0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-border/70 p-8 text-center">
              <CalendarDays className="mx-auto size-6 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Nenhum jogo lançado ainda. Comece pelo jogo mais recente.
              </p>
            </div>
          ) : (
            <ul className="mt-5 divide-y divide-border/60 overflow-hidden rounded-lg border border-border/60 bg-card">
              {(matches ?? []).map((match) => {
                const totals = byMatch.get(match.id) ?? { goals: 0, assists: 0, played: 0 };
                return (
                  <li key={match.id} className="flex items-center gap-3 px-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold leading-tight">
                        {match.opponent?.trim() ? `vs ${match.opponent}` : "Jogo do time"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(match.match_date)} · {totals.goals} gols · {totals.assists}{" "}
                        assist. · {totals.played} presentes
                      </p>
                    </div>
                    <Button asChild variant="ghost" size="icon">
                      <Link to="/jogos/$matchId" params={{ matchId: match.id }}>
                        <Pencil className="size-4" />
                        <span className="sr-only">Editar</span>
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setToDelete(match)}>
                      <Trash2 className="size-4 text-destructive" />
                      <span className="sr-only">Apagar</span>
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </AdminGate>
      </main>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar este jogo?</AlertDialogTitle>
            <AlertDialogDescription>
              Os gols e assistências deste jogo saem da tabela geral.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Apagar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
