import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Minus, Plus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  displayName,
  matchStatsQueryOptions,
  playersQueryOptions,
  type Match,
} from "@/lib/team-data";

type Row = { played: boolean; goals: number; assists: number; goals_conceded: number };

const EMPTY_ROW: Row = { played: false, goals: 0, assists: 0, goals_conceded: 0 };

const isKeeper = (position: string | null) => position === "Goleiro";

const headerSchema = z.object({
  match_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data do jogo"),
  opponent: z.string().trim().max(60).optional(),
});

function Stepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-10"
        onClick={() => onChange(Math.max(0, value - 1))}
        aria-label={`Diminuir ${label}`}
      >
        <Minus className="size-4" />
      </Button>
      <span className="w-7 text-center font-display text-2xl tabular">{value}</span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-10"
        onClick={() => onChange(Math.min(30, value + 1))}
        aria-label={`Aumentar ${label}`}
      >
        <Plus className="size-4" />
      </Button>
    </div>

  );
}

export function MatchForm({ match }: { match?: Match }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: players, isLoading } = useQuery(playersQueryOptions);
  const { data: existing } = useQuery({
    ...matchStatsQueryOptions(match?.id ?? ""),
    enabled: !!match?.id,
  });

  const [date, setDate] = useState(match?.match_date ?? new Date().toISOString().slice(0, 10));
  const [opponent, setOpponent] = useState(match?.opponent ?? "");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<Record<string, Row>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!players) return;
    setRows((current) => {
      const next: Record<string, Row> = {};
      for (const player of players) {
        const saved = existing?.find((s) => s.player_id === player.id);
        next[player.id] =
          current[player.id] ??
          (saved
            ? {
                played: saved.played,
                goals: saved.goals,
                assists: saved.assists,
                goals_conceded: saved.goals_conceded ?? 0,
              }
            : EMPTY_ROW);
      }
      return next;
    });
  }, [players, existing]);

  const visible = useMemo(() => {
    const list = (players ?? []).filter((p) => p.active || rows[p.id]?.played);
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(term) || (p.nickname ?? "").toLowerCase().includes(term),
    );
  }, [players, search, rows]);

  const totals = useMemo(() => {
    return Object.values(rows).reduce(
      (acc, row) => ({
        goals: acc.goals + row.goals,
        assists: acc.assists + row.assists,
        played: acc.played + (row.played ? 1 : 0),
      }),
      { goals: 0, assists: 0, played: 0 },
    );
  }, [rows]);

  function update(playerId: string, patch: Partial<Row>) {
    setRows((current) => {
      const row = current[playerId] ?? EMPTY_ROW;
      const next = { ...row, ...patch };
      if (
        (next.goals > 0 || next.assists > 0 || next.goals_conceded > 0) &&
        !("played" in patch)
      )
        next.played = true;
      return { ...current, [playerId]: next };
    });
  }

  async function save() {
    const parsed = headerSchema.safeParse({
      match_date: date,
      opponent: opponent.trim() || undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setSaving(true);
    try {
      let matchId = match?.id;
      const payload = {
        match_date: parsed.data.match_date,
        opponent: parsed.data.opponent ?? null,
      };

      if (matchId) {
        const { error } = await supabase.from("matches").update(payload).eq("id", matchId);
        if (error) throw error;
        const { error: delError } = await supabase
          .from("match_stats")
          .delete()
          .eq("match_id", matchId);
        if (delError) throw delError;
      } else {
        const { data, error } = await supabase
          .from("matches")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        matchId = data.id;
      }

      const inserts = Object.entries(rows)
        .filter(([, row]) => row.played || row.goals > 0 || row.assists > 0 || row.goals_conceded > 0)
        .map(([player_id, row]) => ({
          match_id: matchId!,
          player_id,
          goals: row.goals,
          assists: row.assists,
          goals_conceded: row.goals_conceded,
          played: true,
        }));

      if (inserts.length > 0) {
        const { error } = await supabase.from("match_stats").insert(inserts);
        if (error) throw error;
      }

      queryClient.invalidateQueries();
      toast.success("Jogo salvo. Tabela atualizada!");
      navigate({ to: "/jogos" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o jogo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="date">Data</Label>
          <Input
            id="date"
            type="date"
            className="h-11 text-base"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="opponent">Adversário</Label>
          <Input
            id="opponent"
            value={opponent}
            maxLength={60}
            className="h-11 text-base"
            placeholder="Opcional"
            onChange={(e) => setOpponent(e.target.value)}
          />
        </div>
      </div>


      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Presentes", value: totals.played },
          { label: "Gols", value: totals.goals },
          { label: "Assistências", value: totals.assists },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-border/60 bg-card px-3 py-2 text-center"
          >
            <p className="font-display text-2xl leading-none tabular">{item.value}</p>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {item.label}
            </p>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar jogador"
          className="h-11 pl-9 text-base"
          aria-label="Buscar jogador"
        />
      </div>


      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Carregando elenco…</p>
      ) : visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nenhum jogador no elenco. Cadastre em Elenco primeiro.
        </p>
      ) : (
        <ul className="divide-y divide-border/60 overflow-hidden rounded-lg border border-border/60 bg-card">
          {visible.map((player) => {
            const row = rows[player.id] ?? EMPTY_ROW;
            return (
              <li key={player.id} className="px-3 py-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={`played-${player.id}`}
                    className="size-5 shrink-0"
                    checked={row.played}
                    onCheckedChange={(checked) =>
                      update(player.id, { played: checked === true })
                    }
                  />
                  <Label
                    htmlFor={`played-${player.id}`}
                    className="min-w-0 flex-1 cursor-pointer truncate text-base font-semibold"
                  >
                    {displayName(player)}
                    {player.shirt_number != null ? (
                      <span className="text-muted-foreground"> #{player.shirt_number}</span>
                    ) : null}
                  </Label>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 pl-8">
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Gols
                    </span>
                    <Stepper
                      label={`gols de ${player.name}`}
                      value={row.goals}
                      onChange={(goals) => update(player.id, { goals })}
                    />
                  </div>
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Assist.
                    </span>
                    <Stepper
                      label={`assistências de ${player.name}`}
                      value={row.assists}
                      onChange={(assists) => update(player.id, { assists })}
                    />
                  </div>
                  {isKeeper(player.position) ? (
                    <div className="col-span-2 flex min-w-0 flex-col gap-1">
                      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Gols sofridos
                      </span>
                      <Stepper
                        label={`gols sofridos por ${player.name}`}
                        value={row.goals_conceded}
                        onChange={(goals_conceded) => update(player.id, { goals_conceded })}
                      />
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="sticky bottom-0 -mx-4 border-t border-border/70 bg-background/90 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <Button className="h-12 w-full text-base" size="lg" onClick={save} disabled={saving}>
          {saving ? "Salvando…" : match ? "Salvar alterações" : "Salvar jogo"}
        </Button>

      </div>
    </div>
  );
}
