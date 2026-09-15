import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Share2, Shuffle, Trash2 } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { AdminGate } from "@/components/AdminGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { compareDisplayName, displayName, playersQueryOptions } from "@/lib/team-data";
import {
  currentPeladaQueryOptions,
  drawTeams,
  participantsQueryOptions,
  splitParticipants,
  PELADA_STATUS_OPTIONS,
  WEEKDAYS,
  type Pelada,
} from "@/lib/pelada-data";

export const Route = createFileRoute("/_authenticated/pelada")({
  head: () => ({
    meta: [
      { title: "Pelada da Semana — gestão do time" },
      {
        name: "description",
        content:
          "Configure a pelada da semana, acompanhe as confirmações dos atletas e sorteie os times.",
      },
      { property: "og:title", content: "Pelada da Semana — gestão do time" },
      {
        property: "og:description",
        content: "Configuração, confirmações e sorteio de times da pelada da semana.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AdminGate>
      <PeladaAdminPage />
    </AdminGate>
  ),
});

function PeladaAdminPage() {
  const queryClient = useQueryClient();
  const { data: pelada, isLoading } = useQuery(currentPeladaQueryOptions);
  const { data: players } = useQuery(playersQueryOptions);
  const { data: participants } = useQuery(participantsQueryOptions(pelada?.id));
  const [saving, setSaving] = useState(false);
  const [teamsCount, setTeamsCount] = useState(2);

  const roster = useMemo(
    () => (players ?? []).filter((p) => p.active).sort(compareDisplayName),
    [players],
  );
  const list = participants ?? [];
  const { confirmed, waiting } = splitParticipants(list, pelada?.max_players ?? null);

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["pelada"] });
    queryClient.invalidateQueries({ queryKey: ["pelada_participants"] });
  }

  async function createPelada() {
    setSaving(true);
    const { error } = await supabase.from("peladas").insert({ name: "Pelada da Semana" });
    setSaving(false);
    if (error) return toast.error(error.message);
    refresh();
  }

  async function update(patch: Partial<Pelada>) {
    if (!pelada) return;
    queryClient.setQueryData(currentPeladaQueryOptions.queryKey, { ...pelada, ...patch });
    const { error } = await supabase.from("peladas").update(patch).eq("id", pelada.id);
    if (error) toast.error(error.message);
  }

  async function setStatus(playerId: string, status: "confirmado" | "fora") {
    if (!pelada) return;
    const existing = list.find((p) => p.player_id === playerId);
    const { error } = existing
      ? await supabase.from("pelada_participants").update({ status }).eq("id", existing.id)
      : await supabase
          .from("pelada_participants")
          .insert({ pelada_id: pelada.id, player_id: playerId, status });
    if (error) return toast.error(error.message);
    refresh();
  }

  async function removeEntry(id: string) {
    const { error } = await supabase.from("pelada_participants").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  }

  async function sortear() {
    if (!pelada) return;
    const ids = confirmed.map((p) => p.id);
    if (ids.length < teamsCount) return toast.error("Confirmados insuficientes para o sorteio.");
    const byId = new Map(list.map((p) => [p.id, p]));
    const assignment = drawTeams(ids, teamsCount, (id) => {
      const playerId = byId.get(id)?.player_id;
      const player = roster.find((p) => p.id === playerId);
      return player?.position === "Goleiro";
    });
    await Promise.all(
      Object.entries(assignment).map(([id, team]) =>
        supabase.from("pelada_participants").update({ team_no: team }).eq("id", id),
      ),
    );
    refresh();
    toast.success("Times sorteados.");
  }

  function nameOf(participantId: string) {
    const entry = list.find((p) => p.id === participantId);
    if (!entry) return "";
    if (entry.guest_name) return entry.guest_name;
    const player = roster.find((p) => p.id === entry.player_id);
    return player ? displayName(player) : "Atleta";
  }

  const publicUrl =
    pelada && typeof window !== "undefined"
      ? `${window.location.origin}/pelada/${pelada.public_token}`
      : "";

  function shareTeams() {
    const teams = new Map<number, string[]>();
    for (const p of confirmed) {
      if (!p.team_no) continue;
      const arr = teams.get(p.team_no) ?? [];
      arr.push(nameOf(p.id));
      teams.set(p.team_no, arr);
    }
    if (teams.size === 0) return toast.error("Sorteie os times antes de compartilhar.");
    const text = [
      `*${pelada?.name ?? "Pelada"}*`,
      pelada?.next_date ? pelada.next_date.split("-").reverse().join("/") : "",
      ...[...teams.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([no, names]) => `\n*Time ${no}*\n${names.map((n) => `• ${n}`).join("\n")}`),
    ]
      .filter(Boolean)
      .join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="mx-auto max-w-3xl px-4 py-6 text-sm text-muted-foreground">
          Carregando…
        </main>
      </div>
    );
  }

  if (!pelada) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="mx-auto max-w-3xl px-4 py-6">
          <h1 className="font-display text-2xl">Pelada da Semana</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Crie a pelada para começar a receber confirmações dos atletas.
          </p>
          <Button className="mt-4 h-11" onClick={createPelada} disabled={saving}>
            Criar pelada
          </Button>
        </main>
      </div>
    );
  }

  const spots =
    pelada.max_players != null ? Math.max(pelada.max_players - confirmed.length, 0) : null;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-6 pb-16">
        <h1 className="font-display text-2xl">Pelada da Semana</h1>

        <section className="mt-4 grid gap-3 rounded-xl border border-border bg-card p-4">
          <div>
            <Label htmlFor="pelada-nome">Nome da pelada</Label>
            <Input
              id="pelada-nome"
              className="h-11"
              defaultValue={pelada.name}
              onBlur={(e) => update({ name: e.target.value.trim() || "Pelada da Semana" })}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>Dia da semana</Label>
              <Select
                value={pelada.weekday == null ? "" : String(pelada.weekday)}
                onValueChange={(v) => update({ weekday: Number(v) })}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  {WEEKDAYS.map((d) => (
                    <SelectItem key={d.value} value={String(d.value)}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="pelada-inicio">Início</Label>
              <Input
                id="pelada-inicio"
                type="time"
                className="h-11"
                defaultValue={pelada.start_time?.slice(0, 5) ?? ""}
                onBlur={(e) => update({ start_time: e.target.value || null })}
              />
            </div>
            <div>
              <Label htmlFor="pelada-fim">Fim</Label>
              <Input
                id="pelada-fim"
                type="time"
                className="h-11"
                defaultValue={pelada.end_time?.slice(0, 5) ?? ""}
                onBlur={(e) => update({ end_time: e.target.value || null })}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="pelada-local">Local</Label>
              <Input
                id="pelada-local"
                className="h-11"
                defaultValue={pelada.location ?? ""}
                onBlur={(e) => update({ location: e.target.value.trim() || null })}
              />
            </div>
            <div>
              <Label htmlFor="pelada-data">Data da próxima pelada</Label>
              <Input
                id="pelada-data"
                type="date"
                className="h-11"
                defaultValue={pelada.next_date ?? ""}
                onBlur={(e) => update({ next_date: e.target.value || null })}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor="pelada-limite">Limite de atletas</Label>
              <Input
                id="pelada-limite"
                type="number"
                inputMode="numeric"
                min={0}
                className="h-11"
                defaultValue={pelada.max_players ?? ""}
                onBlur={(e) =>
                  update({ max_players: e.target.value ? Number(e.target.value) : null })
                }
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={pelada.status}
                onValueChange={(v) => update({ status: v as Pelada["status"] })}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PELADA_STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="pelada-prazo">Prazo para confirmação</Label>
              <Input
                id="pelada-prazo"
                type="datetime-local"
                className="h-11"
                defaultValue={pelada.confirm_deadline?.slice(0, 16) ?? ""}
                onBlur={(e) =>
                  update({
                    confirm_deadline: e.target.value ? new Date(e.target.value).toISOString() : null,
                  })
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="pelada-obs">Observações</Label>
            <Textarea
              id="pelada-obs"
              defaultValue={pelada.notes ?? ""}
              onBlur={(e) => update({ notes: e.target.value.trim() || null })}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="h-11"
              onClick={() => {
                navigator.clipboard.writeText(publicUrl);
                toast.success("Link público copiado.");
              }}
            >
              <Copy className="mr-1 size-4" /> Copiar link público
            </Button>
            <Button
              variant="outline"
              className="h-11"
              onClick={() =>
                window.open(
                  `https://wa.me/?text=${encodeURIComponent(`${pelada.name}: confirme sua presença ${publicUrl}`)}`,
                  "_blank",
                )
              }
            >
              <Share2 className="mr-1 size-4" /> Enviar no WhatsApp
            </Button>
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg">Presenças</h2>
            <span className="text-xs text-muted-foreground">
              {confirmed.length} confirmados
              {spots != null ? ` · ${spots} vaga(s)` : ""}
              {waiting.length ? ` · ${waiting.length} na espera` : ""}
            </span>
          </div>

          <ul className="mt-3 divide-y divide-border/60 rounded-md border border-border/60">
            {roster.map((player) => {
              const entry = list.find((p) => p.player_id === player.id);
              const isWaiting = waiting.some((w) => w.id === entry?.id);
              return (
                <li key={player.id} className="flex items-center gap-2 px-3 py-2.5">
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {displayName(player)}
                    {isWaiting ? (
                      <span className="ml-2 text-xs text-muted-foreground">espera</span>
                    ) : null}
                    {entry?.team_no ? (
                      <span className="ml-2 rounded bg-primary/10 px-1.5 text-xs text-primary">
                        Time {entry.team_no}
                      </span>
                    ) : null}
                  </span>
                  <Button
                    size="sm"
                    variant={entry?.status === "confirmado" ? "default" : "outline"}
                    onClick={() => setStatus(player.id, "confirmado")}
                  >
                    Vou
                  </Button>
                  <Button
                    size="sm"
                    variant={entry?.status === "fora" ? "default" : "outline"}
                    onClick={() => setStatus(player.id, "fora")}
                  >
                    Não vou
                  </Button>
                  {entry ? (
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Limpar"
                      onClick={() => removeEntry(entry.id)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mt-6 rounded-xl border border-border bg-card p-4">
          <h2 className="font-display text-lg">Times</h2>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <div>
              <Label htmlFor="pelada-times">Quantidade de times</Label>
              <Input
                id="pelada-times"
                type="number"
                min={2}
                max={6}
                className="h-11 w-28"
                value={teamsCount}
                onChange={(e) => setTeamsCount(Math.max(2, Number(e.target.value) || 2))}
              />
            </div>
            <Button className="h-11" onClick={sortear}>
              <Shuffle className="mr-1 size-4" /> Sortear
            </Button>
            <Button variant="outline" className="h-11" onClick={shareTeams}>
              <Share2 className="mr-1 size-4" /> Compartilhar times
            </Button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {Array.from({ length: teamsCount }, (_, i) => i + 1).map((no) => (
              <div key={no} className="rounded-md border border-border/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Time {no}
                </p>
                <ul className="mt-2 grid gap-1 text-sm">
                  {confirmed
                    .filter((p) => p.team_no === no)
                    .map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-2">
                        <span className="truncate">{nameOf(p.id)}</span>
                        <Select
                          value={String(no)}
                          onValueChange={async (v) => {
                            await supabase
                              .from("pelada_participants")
                              .update({ team_no: Number(v) })
                              .eq("id", p.id);
                            refresh();
                          }}
                        >
                          <SelectTrigger className="h-8 w-20 shrink-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: teamsCount }, (_, i) => i + 1).map((t) => (
                              <SelectItem key={t} value={String(t)}>
                                Time {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
