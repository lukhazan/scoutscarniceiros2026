import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarDays, Clock, MapPin, Users } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { compareDisplayName, displayName, formatDate, playersQueryOptions, positionsForModality } from "@/lib/team-data";
import { AmistosoLineup } from "@/components/AmistosoLineup";
import {
  participantsQueryOptions,
  peladaByTokenQueryOptions,
  splitParticipants,
  weekdayLabel,
} from "@/lib/pelada-data";

export const Route = createFileRoute("/pelada/$token")({
  head: () => ({
    meta: [
      { title: "Pelada da semana — confirme sua presença" },
      {
        name: "description",
        content: "Veja data, horário e local da pelada, confira os confirmados e diga se vai.",
      },
      { property: "og:title", content: "Pelada da semana — confirme sua presença" },
      {
        property: "og:description",
        content: "Data, horário, local, lista de confirmados e vagas restantes da pelada.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PeladaPublicPage,
});

function PeladaPublicPage() {
  const { token } = Route.useParams();
  const queryClient = useQueryClient();
  const { data: pelada, isLoading } = useQuery(peladaByTokenQueryOptions(token));
  const { data: players } = useQuery(playersQueryOptions);
  const { data: participants } = useQuery(participantsQueryOptions(pelada?.id));
  const [selected, setSelected] = useState("");

  const roster = useMemo(
    () => (players ?? []).filter((p) => p.active).sort(compareDisplayName),
    [players],
  );
  const list = participants ?? [];
  const { confirmed, waiting } = splitParticipants(list, pelada?.max_players ?? null);

  function nameOfPlayer(playerId: string | null) {
    const player = roster.find((p) => p.id === playerId);
    return player ? displayName(player) : "Atleta";
  }

  async function answer(status: "confirmado" | "fora") {
    if (!pelada || !selected) return toast.error("Escolha seu nome na lista.");
    const existing = list.find((p) => p.player_id === selected);
    const { error } = existing
      ? await supabase
          .from("pelada_participants")
          .update(
            status === "confirmado" && existing.status !== "confirmado"
              ? { status, confirmed_at: new Date().toISOString() }
              : { status },
          )
          .eq("id", existing.id)
      : await supabase
          .from("pelada_participants")
          .insert({ pelada_id: pelada.id, player_id: selected, status });
    if (error) return toast.error("Não foi possível registrar. Tente novamente.");
    queryClient.invalidateQueries({ queryKey: ["pelada_participants"] });
    toast.success(status === "confirmado" ? "Presença confirmada!" : "Ausência registrada.");
  }

  async function clearAnswer() {
    const existing = list.find((p) => p.player_id === selected);
    if (!existing) return;
    const { error } = await supabase.from("pelada_participants").delete().eq("id", existing.id);
    if (error) return toast.error("Não foi possível remover.");
    queryClient.invalidateQueries({ queryKey: ["pelada_participants"] });
    toast.success("Confirmação removida.");
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="mx-auto max-w-2xl px-4 py-6 text-sm text-muted-foreground">
          Carregando…
        </main>
      </div>
    );
  }

  if (!pelada) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="mx-auto max-w-2xl px-4 py-6">
          <h1 className="font-display text-2xl">Pelada não encontrada</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Confira o link com o responsável pelo time.
          </p>
        </main>
      </div>
    );
  }

  const spots =
    pelada.max_players != null ? Math.max(pelada.max_players - confirmed.length, 0) : null;
  const open = pelada.status === "aberta";

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-6 pb-16">
        <h1 className="font-display text-2xl">{pelada.name}</h1>
        {pelada.opponent ? (
          <p className="mt-1 text-sm text-muted-foreground">Adversário: {pelada.opponent}</p>
        ) : null}
        {!open ? (
          <p className="mt-2 rounded-md bg-muted px-3 py-2 text-sm">
            {pelada.status === "cancelada"
              ? "Esta pelada foi cancelada."
              : "As confirmações estão encerradas."}
          </p>
        ) : null}

        <section className="mt-4 grid gap-1 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <CalendarDays className="size-4 shrink-0" />
            {pelada.next_date ? formatDate(pelada.next_date) : weekdayLabel(pelada.weekday) || "—"}
          </span>
          {pelada.start_time ? (
            <span className="flex items-center gap-2">
              <Clock className="size-4 shrink-0" />
              {pelada.start_time.slice(0, 5)}
              {pelada.end_time ? ` — ${pelada.end_time.slice(0, 5)}` : ""}
            </span>
          ) : null}
          {pelada.location ? (
            <span className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0" />
              {pelada.location}
            </span>
          ) : null}
          <span className="flex items-center gap-2">
            <Users className="size-4 shrink-0" />
            {confirmed.length} confirmados
            {spots != null ? ` · ${spots} vaga(s) restantes` : ""}
          </span>
          {pelada.notes ? <p className="mt-1 text-xs">{pelada.notes}</p> : null}
        </section>

        {open ? (
          <section className="mt-4 rounded-xl border border-border bg-card p-4">
            <Label>Seu nome</Label>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger className="mt-1 h-11">
                <SelectValue placeholder="Escolha seu nome" />
              </SelectTrigger>
              <SelectContent>
                {roster.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {displayName(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button className="h-11 flex-1" onClick={() => answer("confirmado")}>
                Vou
              </Button>
              <Button
                variant="outline"
                className="h-11 flex-1"
                onClick={() => answer("fora")}
              >
                Não vou
              </Button>
              <Button variant="ghost" className="h-11" onClick={clearAnswer}>
                Remover
              </Button>
            </div>
          </section>
        ) : null}

        {pelada.kind === "amistoso" ? (
          <section className="mt-6 rounded-xl border border-border bg-card p-4">
            <h2 className="font-display text-lg">Escalação</h2>
            <AmistosoLineup
              list={list}
              slots={pelada.position_slots ?? {}}
              positions={positionsForModality(null)}
              positionOf={(id) => roster.find((p) => p.id === id)?.position ?? ""}
              nameOf={(p) => p.guest_name ?? nameOfPlayer(p.player_id)}
            />
          </section>
        ) : (
        <section className="mt-6 rounded-xl border border-border bg-card p-4">
          <h2 className="font-display text-lg">Confirmados</h2>
          <ol className="mt-2 grid gap-1 text-sm">
            {confirmed.map((p, i) => (
              <li key={p.id}>
                {i + 1}. {p.guest_name ?? nameOfPlayer(p.player_id)}
              </li>
            ))}
            {confirmed.length === 0 ? (
              <li className="text-muted-foreground">Ninguém confirmou ainda.</li>
            ) : null}
          </ol>

          {waiting.length ? (
            <>
              <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Lista de espera
              </h3>
              <ol className="mt-2 grid gap-1 text-sm">
                {waiting.map((p, i) => (
                  <li key={p.id}>
                    {i + 1}. {p.guest_name ?? nameOfPlayer(p.player_id)}
                  </li>
                ))}
              </ol>
            </>
          ) : null}
        </section>
        )}
      </main>
    </div>
  );
}
