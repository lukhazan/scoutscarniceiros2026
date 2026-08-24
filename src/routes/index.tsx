import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import {
  Search,
  Target,
  Handshake,
  ImageDown,
  FileDown,
  CalendarRange,
  Shield,
  Share2,
} from "lucide-react";
import { toPng } from "html-to-image";
import { saveFile } from "@/lib/download-file";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { RankingExportCard } from "@/components/RankingExportCard";
import { CategoryStoryCard, type StoryCategory } from "@/components/CategoryStoryCard";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { Podium } from "@/components/Podium";
import { GoalkeeperPodium } from "@/components/GoalkeeperPodium";

import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  displayName,
  statsByYearQueryOptions,
  totalsQueryOptions,
  type PlayerTotals,
} from "@/lib/team-data";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Scouts CF7 2026 — Artilharia e assistências do time" },
      {
        name: "description",
        content:
          "Ranking de gols e assistências do seu time amador, atualizado a cada jogo lançado.",
      },
      { property: "og:title", content: "Scouts CF7 2026 — Artilharia e assistências do time" },
      {
        property: "og:description",
        content: "Ranking de gols e assistências do seu time amador, atualizado a cada jogo lançado.",
      },
    ],
  }),
  component: Index,
});

type Metric = "goals" | "assists";

