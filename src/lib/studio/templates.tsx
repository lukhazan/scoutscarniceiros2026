import type { ComponentType } from "react";
import type { BrandIdentity } from "@/lib/studio-data";

/** Campos que um template pode pedir ao administrador. */
export type StudioField = "player" | "goals" | "title" | "subtitle" | "background";

export type ArtData = {
  playerId: string | null;
  goals: number;
  title: string;
  subtitle: string;
  backgroundUrl: string | null;
};

export type ArtPlayer = {
  id: string;
  name: string;
  nickname: string | null;
  position: string | null;
  shirt_number: number | null;
  photo_url: string | null;
};

export type TemplateRenderProps = {
  data: ArtData;
  brand: BrandIdentity | null;
  player: ArtPlayer | null;
};

export type StudioTemplate = {
  slug: string;
  name: string;
  emoji: string;
  category: string;
  fields: StudioField[];
  /** Título automático calculado a partir dos dados (editável pelo admin). */
  autoTitle: (data: ArtData) => string;
  defaults: Partial<ArtData>;
  Render: ComponentType<TemplateRenderProps>;
};

export const STORY_WIDTH = 1080;
export const STORY_HEIGHT = 1920;

export function goalsHeadline(goals: number) {
  if (goals <= 1) return "GOL";
  if (goals === 3) return "HAT-TRICK";
  return `${goals} GOLS`;
}

export function artPlayerName(player: ArtPlayer | null) {
  if (!player) return "ATLETA";
  return (player.nickname?.trim() || player.name).toUpperCase();
}

function brandColors(brand: BrandIdentity | null) {
  return {
    primary: brand?.primary_color || "#e11d2e",
    secondary: brand?.secondary_color || "#111111",
    accent: brand?.accent_color || "#ffffff",
    fontPrimary: brand?.font_primary || "Anton, Impact, sans-serif",
    fontSecondary: brand?.font_secondary || "Inter, sans-serif",
  };
}

/** Moldura comum a todos os templates: fundo, escudo, marca d'água, patrocinadores. */
function StoryFrame({
  brand,
  backgroundUrl,
  children,
}: TemplateRenderProps & { backgroundUrl: string | null; children: React.ReactNode }) {
  const c = brandColors(brand);
  const crest = brand?.crest_white_url || brand?.crest_url || "/team-logo.png";
  return (
    <div
      style={{
        position: "relative",
        width: STORY_WIDTH,
        height: STORY_HEIGHT,
        overflow: "hidden",
        background: c.secondary,
        fontFamily: c.fontSecondary,
        color: c.accent,
      }}
    >
      {backgroundUrl ? (
        <img
          src={backgroundUrl}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 38%, ${c.secondary}f2 78%, ${c.secondary} 100%)`,
        }}
      />
      {brand?.watermark_url ? (
        <img
          src={brand.watermark_url}
          alt=""
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%,-50%)",
            width: 760,
            opacity: 0.08,
            objectFit: "contain",
          }}
        />
      ) : null}

      <img
        src={crest}
        alt=""
        style={{
          position: "absolute",
          top: 64,
          left: 64,
          width: 150,
          height: 150,
          objectFit: "contain",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 96,
          right: 64,
          textAlign: "right",
          fontSize: 34,
          letterSpacing: 6,
          fontWeight: 700,
          textTransform: "uppercase",
          opacity: 0.9,
        }}
      >
        {brand?.team_name || "Carniceiros Fut 7"}
      </div>

      {children}

      <div
        style={{
          position: "absolute",
          left: 64,
          right: 64,
          bottom: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
        }}
      >
        {brand?.footer_logo_url ? (
          <img
            src={brand.footer_logo_url}
            alt=""
            style={{ height: 74, objectFit: "contain" }}
          />
        ) : (
          <span style={{ height: 74 }} />
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {(brand?.sponsors ?? []).slice(0, 4).map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              style={{ height: 62, objectFit: "contain" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Foto do atleta com enquadramento automático (sem distorção, centralizada). */
function PlayerFigure({ player }: { player: ArtPlayer | null }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 300,
        height: 980,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      {player?.photo_url ? (
        <img
          src={player.photo_url}
          alt=""
          style={{
            maxWidth: 900,
            maxHeight: 980,
            width: "auto",
            height: "auto",
            objectFit: "contain",
            filter: "drop-shadow(0 40px 60px rgba(0,0,0,0.55))",
          }}
        />
      ) : (
        <div
          style={{
            width: 560,
            height: 560,
            borderRadius: 9999,
            background: "rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 160,
            fontWeight: 800,
          }}
        >
          {artPlayerName(player).slice(0, 1)}
        </div>
      )}
    </div>
  );
}

function Headline({
  text,
  color,
  font,
}: {
  text: string;
  color: string;
  font: string;
}) {
  return (
    <div
      style={{
        fontFamily: font,
        fontSize: text.length > 12 ? 118 : 156,
        lineHeight: 0.92,
        fontWeight: 900,
        letterSpacing: -2,
        textTransform: "uppercase",
        color,
      }}
    >
      {text}
    </div>
  );
}

function BaseArt(props: TemplateRenderProps & { headline: string }) {
  const { data, brand, player, headline } = props;
  const c = brandColors(brand);
  return (
    <StoryFrame {...props} backgroundUrl={data.backgroundUrl}>
      <PlayerFigure player={player} />
      <div
        style={{
          position: "absolute",
          left: 64,
          right: 64,
          bottom: 220,
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "10px 26px",
            background: c.primary,
            color: c.accent,
            fontSize: 34,
            fontWeight: 800,
            letterSpacing: 8,
            textTransform: "uppercase",
            marginBottom: 24,
          }}
        >
          {artPlayerName(player)}
        </div>
        <Headline text={headline} color={c.accent} font={c.fontPrimary} />
        {data.subtitle ? (
          <div
            style={{
              marginTop: 22,
              fontSize: 42,
              fontWeight: 600,
              opacity: 0.92,
              maxWidth: 900,
            }}
          >
            {data.subtitle}
          </div>
        ) : null}
      </div>
    </StoryFrame>
  );
}

export const STUDIO_TEMPLATES: StudioTemplate[] = [
  {
    slug: "gol",
    name: "Gol",
    emoji: "⚽",
    category: "partida",
    fields: ["player", "goals", "title", "subtitle", "background"],
    autoTitle: (data) => goalsHeadline(data.goals),
    defaults: { goals: 1, subtitle: "" },
    Render: (props) => <BaseArt {...props} headline={props.data.title} />,
  },
  {
    slug: "craque",
    name: "Craque da Partida",
    emoji: "⭐",
    category: "partida",
    fields: ["player", "subtitle", "background"],
    autoTitle: () => "CRAQUE DA PARTIDA",
    defaults: { subtitle: "" },
    Render: (props) => <BaseArt {...props} headline="CRAQUE DA PARTIDA" />,
  },
];

export function getTemplate(slug: string) {
  return STUDIO_TEMPLATES.find((t) => t.slug === slug) ?? STUDIO_TEMPLATES[0];
}
