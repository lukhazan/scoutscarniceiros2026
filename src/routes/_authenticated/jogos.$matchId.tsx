import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";
import { AdminGate } from "@/components/AdminGate";
import { MatchForm } from "@/components/MatchForm";
import { matchesQueryOptions, formatDate } from "@/lib/team-data";

export const Route = createFileRoute("/_authenticated/jogos/$matchId")({
  head: () => ({
    meta: [
      { title: "Editar jogo — Súmula do time" },
      { name: "description", content: "Corrija os gols e assistências de um jogo lançado." },
      { property: "og:title", content: "Editar jogo — Súmula do time" },
      {
        property: "og:description",
        content: "Corrija os gols e assistências de um jogo lançado.",
      },
    ],
  }),
  component: EditarJogoPage,
});

function EditarJogoPage() {
  const { matchId } = Route.useParams();
  const { data: matches, isLoading } = useQuery(matchesQueryOptions);
  const match = matches?.find((m) => m.id === matchId);

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 pb-10 pt-6">
        <AdminGate>
          {isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Carregando…</p>
          ) : !match ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Jogo não encontrado.
            </p>
          ) : (
            <>
              <h1 className="font-display text-4xl leading-none">Editar jogo</h1>
              <p className="mb-5 mt-1 text-sm text-muted-foreground">
                {formatDate(match.match_date)}
                {match.opponent ? ` · vs ${match.opponent}` : ""}
              </p>
              <MatchForm match={match} />
            </>
          )}
        </AdminGate>
      </main>
    </div>
  );
}
