import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Wallet } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { AdminGate } from "@/components/AdminGate";
import { OverdueAlert } from "@/components/OverdueAlert";
import { PlayerFinanceDialog } from "@/components/PlayerFinanceDialog";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { displayName, playersQueryOptions } from "@/lib/team-data";
import {
  competenceLabel,
  competenceOptions,
  currentCompetence,
  debtsQueryOptions,
  feeStatusLabel,
  feesQueryOptions,
  financeSettingsQueryOptions,
  formatMoney,
  generateMonthlyDebts,
  inCompetence,
  isOverdue,
  saveFinanceSettings,
  summarize,
  syncFees,
} from "@/lib/finance-data";


export const Route = createFileRoute("/_authenticated/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro — Carniceiros Fut 7" },
      {
        name: "description",
        content: "Controle de mensalidades e débitos dos atletas do time.",
      },
      { property: "og:title", content: "Financeiro — Carniceiros Fut 7" },
      {
        property: "og:description",
        content: "Controle de mensalidades e débitos dos atletas do time.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FinanceiroPage,
});

function FinanceiroPage() {
  const { data: players, isLoading } = useQuery(playersQueryOptions);
  const { data: fees } = useQuery(feesQueryOptions);
  const { data: debts } = useQuery(debtsQueryOptions);
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);

  const summary = useMemo(() => summarize(debts ?? [], fees ?? []), [debts, fees]);
  const sorted = useMemo(
    () => [...(players ?? [])].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [players],
  );

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 pb-[calc(4rem+env(safe-area-inset-bottom))] pt-6">
        <AdminGate>
          <div>
            <h1 className="font-display text-3xl leading-none sm:text-4xl">Financeiro</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Mensalidades e débitos do elenco.
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <SummaryCard label="Total a receber" value={formatMoney(summary.toReceive)} />
            <SummaryCard label="Total recebido" value={formatMoney(summary.received)} />
            <SummaryCard label="Inadimplentes" value={String(summary.overdueCount)} />
            <SummaryCard label="Mensalistas ativos" value={String(summary.activeFees)} />
          </div>

          <OverdueAlert className="mt-4" />

          {isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Carregando…</p>
          ) : sorted.length === 0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-border/70 p-8 text-center">
              <Wallet className="mx-auto size-6 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Cadastre os jogadores no elenco para controlar as mensalidades.
              </p>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-border/60 overflow-hidden rounded-lg border border-border/60 bg-card">
              {sorted.map((player) => {
                const fee = fees?.find((f) => f.player_id === player.id) ?? null;
                const own = (debts ?? []).filter((d) => d.player_id === player.id);
                const open = own
                  .filter((d) => d.status === "pendente")
                  .reduce((sum, d) => sum + d.amount, 0);
                const late = own.some(isOverdue);
                return (
                  <li key={player.id} className="flex items-center gap-3 px-3 py-3">
                    <PlayerAvatar
                      src={player.photo_url}
                      name={displayName(player)}
                      className="size-11"
                      fallback={
                        player.shirt_number == null ? undefined : String(player.shirt_number)
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold leading-tight">{displayName(player)}</p>
                      <p className="text-xs text-muted-foreground">
                        {fee
                          ? `${formatMoney(fee.amount)} · dia ${fee.due_day} · ${feeStatusLabel(fee.status)}`
                          : "Sem mensalidade definida"}
                      </p>
                      <p
                        className={`text-xs ${late ? "text-destructive" : "text-muted-foreground"}`}
                      >
                        Em aberto: {formatMoney(open)}
                        {late ? " · vencido" : ""}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 shrink-0"
                      onClick={() => setSelected({ id: player.id, name: displayName(player) })}
                    >
                      Gerenciar
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </AdminGate>
      </main>

      <PlayerFinanceDialog
        playerId={selected?.id ?? null}
        playerName={selected?.name ?? ""}
        open={selected !== null}
        onOpenChange={(next) => {
          if (!next) setSelected(null);
        }}
      />
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl leading-none">{value}</p>
    </div>
  );
}
