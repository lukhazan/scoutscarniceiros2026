import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ImagePlus, Loader2, Pencil, Plus, RotateCcw, Scissors, Trash2, UserRound, Wallet, X } from "lucide-react";
import { PlayerFinanceDialog } from "@/components/PlayerFinanceDialog";
import { supabase } from "@/integrations/supabase/client";
import { ensurePlayerFee, financeSettingsQueryOptions } from "@/lib/finance-data";
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
import {
  POSITIONS,
  playersQueryOptions,
  seasonStatsQueryOptions,
  displayName,
  type Player,
} from "@/lib/team-data";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { PhotoCutoutEditor } from "@/components/PhotoCutoutEditor";
import {
  DEFAULT_ADJUST,
  fileToCutoutSourceDataUrl,
  fileToSourceDataUrl,
  renderAdjustedPhoto,
  renderOriginalPhoto,
  type PhotoAdjust,
} from "@/lib/player-photo";

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
  initial_conceded: z
    .number()
    .int()
    .min(0, "Gols sofridos anteriores não podem ser negativos")
    .max(9999),
  photo_url: z.string().nullable(),
  photo_original_url: z.string().nullable(),
});

const CURRENT_SEASON = String(new Date().getFullYear());

const empty = {
  name: "",
  nickname: "",
  position: "",
  shirt: "",
  active: true,
  season: CURRENT_SEASON,
  initialGoals: "0",
  initialAssists: "0",
  initialConceded: "0",
  photo: null as string | null,
  photoOriginal: null as string | null,
};

