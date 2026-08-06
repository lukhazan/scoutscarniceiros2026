import type { ComponentType } from "react";
import type { BrandIdentity } from "@/lib/studio-data";
import { STORY_HEIGHT, STORY_WIDTH } from "@/lib/studio/constants";
import { DEFAULT_PLAYER_SCALE, PlayerFrame } from "@/lib/studio/PlayerFrame";
import { DEFAULT_ZONES, zoneStyle, type TemplateZones } from "@/lib/studio/zones";

export { STORY_HEIGHT, STORY_WIDTH };

/** Campos que um template pode pedir ao administrador. */
export type StudioField =
  | "player"
  | "goals"
  | "title"
  | "subtitle"
  | "background"
  | "playerPhoto";

export type ArtData = {
  playerId: string | null;
  goals: number;
  title: string;
  subtitle: string;
  backgroundUrl: string | null;
  playerPhotoUrl: string | null;
  playerScale: number;
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
  /** Zonas (safe areas) configuráveis do template. */
  zones: TemplateZones;
  /** Título automático calculado a partir dos dados (editável pelo admin). */
  autoTitle: (data: ArtData) => string;
  defaults: Partial<ArtData>;
  Render: ComponentType<TemplateRenderProps>;
};


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

/** Moldura comum: fundo em resolução original, escudo, marca d'água, patrocinadores. */
function StoryFrame({
  brand,
  backgroundUrl,
  zones,
  children,
}: TemplateRenderProps & {
  backgroundUrl: string | null;
  zones: TemplateZones;
  children: React.ReactNode;
}) {
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
            left: 0,
            top: 0,
            width: STORY_WIDTH,
            height: STORY_HEIGHT,
            objectFit: "contain",
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
        style={{ ...zoneStyle(zones.crestArea), objectFit: "contain" }}
      />
      <div
        style={{
          ...zoneStyle(zones.logoArea),
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
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
          ...zoneStyle(zones.sponsorArea),
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
            style={{ maxHeight: zones.sponsorArea.height * 0.7, objectFit: "contain" }}
          />
        ) : (
          <span />
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {(brand?.sponsors ?? []).slice(0, 4).map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              style={{ maxHeight: zones.sponsorArea.height * 0.6, objectFit: "contain" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function BaseArt(
  props: TemplateRenderProps & { headline: string; zones: TemplateZones },
) {
  const { data, brand, player, headline, zones } = props;
  const c = brandColors(brand);
  return (
    <StoryFrame {...props} backgroundUrl={data.backgroundUrl} zones={zones}>
      <PlayerFrame
        photoUrl={data.playerPhotoUrl}
        scale={data.playerScale ?? DEFAULT_PLAYER_SCALE}
        zone={zones.photoArea}
      />

      <div
        style={{
          ...zoneStyle(zones.nameArea),
          display: "flex",
          alignItems: "flex-end",
        }}
      >
        <span
          style={{
            display: "inline-block",
            padding: "10px 26px",
            background: c.primary,
            color: c.accent,
            fontSize: 34,
            fontWeight: 800,
            letterSpacing: 8,
            textTransform: "uppercase",
          }}
        >
          {artPlayerName(player)}
        </span>
      </div>

      <div
        style={{
          ...zoneStyle(zones.titleArea),
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            fontFamily: c.fontPrimary,
            fontSize: headline.length > 12 ? 118 : 156,
            lineHeight: 0.92,
            fontWeight: 900,
            letterSpacing: -2,
            textTransform: "uppercase",
            color: c.accent,
          }}
        >
          {headline}
        </div>
      </div>

      {data.subtitle ? (
        <div
          style={{
            ...zoneStyle(zones.subtitleArea),
            display: "flex",
            alignItems: "center",
            fontSize: 42,
            fontWeight: 600,
            opacity: 0.92,
            overflow: "hidden",
          }}
        >
          {data.subtitle}
        </div>
      ) : null}
    </StoryFrame>
  );
}

export const STUDIO_TEMPLATES: StudioTemplate[] = [
  {
    slug: "gol",
    name: "Gol",
    emoji: "⚽",
    category: "partida",
    fields: ["player", "goals", "title", "subtitle", "background", "playerPhoto"],
    zones: DEFAULT_ZONES,
    autoTitle: (data) => goalsHeadline(data.goals),
    defaults: { goals: 1, subtitle: "" },
    Render: (props) => (
      <BaseArt {...props} headline={props.data.title} zones={DEFAULT_ZONES} />
    ),
  },
  {
    slug: "craque",
    name: "Craque da Partida",
    emoji: "⭐",
    category: "partida",
    fields: ["player", "subtitle", "background", "playerPhoto"],
    zones: DEFAULT_ZONES,
    autoTitle: () => "CRAQUE DA PARTIDA",
    defaults: { subtitle: "" },
    Render: (props) => (
      <BaseArt {...props} headline="CRAQUE DA PARTIDA" zones={DEFAULT_ZONES} />
    ),
  },
];

export function getTemplate(slug: string) {
  return STUDIO_TEMPLATES.find((t) => t.slug === slug) ?? STUDIO_TEMPLATES[0];
}
