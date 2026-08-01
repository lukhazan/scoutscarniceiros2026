import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/team-data";
import {
  DEBT_CATEGORIES,
  DEBT_STATUS,
  FEE_STATUS,
  debtStatusLabel,
  debtsQueryOptions,
  deleteDebt,
  feesQueryOptions,
  formatMoney,
  isOverdue,
  saveDebt,
  saveFee,
  setDebtStatus,
  todayISO,
  type PlayerDebt,
  type PlayerFee,
} from "@/lib/finance-data";

type DebtForm = {
  id?: string;
  description: string;
  category: string;
  amount: string;
  due_date: string;
  status: PlayerDebt["status"];
  notes: string;
};

function emptyDebt(): DebtForm {
  return {
    description: "",
    category: "Mensalidade",
    amount: "",
    due_date: todayISO(),
    status: "pendente",
    notes: "",
  };
}

export function PlayerFinanceDialog({
  playerId,
  playerName,
  open,
  onOpenChange,
}: {
  playerId: string | null;
  playerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { data: fees } = useQuery(feesQueryOptions);
  const { data: debts } = useQuery(debtsQueryOptions);
  const fee = fees?.find((f) => f.player_id === playerId) ?? null;
  const list = (debts ?? []).filter((d) => d.player_id === playerId);

  const [feeForm, setFeeForm] = useState({
    amount: "",
    due_day: "10",
    status: "em_dia" as PlayerFee["status"],
    active: true,
    notes: "",
  });
  const [debtForm, setDebtForm] = useState<DebtForm | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDebtForm(null);
    setFeeForm({
      amount: fee ? String(fee.amount) : "",
      due_day: fee ? String(fee.due_day) : "10",
      status: fee?.status ?? "em_dia",
      active: fee?.active ?? true,
      notes: fee?.notes ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, playerId, fee?.id]);

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["player_fees"] });
    queryClient.invalidateQueries({ queryKey: ["player_debts"] });
  }

  const openTotal = list
    .filter((d) => d.status === "pendente")
    .reduce((sum, d) => sum + d.amount, 0);

  /** Enter salva, fecha o modal e volta para a lista principal. */
  function onEnter(handler: () => Promise<void>) {
    return (event: React.KeyboardEvent) => {
      if (event.key !== "Enter" || event.shiftKey) return;
      const target = event.target as HTMLElement;
      if (target.tagName === "TEXTAREA") return;
      event.preventDefault();
      void handler().then(() => onOpenChange(false));
    };
  }

  async function handleSaveFee(close = false) {
    if (!playerId) return;
    const amount = Number(feeForm.amount.replace(",", "."));
    const dueDay = Number(feeForm.due_day);
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error("Informe um valor válido para a mensalidade.");
      return;
    }
    if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
      toast.error("O dia de vencimento deve estar entre 1 e 31.");
      return;
    }
    setSaving(true);
    try {
      await saveFee({
        player_id: playerId,
        amount,
        due_day: dueDay,
        status: feeForm.status,
        active: feeForm.active,
        notes: feeForm.notes.trim() || null,
      });
      toast.success("Mensalidade atualizada.");
      refresh();
      if (close) onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveDebt(close = false) {
    if (!playerId || !debtForm) return;
    const description = debtForm.description.trim();
    const amount = Number(debtForm.amount.replace(",", "."));
    if (description.length < 2) {
      toast.error("Informe a descrição do lançamento.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Informe um valor válido.");
      return;
    }
    setSaving(true);
    try {
      await saveDebt({
        id: debtForm.id,
        player_id: playerId,
        description: description.slice(0, 120),
        category: debtForm.category,
        amount,
        due_date: debtForm.due_date,
        status: debtForm.status,
        notes: debtForm.notes.trim().slice(0, 300) || null,
      });
      toast.success(debtForm.id ? "Lançamento atualizado." : "Lançamento criado.");
      setDebtForm(null);
      refresh();
      if (close) onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(debt: PlayerDebt, status: PlayerDebt["status"]) {
    try {
      await setDebtStatus(debt.id, status);
      toast.success(status === "pago" ? "Lançamento pago." : "Lançamento cancelado.");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível atualizar.");
    }
  }

  async function remove(debt: PlayerDebt) {
    try {
      await deleteDebt(debt.id);
      toast.success("Lançamento removido.");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível remover.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{playerName}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="financeiro">
          <TabsList className="w-full">
            <TabsTrigger value="financeiro" className="flex-1">
              Financeiro
            </TabsTrigger>
            <TabsTrigger value="mensalidade" className="flex-1">
              Mensalidade
            </TabsTrigger>
          </TabsList>

          <TabsContent value="financeiro" className="space-y-3 pt-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md border border-border/60 bg-card p-3">
                <p className="text-xs text-muted-foreground">Total em aberto</p>
                <p className="font-display text-xl">{formatMoney(openTotal)}</p>
              </div>
              <div className="rounded-md border border-border/60 bg-card p-3">
                <p className="text-xs text-muted-foreground">Lançamentos</p>
                <p className="font-display text-xl">{list.length}</p>
              </div>
            </div>

            {debtForm ? (
              <div
                className="space-y-3 rounded-md border border-border/60 p-3"
                onKeyDown={onEnter(() => handleSaveDebt())}
              >
                <div className="space-y-1.5">
                  <Label htmlFor="debt-desc">Descrição</Label>
                  <Input
                    id="debt-desc"
                    className="h-11 text-base"
                    maxLength={120}
                    value={debtForm.description}
                    onChange={(e) => setDebtForm({ ...debtForm, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Tipo</Label>
                    <Select
                      value={debtForm.category}
                      onValueChange={(value) => setDebtForm({ ...debtForm, category: value })}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DEBT_CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="debt-amount">Valor (R$)</Label>
                    <Input
                      id="debt-amount"
                      inputMode="decimal"
                      className="h-11 text-base"
                      value={debtForm.amount}
                      onChange={(e) => setDebtForm({ ...debtForm, amount: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="debt-date">Vencimento</Label>
                    <Input
                      id="debt-date"
                      type="date"
                      className="h-11 text-base"
                      value={debtForm.due_date}
                      onChange={(e) => setDebtForm({ ...debtForm, due_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Situação</Label>
                    <Select
                      value={debtForm.status}
                      onValueChange={(value) =>
                        setDebtForm({ ...debtForm, status: value as PlayerDebt["status"] })
                      }
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DEBT_STATUS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="debt-notes">Observação</Label>
                  <Textarea
                    id="debt-notes"
                    rows={2}
                    maxLength={300}
                    value={debtForm.notes}
                    onChange={(e) => setDebtForm({ ...debtForm, notes: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => void handleSaveDebt()} disabled={saving} className="h-11">
                    Salvar lançamento
                  </Button>
                  <Button variant="ghost" className="h-11" onClick={() => setDebtForm(null)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" className="h-11 w-full" onClick={() => setDebtForm(emptyDebt())}>
                <Plus className="mr-1 size-4" /> Adicionar lançamento
              </Button>
            )}

            {list.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhum lançamento registrado.
              </p>
            ) : (
              <ul className="divide-y divide-border/60 overflow-hidden rounded-md border border-border/60">
                {list.map((debt) => (
                  <li key={debt.id} className="flex items-start gap-2 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {debt.description}
                        <span className="text-muted-foreground"> · {debt.category}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatMoney(debt.amount)} · vence {formatDate(debt.due_date)} ·{" "}
                        <span className={isOverdue(debt) ? "text-destructive" : undefined}>
                          {isOverdue(debt) ? "Vencido" : debtStatusLabel(debt.status)}
                        </span>
                      </p>
                      {debt.notes ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">{debt.notes}</p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center">
                      {debt.status !== "pago" ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Marcar como pago"
                          onClick={() => void changeStatus(debt, "pago")}
                        >
                          <Check className="size-4 text-primary" />
                        </Button>
                      ) : null}
                      {debt.status !== "cancelado" ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Cancelar lançamento"
                          onClick={() => void changeStatus(debt, "cancelado")}
                        >
                          <X className="size-4" />
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Editar lançamento"
                        onClick={() =>
                          setDebtForm({
                            id: debt.id,
                            description: debt.description,
                            category: debt.category,
                            amount: String(debt.amount),
                            due_date: debt.due_date,
                            status: debt.status,
                            notes: debt.notes ?? "",
                          })
                        }
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Remover lançamento"
                        onClick={() => void remove(debt)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent
            value="mensalidade"
            className="space-y-3 pt-3"
            onKeyDown={onEnter(() => handleSaveFee())}
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="fee-amount">Valor (R$)</Label>
                <Input
                  id="fee-amount"
                  inputMode="decimal"
                  className="h-11 text-base"
                  value={feeForm.amount}
                  onChange={(e) => setFeeForm({ ...feeForm, amount: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fee-day">Dia de vencimento</Label>
                <Input
                  id="fee-day"
                  inputMode="numeric"
                  className="h-11 text-base"
                  value={feeForm.due_day}
                  onChange={(e) =>
                    setFeeForm({ ...feeForm, due_day: e.target.value.replace(/\D/g, "").slice(0, 2) })
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Situação</Label>
              <Select
                value={feeForm.status}
                onValueChange={(value) =>
                  setFeeForm({ ...feeForm, status: value as PlayerFee["status"] })
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FEE_STATUS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
              <div>
                <p className="text-sm font-semibold">Mensalista ativo</p>
                <p className="text-xs text-muted-foreground">Conta no resumo de mensalistas.</p>
              </div>
              <Switch
                checked={feeForm.active}
                onCheckedChange={(checked) => setFeeForm({ ...feeForm, active: checked })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fee-notes">Observação</Label>
              <Textarea
                id="fee-notes"
                rows={2}
                maxLength={300}
                value={feeForm.notes}
                onChange={(e) => setFeeForm({ ...feeForm, notes: e.target.value })}
              />
            </div>
            <Button className="h-11 w-full" disabled={saving} onClick={() => void handleSaveFee()}>
              Salvar mensalidade
            </Button>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
