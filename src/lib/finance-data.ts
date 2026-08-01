import { supabase } from "@/integrations/supabase/client";

export type PlayerFee = {
  id: string;
  player_id: string;
  amount: number;
  due_day: number;
  status: "em_dia" | "pendente" | "atrasado";
  active: boolean;
  notes: string | null;
};

export type PlayerDebt = {
  id: string;
  player_id: string;
  description: string;
  category: string;
  amount: number;
  due_date: string;
  status: "pendente" | "pago" | "cancelado";
  paid_at: string | null;
  notes: string | null;
};

export const DEBT_CATEGORIES = [
  "Mensalidade",
  "Uniforme",
  "Churrasco",
  "Multa",
  "Arbitragem",
  "Outro",
] as const;

export const FEE_STATUS: { value: PlayerFee["status"]; label: string }[] = [
  { value: "em_dia", label: "Em dia" },
  { value: "pendente", label: "Pendente" },
  { value: "atrasado", label: "Atrasado" },
];

export const DEBT_STATUS: { value: PlayerDebt["status"]; label: string }[] = [
  { value: "pendente", label: "Pendente" },
  { value: "pago", label: "Pago" },
  { value: "cancelado", label: "Cancelado" },
];

export function feeStatusLabel(status: PlayerFee["status"]) {
  return FEE_STATUS.find((s) => s.value === status)?.label ?? status;
}

export function debtStatusLabel(status: PlayerDebt["status"]) {
  return DEBT_STATUS.find((s) => s.value === status)?.label ?? status;
}

export function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function isOverdue(debt: PlayerDebt) {
  return debt.status === "pendente" && debt.due_date < todayISO();
}

export function daysLate(debt: PlayerDebt) {
  if (!isOverdue(debt)) return 0;
  const diff = Date.parse(`${todayISO()}T00:00:00`) - Date.parse(`${debt.due_date}T00:00:00`);
  return Math.max(0, Math.round(diff / 86_400_000));
}

export const feesQueryOptions = {
  queryKey: ["player_fees"],
  queryFn: async (): Promise<PlayerFee[]> => {
    const { data, error } = await supabase
      .from("player_fees")
      .select("id, player_id, amount, due_day, status, active, notes");
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => ({ ...row, amount: Number(row.amount) })) as PlayerFee[];
  },
};

export const debtsQueryOptions = {
  queryKey: ["player_debts"],
  queryFn: async (): Promise<PlayerDebt[]> => {
    const { data, error } = await supabase
      .from("player_debts")
      .select("id, player_id, description, category, amount, due_date, status, paid_at, notes")
      .order("due_date", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => ({ ...row, amount: Number(row.amount) })) as PlayerDebt[];
  },
};

export async function saveFee(fee: {
  player_id: string;
  amount: number;
  due_day: number;
  status: PlayerFee["status"];
  active: boolean;
  notes: string | null;
}) {
  const { error } = await supabase
    .from("player_fees")
    .upsert(fee, { onConflict: "player_id" });
  if (error) throw new Error(error.message);
}

export async function saveDebt(debt: {
  id?: string;
  player_id: string;
  description: string;
  category: string;
  amount: number;
  due_date: string;
  status: PlayerDebt["status"];
  notes: string | null;
}) {
  const payload = {
    ...debt,
    paid_at: debt.status === "pago" ? todayISO() : null,
  };
  const { error } = debt.id
    ? await supabase.from("player_debts").update(payload).eq("id", debt.id)
    : await supabase.from("player_debts").insert(payload);
  if (error) throw new Error(error.message);
}

export async function setDebtStatus(id: string, status: PlayerDebt["status"]) {
  const { error } = await supabase
    .from("player_debts")
    .update({ status, paid_at: status === "pago" ? todayISO() : null })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteDebt(id: string) {
  const { error } = await supabase.from("player_debts").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export function summarize(debts: PlayerDebt[], fees: PlayerFee[]) {
  const pending = debts.filter((d) => d.status === "pendente");
  const paid = debts.filter((d) => d.status === "pago");
  const overduePlayers = new Set(debts.filter(isOverdue).map((d) => d.player_id));
  return {
    toReceive: pending.reduce((sum, d) => sum + d.amount, 0),
    received: paid.reduce((sum, d) => sum + d.amount, 0),
    overdueCount: overduePlayers.size,
    activeFees: fees.filter((f) => f.active).length,
  };
}

export type OverdueSummary = {
  player_id: string;
  total: number;
  count: number;
  maxDaysLate: number;
};

export function overdueByPlayer(debts: PlayerDebt[]): OverdueSummary[] {
  const map = new Map<string, OverdueSummary>();
  for (const debt of debts.filter(isOverdue)) {
    const current = map.get(debt.player_id) ?? {
      player_id: debt.player_id,
      total: 0,
      count: 0,
      maxDaysLate: 0,
    };
    current.total += debt.amount;
    current.count += 1;
    current.maxDaysLate = Math.max(current.maxDaysLate, daysLate(debt));
    map.set(debt.player_id, current);
  }
  return [...map.values()].sort((a, b) => b.maxDaysLate - a.maxDaysLate);
}
