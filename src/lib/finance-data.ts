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

/* ---------- competência (mês/ano) ---------- */

export function currentCompetence() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function competenceLabel(comp: string) {
  const [year, month] = comp.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  const label = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Lista de competências (mês/ano) para o seletor: 12 meses atrás até 3 à frente. */
export function competenceOptions() {
  const now = new Date();
  const list: string[] = [];
  for (let offset = 3; offset >= -12; offset--) {
    const date = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    list.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  }
  return list;
}

export function inCompetence(debt: PlayerDebt, comp: string) {
  return debt.due_date.slice(0, 7) === comp;
}

export function competenceDueDate(comp: string, dueDay: number) {
  const [year, month] = comp.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  const day = Math.min(Math.max(dueDay, 1), lastDay);
  return `${comp}-${String(day).padStart(2, "0")}`;
}

export function summarize(
  debts: PlayerDebt[],
  fees: PlayerFee[],
  comp: string = currentCompetence(),
) {
  const scoped = debts.filter((d) => inCompetence(d, comp));
  const pending = scoped.filter((d) => d.status === "pendente");
  const paid = scoped.filter((d) => d.status === "pago");
  const overduePlayers = new Set(scoped.filter(isOverdue).map((d) => d.player_id));
  return {
    toReceive: pending.reduce((sum, d) => sum + d.amount, 0),
    received: paid.reduce((sum, d) => sum + d.amount, 0),
    overdueCount: overduePlayers.size,
    activeFees: fees.filter((f) => f.active).length,
  };
}

/* ---------- configuração financeira do time ---------- */

export type FinanceSettings = { amount: number; dueDay: number };

export const financeSettingsQueryOptions = {
  queryKey: ["team_settings", "finance"],
  queryFn: async (): Promise<FinanceSettings> => {
    const { data, error } = await supabase
      .from("team_settings")
      .select("key, value")
      .in("key", ["finance_default_amount", "finance_default_due_day"]);
    if (error) throw new Error(error.message);
    const map = new Map((data ?? []).map((row) => [row.key, row.value]));
    return {
      amount: Number(map.get("finance_default_amount") ?? 0) || 0,
      dueDay: Number(map.get("finance_default_due_day") ?? 10) || 10,
    };
  },
};

export async function saveFinanceSettings(settings: FinanceSettings) {
  const { error } = await supabase.from("team_settings").upsert(
    [
      { key: "finance_default_amount", value: String(settings.amount) },
      { key: "finance_default_due_day", value: String(settings.dueDay) },
    ],
    { onConflict: "key" },
  );
  if (error) throw new Error(error.message);
}

/** Cria a configuração financeira padrão de um atleta (sem sobrescrever a existente). */
export async function ensurePlayerFee(playerId: string, settings: FinanceSettings) {
  const { data, error } = await supabase
    .from("player_fees")
    .select("id")
    .eq("player_id", playerId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (data) return;
  await saveFee({
    player_id: playerId,
    amount: settings.amount,
    due_day: settings.dueDay,
    status: "em_dia",
    active: true,
    notes: null,
  });
}

/** Aplica valor e dia padrão a todos os atletas ativos (não altera lançamentos). */
export async function syncFees(
  activePlayerIds: string[],
  settings: FinanceSettings,
  fees: PlayerFee[],
) {
  if (activePlayerIds.length === 0) return 0;
  const rows = activePlayerIds.map((player_id) => {
    const current = fees.find((f) => f.player_id === player_id);
    return {
      player_id,
      amount: settings.amount,
      due_day: settings.dueDay,
      status: current?.status ?? "em_dia",
      active: true,
      notes: current?.notes ?? null,
    };
  });
  const { error } = await supabase
    .from("player_fees")
    .upsert(rows, { onConflict: "player_id" });
  if (error) throw new Error(error.message);
  return rows.length;
}

/** Gera a mensalidade da competência para atletas ativos, sem duplicar lançamentos. */
export async function generateMonthlyDebts(
  comp: string,
  activePlayerIds: string[],
  fees: PlayerFee[],
  debts: PlayerDebt[],
  settings: FinanceSettings,
) {
  const rows = activePlayerIds
    .filter((player_id) => {
      const fee = fees.find((f) => f.player_id === player_id);
      if (fee && !fee.active) return false;
      const exists = debts.some(
        (d) =>
          d.player_id === player_id &&
          d.category === "Mensalidade" &&
          inCompetence(d, comp),
      );
      return !exists;
    })
    .map((player_id) => {
      const fee = fees.find((f) => f.player_id === player_id);
      const amount = fee?.amount ?? settings.amount;
      const dueDay = fee?.due_day ?? settings.dueDay;
      return {
        player_id,
        description: "Mensalidade",
        category: "Mensalidade",
        amount,
        due_date: competenceDueDate(comp, dueDay),
        status: "pendente" as const,
        notes: null,
      };
    })
    .filter((row) => row.amount > 0);
  if (rows.length === 0) return 0;
  const { error } = await supabase.from("player_debts").insert(rows);
  if (error) throw new Error(error.message);
  return rows.length;
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

/* ---------- lançamentos coletivos ---------- */

export const BULK_TYPES = [
  "Jogo",
  "Arbitragem",
  "Campeonato",
  "Uniforme",
  "Churrasco",
  "Outro",
] as const;

export type BulkEntry = { player_id: string; amount: number };

export type BulkDebtInput = {
  category: string;
  description: string;
  due_date: string;
  reference_date?: string;
  notes?: string | null;
  entries: BulkEntry[];
};

/** Divide um valor total entre N atletas, ajustando os centavos na primeira parcela. */
export function splitEvenly(total: number, count: number): number[] {
  if (count <= 0) return [];
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / count);
  const rest = cents - base * count;
  return Array.from({ length: count }, (_, i) => (base + (i < rest ? 1 : 0)) / 100);
}

/**
 * Cria um lançamento individual (pendente) para cada atleta informado.
 * Reutilizável por outros módulos (ex.: Jogos) para gerar cobranças coletivas.
 */
export async function createBulkDebts(input: BulkDebtInput) {
  const rows = input.entries
    .filter((entry) => entry.amount > 0)
    .map((entry) => ({
      player_id: entry.player_id,
      description: input.description,
      category: input.category,
      amount: entry.amount,
      due_date: input.due_date,
      status: "pendente" as const,
      notes: [input.reference_date ? `Data: ${input.reference_date}` : null, input.notes]
        .filter(Boolean)
        .join(" · ") || null,
    }));
  if (rows.length === 0) return 0;
  const { error } = await supabase.from("player_debts").insert(rows);
  if (error) throw new Error(error.message);
  return rows.length;
}
