import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ImagePlus, Pencil, Plus, Trash2, UserRound, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { AdminGate } from "@/components/AdminGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { POSITIONS, playersQueryOptions, displayName, type Player } from "@/lib/team-data";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { fileToAvatarDataUrl } from "@/lib/player-photo";

export const Route = createFileRoute("/_authenticated/elenco")({
  head: () => ({
    meta: [
      { title: "Elenco — Súmula do time" },
      { name: "description", content: "Cadastro de jogadores do time amador." },
      { property: "og:title", content: "Elenco — Súmula do time" },
      { property: "og:description", content: "Cadastro de jogadores do time amador." },
    ],
  }),
  component: ElencoPage,
});

const playerSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do jogador").max(80),
  nickname: z.string().trim().max(40).optional(),
  position: z.string().trim().max(30).optional(),
  shirt_number: z.number().int().min(0).max(99).nullable(),
  active: z.boolean(),
  initial_goals: z.number().int().min(0, "Gols anteriores não podem ser negativos").max(9999),
  initial_assists: z
    .number()
    .int()
    .min(0, "Assistências anteriores não podem ser negativas")
    .max(9999),
  photo_url: z.string().nullable(),
});

const empty = {
  name: "",
  nickname: "",
  position: "",
  shirt: "",
  active: true,
  initialGoals: "0",
  initialAssists: "0",
  photo: null as string | null,
};