function ElencoPage() {
  const queryClient = useQueryClient();
  const { data: players, isLoading } = useQuery(playersQueryOptions);
  const { data: seasonStats } = useQuery(seasonStatsQueryOptions);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Player | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Player | null>(null);
  const [financePlayer, setFinancePlayer] = useState<{ id: string; name: string } | null>(null);
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const [cutoutSource, setCutoutSource] = useState<string | null>(null);
  const [originalSource, setOriginalSource] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [usingCutout, setUsingCutout] = useState(false);
  const [adjust, setAdjust] = useState<PhotoAdjust>(DEFAULT_ADJUST);

  const activeSource = usingCutout ? (cutoutSource ?? originalSource) : originalSource;

  useEffect(() => {
    if (!activeSource) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      void renderAdjustedPhoto(activeSource, adjust)
        .then((photo) => {
          if (!cancelled) setForm((f) => ({ ...f, photo }));
        })
        .catch(() => undefined);
    }, 80);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [activeSource, adjust]);

  const sorted = useMemo(
    () =>
      [...(players ?? [])].sort(
        (a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name),
      ),
    [players],
  );

  function resetPhotoState() {
    setCutoutSource(null);
    setOriginalSource(null);
    setPendingFile(null);
    setUsingCutout(false);
    setAdjust(DEFAULT_ADJUST);
  }

  function seasonValues(playerId: string | undefined, season: string) {
    const row = (seasonStats ?? []).find(
      (r) => r.player_id === playerId && String(r.season) === season,
    );
    return {
      initialGoals: String(row?.goals ?? 0),
      initialAssists: String(row?.assists ?? 0),
      initialConceded: String(row?.goals_conceded ?? 0),
    };
  }

  function openNew() {
    setEditing(null);
    setForm(empty);
    resetPhotoState();
    setOpen(true);
  }

  function openEdit(player: Player) {
    setEditing(player);
    resetPhotoState();
    setForm({
      name: player.name,
      nickname: player.nickname ?? "",
      position: player.position ?? "",
      shirt: player.shirt_number == null ? "" : String(player.shirt_number),
      active: player.active,
      season: CURRENT_SEASON,
      ...seasonValues(player.id, CURRENT_SEASON),
      photo: player.photo_url ?? null,
      photoOriginal: null,
    });
    setOpen(true);
  }

  async function handlePhotoFile(file: File) {
    setPhotoProcessing(true);
    resetPhotoState();
    try {
      const original = await fileToSourceDataUrl(file);
      setPendingFile(file);
      setOriginalSource(original);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao ler a imagem.");
    } finally {
      setPhotoProcessing(false);
    }
  }

  async function removeBackgroundNow() {
    const file = pendingFile;
    if (!file) return;
    setPhotoProcessing(true);
    try {
      const cutout = await fileToCutoutSourceDataUrl(file);
      setCutoutSource(cutout);
      setUsingCutout(true);
    } catch {
      toast.message("Não foi possível remover o fundo. Mantendo a foto original.");
    } finally {
      setPhotoProcessing(false);
    }
  }



  async function save() {
    let finalPhoto = form.photo;
    let finalOriginal = form.photoOriginal;
    if (activeSource) {
      try {
        finalPhoto = await renderAdjustedPhoto(activeSource, adjust);
      } catch {
        /* mantém a prévia atual */
      }
      try {
        // FOTO ORIGINAL: mantida inteira, sem corte (só reduz escala se enorme)
        finalOriginal = await renderOriginalPhoto(activeSource);
      } catch {
        finalOriginal = activeSource;
      }
    }
    const parsed = playerSchema.safeParse({
      name: form.name,
      nickname: form.nickname || undefined,
      position: form.position || undefined,
      shirt_number: form.shirt === "" ? null : Number(form.shirt),
      active: form.active,
      initial_goals: form.initialGoals === "" ? 0 : Number(form.initialGoals),
      initial_assists: form.initialAssists === "" ? 0 : Number(form.initialAssists),
      initial_conceded:
        form.position === "Goleiro" && form.initialConceded !== ""
          ? Number(form.initialConceded)
          : 0,
      photo_url: finalPhoto,
      photo_original_url: finalOriginal,
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
      photo_url: parsed.data.photo_url,
      photo_original_url: parsed.data.photo_original_url,
    };
    let playerId = editing?.id ?? "";
    let error = null as { message: string } | null;
    if (editing) {
      const res = await supabase.from("players").update(payload).eq("id", editing.id);
      error = res.error;
    } else {
      const res = await supabase.from("players").insert(payload).select("id").single();
      error = res.error;
      playerId = res.data?.id ?? "";
    }
    if (!error && playerId && !editing) {
      try {
        const settings = await queryClient.fetchQuery(financeSettingsQueryOptions);
        await ensurePlayerFee(playerId, settings);
      } catch {
        // configuração financeira é opcional no cadastro
      }
    }
    if (!error && playerId) {
      const res = await supabase.from("player_season_stats").upsert(
        {
          player_id: playerId,
          season: Number(form.season) || Number(CURRENT_SEASON),
          goals: parsed.data.initial_goals,
          assists: parsed.data.initial_assists,
          goals_conceded: parsed.data.initial_conceded,
        },
        { onConflict: "player_id,season" },
      );
      error = res.error;
    }
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
                        (() => {
                          const s = seasonValues(player.id, CURRENT_SEASON);
                          return Number(s.initialGoals) || Number(s.initialAssists)
                            ? `Importado ${CURRENT_SEASON}: ${s.initialGoals}G / ${s.initialAssists}A`
                            : null;
                        })(),
                      ]
                        .filter(Boolean)
                        .join(" · ") || "Sem posição"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Financeiro"
                    onClick={() =>
                      setFinancePlayer({ id: player.id, name: displayName(player) })
                    }
                  >
                    <Wallet className="size-4" />
                  </Button>
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
              <div className="relative">
                <PlayerAvatar src={form.photo} name={form.name || "Jogador"} className="size-16" />
                {photoProcessing ? (
                  <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70">
                    <Loader2 className="size-5 animate-spin text-primary" />
                  </span>
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <Label htmlFor="photo" className="text-sm font-semibold">
                  Foto do jogador
                </Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {photoProcessing
                    ? "Processando imagem…"
                    : "PNG, JPG ou WebP, até 25 MB. Não precisa comprimir: a foto original é guardada inteira; o recorte vale só para o avatar."}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9"
                    disabled={photoProcessing}
                    onClick={() => document.getElementById("photo")?.click()}
                  >
                    <ImagePlus className="mr-1 size-4" />
                    {form.photo ? "Trocar" : "Enviar foto"}
                  </Button>
                  {pendingFile && !cutoutSource && !photoProcessing ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-9"
                      onClick={() => void removeBackgroundNow()}
                    >
                      <Scissors className="mr-1 size-4" /> Remover fundo
                    </Button>
                  ) : null}
                  {cutoutSource && originalSource && !photoProcessing ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-9"
                      onClick={() => setUsingCutout((v) => !v)}
                    >
                      <RotateCcw className="mr-1 size-4" />
                      {usingCutout ? "Usar foto original" : "Usar sem fundo"}
                    </Button>
                  ) : null}
                  {form.photoOriginal && !originalSource && !photoProcessing ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-9"
                      onClick={() => {
                        setPendingFile(null);
                        setCutoutSource(null);
                        setUsingCutout(false);
                        setAdjust(DEFAULT_ADJUST);
                        setOriginalSource(form.photoOriginal);
                      }}
                    >
                      <ImagePlus className="mr-1 size-4" /> Ajustar avatar
                    </Button>
                  ) : null}
                  {form.photo && !photoProcessing ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-9"
                      onClick={() => {
                        setForm((f) => ({ ...f, photo: null, photoOriginal: null }));
                        resetPhotoState();
                      }}
                    >
                      <X className="mr-1 size-4" /> Remover
                    </Button>
                  ) : null}

                </div>
                <input
                  id="photo"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) void handlePhotoFile(file);
                  }}
                />
              </div>
            </div>
            {activeSource && !photoProcessing ? (
              <div className="space-y-2">
                <div className="flex justify-center rounded-md border border-border/60 bg-secondary/40 p-3">
                  {form.photo ? (
                    <img
                      src={form.photo}
                      alt="Prévia do recorte"
                      className="aspect-square w-full max-w-[320px] rounded-md object-contain"
                    />
                  ) : null}
                </div>
                <PhotoCutoutEditor value={adjust} onChange={setAdjust} />
              </div>
            ) : null}

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
              <p className="text-sm font-semibold">Totais importados da temporada</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                O que o atleta já tinha registrado fora do app nesta temporada. Soma aos jogos do
                mesmo ano e ao ranking geral.
              </p>
              <div className="mt-3 space-y-1.5">
                <Label htmlFor="season">Temporada</Label>
                <Input
                  id="season"
                  inputMode="numeric"
                  className="h-11 text-base"
                  value={form.season}
                  onChange={(e) => {
                    const season = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setForm((f) => ({
                      ...f,
                      season,
                      ...(season.length === 4
                        ? seasonValues(editing?.id, season)
                        : {}),
                    }));
                  }}
                />
              </div>
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
              {form.position === "Goleiro" ? (
                <div className="mt-3 space-y-1.5">
                  <Label htmlFor="initial-conceded">Gols sofridos</Label>
                  <Input
                    id="initial-conceded"
                    inputMode="numeric"
                    className="h-11 text-base"
                    value={form.initialConceded}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        initialConceded: e.target.value.replace(/\D/g, "").slice(0, 4),
                      })
                    }
                  />
                </div>
              ) : null}
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
            <Button className="h-11" onClick={save} disabled={saving || photoProcessing}>
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

      <PlayerFinanceDialog
        playerId={financePlayer?.id ?? null}
        playerName={financePlayer?.name ?? ""}
        open={financePlayer !== null}
        onOpenChange={(next) => {
          if (!next) setFinancePlayer(null);
        }}
      />
    </div>
  );
}
