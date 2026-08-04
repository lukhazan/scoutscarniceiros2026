import { useQuery } from "@tanstack/react-query";
import { artTemplatesQueryOptions } from "@/lib/studio-data";
import { STUDIO_TEMPLATES } from "@/lib/studio/templates";

const FIELD_LABELS: Record<string, string> = {
  player: "Atleta",
  goals: "Quantidade de gols",
  title: "Texto principal",
  subtitle: "Texto complementar",
  background: "Fundo",
};

export function TemplatesPanel() {
  const { data: rows = [], isLoading } = useQuery(artTemplatesQueryOptions);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Estrutura da biblioteca de templates. Novos modelos são registrados aqui e no
        catálogo do estúdio, sem alterar as telas existentes.
      </p>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((row) => {
            const impl = STUDIO_TEMPLATES.find((t) => t.slug === row.slug);
            return (
              <div key={row.id} className="rounded-lg border border-border/60 bg-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-display text-lg">
                    {impl?.emoji ?? "🎨"} {row.name}
                  </p>
                  <span className="rounded-full border border-border/60 px-2 py-0.5 text-[11px] uppercase text-muted-foreground">
                    {row.status}
                  </span>
                </div>
                <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                  Categoria: {row.category}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Campos:{" "}
                  {(impl?.fields ?? row.fields)
                    .map((f) => FIELD_LABELS[f] ?? f)
                    .join(" · ")}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