function Ranking({
  rows,
  metric,
  loading,
}: {
  rows: PlayerTotals[];
  metric: Metric | "clean_sheets";
  loading: boolean;
}) {
  const sorted = useMemo(() => {
    if (metric === "clean_sheets") {
      return [...rows]
        .filter((r) => r.position === "Goleiro" && r.matches_played > 0)
        .sort(
          (a, b) =>
            a.goals_conceded - b.goals_conceded ||
            b.matches_played - a.matches_played ||
            a.name.localeCompare(b.name),
        );
    }
    const other: Metric = metric === "goals" ? "assists" : "goals";
    return [...rows].sort(
      (a, b) => b[metric] - a[metric] || b[other] - a[other] || a.name.localeCompare(b.name),
    );
  }, [rows, metric]);

  if (loading) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Carregando…</p>;
  }

  if (sorted.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        {metric === "clean_sheets"
          ? "Nenhum goleiro com jogo registrado."
          : "Nenhum jogador encontrado ainda."}
      </p>
    );
  }

  return (
    <ol className="divide-y divide-border/60 overflow-hidden rounded-lg border border-border/60 bg-card">
      {sorted.map((row, index) => (
        <li key={row.player_id} className="flex items-center gap-3 px-3 py-3">
          <span
            className={`w-6 shrink-0 text-center font-display text-xl tabular ${
              index === 0 ? "text-primary" : index < 3 ? "text-accent" : "text-muted-foreground"
            }`}
          >
            {index + 1}
          </span>
          <PlayerAvatar src={row.photo_url} name={displayName(row)} className="size-10" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold leading-tight">{displayName(row)}</p>
            <p className="truncate text-xs text-muted-foreground">
              {[row.position, `${row.matches_played} jogo${row.matches_played === 1 ? "" : "s"}`]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>

          <div className="text-right">
            <span className="font-display text-3xl leading-none tabular text-primary">
              {metric === "clean_sheets" ? row.goals_conceded : row[metric]}
            </span>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {metric === "goals" ? "Gols" : metric === "assists" ? "Passes" : "Gols sofridos"}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Index() {
  const { data: allTimeData, isLoading } = useQuery(totalsQueryOptions);
  const { data: yearData } = useQuery(statsByYearQueryOptions);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("all");

  const years = useMemo(
    () => Object.keys(yearData ?? {}).sort((a, b) => Number(b) - Number(a)),
    [yearData],
  );

  const data = useMemo(() => {
    if (period === "all") return allTimeData ?? [];
    return yearData?.[period] ?? [];
  }, [period, allTimeData, yearData]);

  const periodLabel = period === "all" ? "Geral (todos os anos)" : `Temporada ${period}`;

  const keeperRows = useMemo(
    () => (data ?? []).filter((r) => r.position === "Goleiro"),
    [data],
  );

  const rows = useMemo(() => {
    const list = data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter(
      (r) =>
        r.name.toLowerCase().includes(term) ||
        (r.nickname ?? "").toLowerCase().includes(term),
    );
  }, [data, search]);

  const totals = useMemo(() => {
    const list = data ?? [];
    return {
      goals: list.reduce((sum, r) => sum + r.goals, 0),
      assists: list.reduce((sum, r) => sum + r.assists, 0),
      players: list.length,
    };
  }, [data]);

  const exportRef = useRef<HTMLDivElement>(null);
  const storyRefs = {
    goals: useRef<HTMLDivElement>(null),
    assists: useRef<HTMLDivElement>(null),
    clean_sheets: useRef<HTMLDivElement>(null),
  };
  const [exporting, setExporting] = useState(false);

  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingCategory, setExportingCategory] = useState<StoryCategory | null>(null);

  async function renderCard() {
    if (!exportRef.current) return null;
    return await toPng(exportRef.current, { pixelRatio: 2, cacheBust: true });
  }

  async function handleExport() {
    setExporting(true);
    try {
      const dataUrl = await renderCard();
      if (!dataUrl) return;
      const blob = await (await fetch(dataUrl)).blob();
      await saveFile(blob, `ranking-${new Date().toISOString().slice(0, 10)}.png`);
      toast.success("Imagem gerada!");
    } catch {
      toast.error("Não foi possível gerar a imagem.");
    } finally {
      setExporting(false);
    }
  }

  async function handleExportCategory(category: StoryCategory) {
    const node = storyRefs[category].current;
    if (!node) return;
    setExportingCategory(category);
    try {
      const dataUrl = await toPng(node, { pixelRatio: 1, cacheBust: true });
      const blob = await (await fetch(dataUrl)).blob();
      await saveFile(
        blob,
        `${category}-${new Date().toISOString().slice(0, 10)}.png`,
      );
      toast.success("Arte gerada!");
    } catch {
      toast.error("Não foi possível gerar a arte.");
    } finally {
      setExportingCategory(null);
    }
  }

  async function handleExportPdf() {
    setExportingPdf(true);
    try {
      const dataUrl = await renderCard();
      if (!dataUrl || !exportRef.current) return;
      const { jsPDF } = await import("jspdf");
      const node = exportRef.current;
      const width = node.offsetWidth;
      const height = node.offsetHeight;
      const pdf = new jsPDF({
        orientation: height >= width ? "portrait" : "landscape",
        unit: "px",
        format: [width, height],
      });
      pdf.addImage(dataUrl, "PNG", 0, 0, width, height);
      await saveFile(
        pdf.output("blob"),
        `ranking-${new Date().toISOString().slice(0, 10)}.pdf`,
      );
      toast.success("PDF gerado!");
    } catch {
      toast.error("Não foi possível gerar o PDF.");
    } finally {
      setExportingPdf(false);
    }
  }

  const busy = exporting || exportingPdf || exportingCategory !== null;

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="mx-auto max-w-3xl px-4 pb-[calc(4rem+env(safe-area-inset-bottom))] pt-6">
        <h1 className="font-display text-3xl leading-none sm:text-5xl">
          Artilharia &amp; assistências
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Os números somam automaticamente todos os jogos lançados. Nada de bloco de notas.
        </p>

        <div className="mt-4 space-y-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="h-11 w-full sm:w-[220px]" aria-label="Filtrar período">
              <CalendarRange className="mr-1.5 size-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Geral (todos os anos)</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={y}>
                  Temporada {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Button
              variant="outline"
              className="h-11 w-full sm:w-auto"
              onClick={handleExport}
              disabled={busy || (data ?? []).length === 0}
            >
              <ImageDown className="mr-1.5 size-4" />
              {exporting ? "Gerando…" : "Imagem"}
            </Button>
            <Button
              variant="outline"
              className="h-11 w-full sm:w-auto"
              onClick={handleExportPdf}
              disabled={busy || (data ?? []).length === 0}
            >
              <FileDown className="mr-1.5 size-4" />
              {exportingPdf ? "Gerando…" : "PDF"}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="col-span-2 h-11 w-full sm:w-auto"
                  disabled={busy || (data ?? []).length === 0}
                >
                  <Share2 className="mr-1.5 size-4" />
                  {exportingCategory ? "Gerando…" : "Exportar por categoria"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onSelect={() => handleExportCategory("goals")}>
                  ⚽ Artilharia (gols)
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleExportCategory("assists")}>
                  🎯 Assistências
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleExportCategory("clean_sheets")}>
                  🧤 Goleiros (jogos sem sofrer gols)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div aria-hidden className="pointer-events-none fixed -left-[4000px] top-0">
          <RankingExportCard
            ref={exportRef}
            rows={data ?? []}
            teamName="Carniceiros Fut 7"
            periodLabel={periodLabel}
          />
          <CategoryStoryCard
            ref={storyRefs.goals}
            category="goals"
            rows={data ?? []}
            getValue={(r) => r.goals}
            periodLabel={periodLabel}
          />
          <CategoryStoryCard
            ref={storyRefs.assists}
            category="assists"
            rows={data ?? []}
            getValue={(r) => r.assists}
            periodLabel={periodLabel}
          />
          <CategoryStoryCard
            ref={storyRefs.clean_sheets}
            category="clean_sheets"
            rows={keeperRows}
            getValue={(r) => r.goals_conceded}
            periodLabel={periodLabel}
          />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {[
            { label: "Gols", value: totals.goals },
            { label: "Assistências", value: totals.assists },
            { label: "Jogadores", value: totals.players },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-border/60 bg-card px-3 py-2 text-center"
            >
              <p className="font-display text-3xl leading-none tabular">{item.value}</p>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {item.label}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Podium
            rows={data ?? []}
            getValue={(r) => r.goals}
            title="Pódio · Artilharia"
            suffix="gols"
          />
          <Podium
            rows={data ?? []}
            getValue={(r) => r.assists}
            title="Pódio · Assistências"
            suffix="assist."
          />
          <Podium
            rows={keeperRows}
            getValue={cleanSheetsOf}
            title="Pódio · Goleiros (jogos sem sofrer gols)"
            suffix="jogos"
          />
        </div>






        <div className="relative mt-5">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar jogador"
            className="h-11 pl-9 text-base"
            aria-label="Buscar jogador"
          />

        </div>

        <Tabs defaultValue="goals" className="mt-4">
          <TabsList className="grid h-11 w-full grid-cols-3">
            <TabsTrigger value="goals" className="h-9 text-sm">
              <Target className="mr-1.5 size-4" /> Gols
            </TabsTrigger>
            <TabsTrigger value="assists" className="h-9 text-sm">
              <Handshake className="mr-1.5 size-4" /> Assist.
            </TabsTrigger>
            <TabsTrigger value="clean_sheets" className="h-9 text-sm">
              <Shield className="mr-1.5 size-4" /> Goleiros
            </TabsTrigger>
          </TabsList>

          <TabsContent value="goals" className="mt-3">
            <Ranking rows={rows} metric="goals" loading={isLoading} />
          </TabsContent>
          <TabsContent value="assists" className="mt-3">
            <Ranking rows={rows} metric="assists" loading={isLoading} />
          </TabsContent>
          <TabsContent value="clean_sheets" className="mt-3">
            <p className="mb-2 text-xs text-muted-foreground">
              Ranking de goleiros por jogos sem sofrer gols (clean sheets).
            </p>
            <Ranking
              rows={rows}
              metric="clean_sheets"
              loading={isLoading}
              getValue={cleanSheetsOf}
            />
          </TabsContent>

        </Tabs>

        <div className="mt-8 rounded-lg border border-dashed border-border/70 p-4 text-center">
          <p className="text-sm text-muted-foreground">
            É você que lança os jogos? Entre para atualizar a tabela.
          </p>
          <Button asChild className="mt-3">
            <Link to="/jogos/novo">Lançar jogo</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
