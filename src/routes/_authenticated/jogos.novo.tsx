import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { AdminGate } from "@/components/AdminGate";
import { MatchForm } from "@/components/MatchForm";

export const Route = createFileRoute("/_authenticated/jogos/novo")({
  head: () => ({
    meta: [
      { title: "Lançar jogo — Súmula do time" },
      {
        name: "description",
        content: "Registre gols e assistências do jogo mais recente do time.",
      },
      { property: "og:title", content: "Lançar jogo — Súmula do time" },
      {
        property: "og:description",
        content: "Registre gols e assistências do jogo mais recente do time.",
      },
    ],
  }),
  component: NovoJogoPage,
});

function NovoJogoPage() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 pb-10 pt-6">
        <AdminGate>
          <h1 className="font-display text-4xl leading-none">Lançar jogo</h1>
          <p className="mb-5 mt-1 text-sm text-muted-foreground">
            Marque quem jogou e some os gols e assistências. A tabela atualiza sozinha.
          </p>
          <MatchForm />
        </AdminGate>
      </main>
    </div>
  );
}
