import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";
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
import { MediaPicker } from "@/components/studio/MediaPicker";
import { saveFile } from "@/lib/download-file";
import { displayName, playersQueryOptions } from "@/lib/team-data";
import { brandIdentityQueryOptions } from "@/lib/studio-data";
import {
  STORY_HEIGHT,
  STORY_WIDTH,
  STUDIO_TEMPLATES,
  getTemplate,
  type ArtData,
} from "@/lib/studio/templates";

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-lg border border-border/60 bg-card p-4">
      <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function ArtStudioPanel() {
  const { data: players = [] } = useQuery(playersQueryOptions);
  const { data: brand = null } = useQuery(brandIdentityQueryOptions);
  const exportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [slug, setSlug] = useState(STUDIO_TEMPLATES[0].slug);
  const [titleEdited, setTitleEdited] = useState(false);
  const [data, setData] = useState<ArtData>({
    playerId: null,
    goals: 1,
    title: "GOL",
    subtitle: "",
    backgroundUrl: null,
  });

  const template = getTemplate(slug);
  const set = (patch: Partial<ArtData>) => setData((prev) => ({ ...prev, ...patch }));

  // Título automático: recalcula sempre que o admin não editou manualmente.
  useEffect(() => {
    if (titleEdited) return;
    setData((prev) => ({ ...prev, title: template.autoTitle(prev) }));
  }, [template, data.goals, titleEdited]);

  const player = useMemo(() => {
    const found = players.find((p) => p.id === data.playerId);
    return found
      ? {
          id: found.id,
          name: found.name,
          nickname: found.nickname,
          position: found.position,
          shirt_number: found.shirt_number,
          photo_url: found.photo_url,
        }
      : null;
  }, [players, data.playerId]);

  const Render = template.Render;
  const art = <Render data={data} brand={brand} player={player} />;

  async function handleExport() {
    if (!exportRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(exportRef.current, {
        width: STORY_WIDTH,
        height: STORY_HEIGHT,
        pixelRatio: 1,
        cacheBust: true,
      });
      const blob = await (await fetch(dataUrl)).blob();
      await saveFile(blob, `${template.slug}-${Date.now()}.png`);
      toast.success("Arte gerada!");
    } catch {
      toast.error("Não foi possível gerar a arte.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
        <Block title="Template">
          <div className="grid gap-2 sm:grid-cols-2">
            {STUDIO_TEMPLATES.map((t) => (
              <button
                key={t.slug}
                type="button"
                onClick={() => {
                  setSlug(t.slug);
                  setTitleEdited(false);
                  setData((prev) => ({ ...prev, ...t.defaults }));
                }}
                className={`rounded-lg border p-3 text-left ${
                  slug === t.slug ? "border-primary bg-primary/10" : "border-border/60"
                }`}
              >
                <span className="font-display text-base">
                  {t.emoji} {t.name}
                </span>
              </button>
            ))}
          </div>
        </Block>

        <Block title="Dados">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide">Atleta</Label>
              <Select
                value={data.playerId ?? ""}
                onValueChange={(v) => set({ playerId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar atleta" />
                </SelectTrigger>
                <SelectContent>
                  {players.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {displayName(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {template.fields.includes("goals") ? (
              <div className="space-y-1.5">
                <Label htmlFor="goals" className="text-xs font-semibold uppercase tracking-wide">
                  Quantidade de gols
                </Label>
                <Input
                  id="goals"
                  type="number"
                  min={1}
                  max={20}
                  value={data.goals}
                  onChange={(e) => {
                    setTitleEdited(false);
                    set({ goals: Math.max(1, Number(e.target.value) || 1) });
                  }}
                />
              </div>
            ) : null}

            {template.fields.includes("title") ? (
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs font-semibold uppercase tracking-wide">
                  Texto principal (automático, editável)
                </Label>
                <Input
                  id="title"
                  value={data.title}
                  onChange={(e) => {
                    setTitleEdited(true);
                    set({ title: e.target.value });
                  }}
                />
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="sub" className="text-xs font-semibold uppercase tracking-wide">
                Texto complementar
              </Label>
              <Input
                id="sub"
                value={data.subtitle}
                maxLength={70}
                placeholder="Ex.: vitória contra o Real Várzea"
                onChange={(e) => set({ subtitle: e.target.value })}
              />
            </div>
          </div>
        </Block>

        <Block title="Imagem">
          <MediaPicker
            label="Fundo da arte"
            category="fundo"
            value={data.backgroundUrl}
            onChange={(v) => set({ backgroundUrl: v })}
          />
          <p className="text-xs text-muted-foreground">
            A foto do atleta é carregada automaticamente do elenco, com enquadramento
            automático e sem distorção.
          </p>
        </Block>

        <Block title="Aparência">
          <p className="text-sm text-muted-foreground">
            Cores, fontes, escudo, marca d'água e patrocinadores vêm da Identidade Visual.
            O layout é responsabilidade do template.
          </p>
        </Block>

        <Block title="Exportação">
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Download className="mr-2 size-4" />
            )}
            Baixar PNG (1080x1920)
          </Button>
        </Block>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Pré-visualização
        </p>
        <div className="relative w-full overflow-hidden rounded-xl border border-border/60 bg-secondary [aspect-ratio:9/16]">
          <div
            className="absolute left-0 top-0 origin-top-left"
            style={{
              width: STORY_WIDTH,
              height: STORY_HEIGHT,
              transform: "scale(var(--story-scale))",
              // escala responsiva: largura do contêiner / 1080
              ["--story-scale" as string]: "calc(100cqw / 1080)",
              containerType: "inline-size",
            }}
          >
            {art}
          </div>
        </div>
      </div>

      {/* nó oculto em resolução real, usado apenas na exportação */}
      <div className="pointer-events-none fixed -left-[10000px] top-0" aria-hidden>
        <div ref={exportRef} style={{ width: STORY_WIDTH, height: STORY_HEIGHT }}>
          {art}
        </div>
      </div>
    </div>
  );
}
