import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { compareDisplayName, displayName, playersQueryOptions } from "@/lib/team-data";
import {
  BULK_TYPES,
  createBulkDebts,
  formatMoney,
  splitEvenly,
  todayISO,
} from "@/lib/finance-data";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pré-seleção de atletas (ex.: futura integração com o módulo Jogos). */
  defaultPlayerIds?: string[];
};

export function BulkDebtDialog({ open, onOpenChange, defaultPlayerIds }: Props) {
  const queryClient = useQueryClient();
  const { data: players } = useQuery(playersQueryOptions);
  const [type, setType] = useState<string>(BULK_TYPES[0]);
  const [description, setDescription] = useState("");
  const [total, setTotal] = useState("");
  const [refDate, setRefDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState(todayISO());
  const [notes, setNotes] = useState("");
  const [mode, setMode] = useState<"igual" | "individual">("igual");
  const [selected, setSelected] = useState<string[]>(defaultPlayerIds ?? []);
  const [custom, setCustom] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const roster = useMemo(
    () =>
      [...(players ?? [])]
        .filter((p) => p.active)
        .sort((a, b) => compareDisplayName(a, b)),
    [players],
  );

  const totalValue = Number(total.replace(",", ".")) || 0;
  const shares = splitEvenly(totalValue, selected.length);
  const perPlayer = shares[shares.length - 1] ?? 0;

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function reset() {
    setType(BULK_TYPES[0]);
    setDescription("");
    setTotal("");
    setRefDate(todayISO());
    setDueDate(todayISO());
    setNotes("");
    setMode("igual");
    setSelected([]);
    setCustom({});
  }

  async function handleSubmit() {
    if (selected.length === 0) {
      toast.error("Selecione ao menos um atleta.");
      return;
    }
    const entries =
      mode === "igual"
        ? selected.map((id, index) => ({ player_id: id, amount: shares[index] ?? 0 }))
        : selected.map((id) => ({
            player_id: id,
            amount: Number((custom[id] ?? "").replace(",", ".")) || 0,
          }));
    if (entries.every((e) => e.amount <= 0)) {
      toast.error("Informe valores maiores que zero.");
      return;
    }
    setBusy(true);
    try {
      const count = await createBulkDebts({
        category: type,
        description: description.trim() || type,
        due_date: dueDate,
        reference_date: refDate,
        notes: notes.trim() || null,
        entries,
      });
      toast.success(`${count} lançamento(s) criado(s).`);
      queryClient.invalidateQueries({ queryKey: ["player_debts"] });
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível criar os lançamentos.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo lançamento coletivo</DialogTitle>
          <DialogDescription>
            Registre uma despesa ocasional para vários atletas de uma vez.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BULK_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bulk-total">Valor total (R$)</Label>
              <Input
                id="bulk-total"
                inputMode="decimal"
                className="h-11 text-base"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bulk-desc">Descrição</Label>
            <Input
              id="bulk-desc"
              className="h-11 text-base"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={type}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bulk-date">Data</Label>
              <Input
                id="bulk-date"
                type="date"
                className="h-11 text-base"
                value={refDate}
                onChange={(e) => setRefDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bulk-due">Vencimento</Label>
              <Input
                id="bulk-due"
                type="date"
                className="h-11 text-base"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bulk-notes">Observação (opcional)</Label>
            <Textarea
              id="bulk-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Forma de divisão</Label>
            <RadioGroup
              value={mode}
              onValueChange={(v) => setMode(v as "igual" | "individual")}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="igual" id="mode-igual" />
                <Label htmlFor="mode-igual" className="font-normal">
                  Dividir igualmente
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="individual" id="mode-individual" />
                <Label htmlFor="mode-individual" className="font-normal">
                  Valor individual
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="rounded-lg border border-border/60 bg-card p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">
                {selected.length} atleta(s) selecionado(s)
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setSelected(roster.map((p) => p.id))}
                >
                  Selecionar todos
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setSelected([])}>
                  Limpar
                </Button>
              </div>
            </div>

            {mode === "igual" && selected.length > 0 && totalValue > 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {formatMoney(totalValue)} ÷ {selected.length} ={" "}
                <span className="font-semibold text-foreground">{formatMoney(perPlayer)}</span> para
                cada atleta.
              </p>
            ) : null}

            <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto">
              {roster.map((player) => {
                const checked = selected.includes(player.id);
                return (
                  <li key={player.id} className="flex items-center gap-3">
                    <Checkbox
                      id={`bulk-${player.id}`}
                      checked={checked}
                      onCheckedChange={() => toggle(player.id)}
                    />
                    <Label
                      htmlFor={`bulk-${player.id}`}
                      className="min-w-0 flex-1 truncate font-normal"
                    >
                      {displayName(player)}
                    </Label>
                    {mode === "individual" && checked ? (
                      <Input
                        inputMode="decimal"
                        className="h-9 w-24 text-base"
                        placeholder="0,00"
                        value={custom[player.id] ?? ""}
                        onChange={(e) =>
                          setCustom({ ...custom, [player.id]: e.target.value })
                        }
                      />
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>

          <Button type="submit" className="h-11 w-full" disabled={busy}>
            Criar lançamentos
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
