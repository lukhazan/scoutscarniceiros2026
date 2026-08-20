import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { AdminGate } from "@/components/AdminGate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArtStudioPanel } from "@/components/studio/ArtStudioPanel";
import { QuickArtPanel } from "@/components/studio/QuickArtPanel";
import { BrandIdentityPanel } from "@/components/studio/BrandIdentityPanel";
import { MediaLibraryPanel } from "@/components/studio/MediaLibraryPanel";
import { TemplatesPanel } from "@/components/studio/TemplatesPanel";

export const Route = createFileRoute("/_authenticated/estudio")({
  head: () => ({
    meta: [
      { title: "Estúdio de Artes — Carniceiros Fut 7" },
      {
        name: "description",
        content:
          "Gere artes de gol e craque da partida com a identidade visual do time em poucos cliques.",
      },
      { property: "og:title", content: "Estúdio de Artes — Carniceiros Fut 7" },
      {
        property: "og:description",
        content: "Artes automáticas do time a partir dos dados do elenco.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EstudioPage,
});

function EstudioPage() {
  return (
    <AdminGate>
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="font-display text-2xl sm:text-3xl">Central de Artes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Use a Arte Rápida para gerar em segundos ou o Estúdio Avançado para criar o padrão.
        </p>

        <Tabs defaultValue="rapida" className="mt-5">
          <TabsList className="flex w-full flex-wrap">
            <TabsTrigger value="rapida">Arte Rápida</TabsTrigger>
            <TabsTrigger value="estudio">Estúdio avançado</TabsTrigger>
            <TabsTrigger value="identidade">Identidade visual</TabsTrigger>
            <TabsTrigger value="midia">Biblioteca de mídia</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>
          <TabsContent value="rapida" className="mt-4">
            <QuickArtPanel />
          </TabsContent>
          <TabsContent value="estudio" className="mt-4">
            <ArtStudioPanel />
          </TabsContent>
          <TabsContent value="identidade" className="mt-4">
            <BrandIdentityPanel />
          </TabsContent>
          <TabsContent value="midia" className="mt-4">
            <MediaLibraryPanel />
          </TabsContent>
          <TabsContent value="templates" className="mt-4">
            <TemplatesPanel />
          </TabsContent>
        </Tabs>
      </main>
    </AdminGate>
  );
}