function ElencoPage() {
  const queryClient = useQueryClient();
  const { data: players, isLoading } = useQuery(playersQueryOptions);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Player | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Player | null>(null);

  const sorted = useMemo(
    () =>
      [...(players ?? [])].sort(
        (a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name),
      ),
    [players],
  );

  function openNew() {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  }

  function openEdit(player: Player) {
    setEditing(player);
    setForm({
      name: player.name,
      nickname: player.nickname ?? "",
      position: player.position ?? "",
      shirt: player.shirt_number == null ? "" : String(player.shirt_number),
      active: player.active,
      initialGoals: String(player.initial_goals ?? 0),
      initialAssists: String(player.initial_assists ?? 0),
      photo: player.photo_url ?? null,
    });
    setOpen(true);
  }

  async function save() {
    const parsed = playerSchema.safeParse({
      name: form.name,
      nickname: form.nickname || undefined,
      position: form.position || undefined,
      shirt_number: form.shirt === "" ? null : Number(form.shirt),
      active: form.active,
      initial_goals: form.initialGoals === "" ? 0 : Number(form.initialGoals),
      initial_assists: form.initialAssists === "" ? 0 : Number(form.initialAssists),
      photo_url: form.photo,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSaving(true);
    const payload = {
      name: parsed.data.name,
      nickname: parsed.data.nickname ?? null,
      position: parsed.data.position ?? null,
      shirt_number: parsed.data.shirt_number,
      active: parsed.data.active,
      initial_goals: parsed.data.initial_goals,
      initial_assists: parsed.data.initial_assists,
      photo_url: parsed.data.photo_url,
    };
    const { error } = editing
      ? await supabase.from("players").update(payload).eq("id", editing.id)
      : await supabase.from("players").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "Jogador atualizado." : "Jogador cadastrado.");
    setOpen(false);
    queryClient.invalidateQueries();
  }

  async function confirmDelete() {
    if (!toDelete) return;
    const { error } = await supabase.from("players").delete().eq("id", toDelete.id);
    setToDelete(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Jogador removido.");
    queryClient.invalidateQueries();
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 pb-[calc(4rem+env(safe-area-inset-bottom))] pt-6">
        <AdminGate>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
            <div className="min-w-0">
              <h1 className="font-display text-3xl leading-none sm:text-4xl">Elenco</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {sorted.length} jogador{sorted.length === 1 ? "" : "es"} cadastrado
                {sorted.length === 1 ? "" : "s"}
              </p>
            </div>
            <Button onClick={openNew} className="h-11 shrink-0">
              <Plus className="mr-1 size-4" /> Novo
            </Button>
          </div>


          {isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Carregando…</p>
          ) : sorted.length === 0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-border/70 p-8 text-center">
              <UserRound className="mx-auto size-6 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Cadastre os jogadores para começar a lançar os jogos.
              </p>
            </div>
          ) : (
            <ul className="mt-5 divide-y divide-border/60 overflow-hidden rounded-lg border border-border/60 bg-card">
              {sorted.map((player) => (
                <li key={player.id} className="flex items-center gap-3 px-3 py-3">
                  <PlayerAvatar
                    src={player.photo_url}
                    name={displayName(player)}
                    className="size-11"
                    fallback={player.shirt_number == null ? undefined : String(player.shirt_number)}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold leading-tight">
                      {player.name}
                      {player.nickname ? (
                        <span className="text-muted-foreground"> · {player.nickname}</span>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {[
                        player.position,
                        player.active ? null : "Inativo",
                        player.initial_goals || player.initial_assists
                          ? `Saldo inicial: ${player.initial_goals}G / ${player.initial_assists}A`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "Sem posição"}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(player)}>
                    <Pencil className="size-4" />
                    <span className="sr-only">Editar</span>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setToDelete(player)}>
                    <Trash2 className="size-4 text-destructive" />
                    <span className="sr-only">Remover</span>
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-8 text-center">
            <Button asChild variant="outline">
              <Link to="/jogos/novo">Lançar um jogo</Link>
            </Button>
          </div>
        </AdminGate>
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar jogador" : "Novo jogador"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-4 rounded-md border border-border/60 p-3">
              <PlayerAvatar src={form.photo} name={form.name || "Jogador"} className="size-16" />
              <div className="min-w-0 flex-1">
                <Label htmlFor="photo" className="text-sm font-semibold">
                  Foto do jogador
                </Label>
                <p className="mt-0.5 text-xs text-muted-foreground">PNG ou JPG, até 8 MB.</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9"
                    onClick={() => document.getElementById("photo")?.click()}
                  >
                    <ImagePlus className="mr-1 size-4" />
                    {form.photo ? "Trocar" : "Enviar foto"}
                  </Button>
                  {form.photo ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-9"
                      onClick={() => setForm((f) => ({ ...f, photo: null }))}
                    >
                      <X className="mr-1 size-4" /> Remover
                    </Button>
                  ) : null}
                </div>
                <input
                  id="photo"
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file) return;
                    try {
                      const dataUrl = await fileToAvatarDataUrl(file);
                      setForm((f) => ({ ...f, photo: dataUrl }));
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Falha ao ler a imagem.");
                    }
                  }}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                className="h-11 text-base"
                value={form.name}
                maxLength={80}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="nickname">Apelido</Label>
                <Input
                  id="nickname"
                  className="h-11 text-base"
                  value={form.nickname}
                  maxLength={40}
                  onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="shirt">Camisa</Label>
                <Input
                  id="shirt"
                  inputMode="numeric"
                  className="h-11 text-base"
                  value={form.shirt}
                  onChange={(e) =>
                    setForm({ ...form, shirt: e.target.value.replace(/\D/g, "").slice(0, 2) })
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Posição</Label>
              <Select
                value={form.position || undefined}
                onValueChange={(value) => setForm({ ...form, position: value })}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border border-border/60 p-3">
              <p className="text-sm font-semibold">Totais anteriores ao app</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                O que o atleta já tinha registrado fora do app. Soma ao ranking geral.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="initial-goals">Gols</Label>
                  <Input
                    id="initial-goals"
                    inputMode="numeric"
                    className="h-11 text-base"
                    value={form.initialGoals}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        initialGoals: e.target.value.replace(/\D/g, "").slice(0, 4),
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="initial-assists">Assistências</Label>
                  <Input
                    id="initial-assists"
                    inputMode="numeric"
                    className="h-11 text-base"
                    value={form.initialAssists}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        initialAssists: e.target.value.replace(/\D/g, "").slice(0, 4),
                      })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
              <Label htmlFor="active">No elenco atual</Label>
              <Switch
                id="active"
                checked={form.active}
                onCheckedChange={(checked) => setForm({ ...form, active: checked })}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" className="h-11" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button className="h-11" onClick={save} disabled={saving}>
              Salvar
            </Button>
          </DialogFooter>

        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover {toDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Os gols e assistências dele nos jogos também serão apagados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
