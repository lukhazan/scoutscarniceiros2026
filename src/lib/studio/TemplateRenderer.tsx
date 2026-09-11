import { memo } from "react";
import type { BrandIdentity } from "@/lib/studio-data";
import { FitText } from "@/lib/studio/FitText";
import { StudioCanvas } from "@/lib/studio/Canvas";
import { PlayerFrame } from "@/lib/studio/PlayerFrame";
import { AgendaLayer } from "@/lib/studio/AgendaLayer";
import { RosterLayer } from "@/lib/studio/RosterLayer";
import { SponsorsLayer } from "@/lib/studio/SponsorsLayer";
import { DEFAULT_SPONSOR_CONFIG, sponsorsFromBrand, type SponsorConfig } from "@/lib/studio/sponsors";
import {
  STORY_HEIGHT,
  STORY_WIDTH,
  type LayerId,
  type TemplateLayout,
  type TextLayerConfig,
} from "@/lib/studio/layout";
import { zoneStyle, type Zone } from "@/lib/studio/zones";
import type { ArtData, ArtPlayer, TemplateRenderProps, TextOverride } from "@/lib/studio/types";

export function brandColors(brand: BrandIdentity | null) {
  return {
    primary: brand?.primary_color || "#e11d2e",
    secondary: brand?.secondary_color || "#111111",
    accent: brand?.accent_color || "#ffffff",
    fontPrimary: brand?.font_primary || "Anton, Impact, sans-serif",
    fontSecondary: brand?.font_secondary || "Inter, sans-serif",
  };
}

export function artPlayerName(player: ArtPlayer | null, data?: ArtData) {
  const custom = data?.playerName?.trim();
  if (custom) return custom.toUpperCase();
  if (!player) return "ATLETA";
  return (player.nickname?.trim() || player.name).toUpperCase();
}

/* ---------------------------- camadas isoladas ---------------------------- */

const BackgroundLayer = memo(function BackgroundLayer({ url }: { url: string | null }) {
  if (!url) return null;
  return (
    <img
      src={url}
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
  );
});

const GraphicsLayer = memo(function GraphicsLayer({ urls }: { urls: string[] }) {
  if (!urls.length) return null;
  return (
    <>
      {urls.map((src, i) => (
        <img
          key={i}
          src={src}
          alt=""
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: STORY_WIDTH,
            height: STORY_HEIGHT,
            objectFit: "contain",
          }}
        />
      ))}
    </>
  );
});


const OverlayLayer = memo(function OverlayLayer({
  color,
  strength,
}: {
  color: string;
  strength: number;
}) {
  if (!strength) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(180deg, rgba(0,0,0,${0.55 * strength}) 0%, rgba(0,0,0,${
          0.15 * strength
        }) 38%, ${color}f2 78%, ${color} 100%)`,
      }}
    />
  );
});

const ImageLayer = memo(function ImageLayer({
  url,
  zone,
  opacity = 1,
}: {
  url: string | null;
  zone: Zone;
  opacity?: number;
}) {
  if (!url) return null;
  return (
    <img
      src={url}
      alt=""
      style={{ ...zoneStyle(zone), objectFit: "contain", opacity }}
    />
  );
});

function hexToRgba(hex: string, opacity: number) {
  const m = /^#?([\da-f]{3}|[\da-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${opacity})`;
}

const TextLayer = memo(function TextLayer({
  text,
  zone,
  config,
  override,
  colors,
}: {
  text: string;
  zone: Zone;
  config: TextLayerConfig;
  override?: TextOverride;
  colors: ReturnType<typeof brandColors>;
}) {
  if (!text) return null;
  const themeFont =
    (override?.font ?? config.font ?? "secondary") === "primary"
      ? colors.fontPrimary
      : colors.fontSecondary;
  const font = override?.fontFamily
    ? `"${override.fontFamily}", ${themeFont}`
    : themeFont;
  const palette = { accent: colors.accent, primary: colors.primary, secondary: colors.secondary };
  const color = override?.color ?? palette[config.color ?? "accent"];
  const uppercase = override?.uppercase ?? config.uppercase;
  const value = uppercase ? text.toUpperCase() : text;
  const maxFontSize =
    override?.fontSize ?? config.maxFontSize * (override?.sizeScale ?? 1);
  const align = override?.align ?? config.align ?? "flex-start";

  const common = {
    fontFamily: font,
    fontWeight: override?.bold ? 900 : (config.weight ?? 600),
    fontStyle: override?.italic ? "italic" : "normal",
    textDecoration: override?.underline ? "underline" : "none",
    letterSpacing: config.letterSpacing ?? 0,
    color,
  } as React.CSSProperties;

  const bg = override?.background;
  const textAlign = align === "center" ? "center" : align === "flex-end" ? "right" : "left";

  /* fundo próprio configurado pelo usuário (vinculado a este texto) */
  if (bg?.enabled) {
    const manual = bg.mode === "manual";
    const box: React.CSSProperties = {
      background: hexToRgba(bg.color, bg.opacity),
      borderRadius: bg.radius,
      padding: `${bg.paddingY}px ${bg.paddingX}px`,
      transform: `translate(${bg.offsetX}px, ${bg.offsetY}px)`,
      ...(manual
        ? {
            width: bg.width ?? zone.width,
            minHeight: bg.height ?? zone.height,
          }
        : { width: "auto", height: "auto", maxWidth: zone.width }),
    };
    return (
      <FitText
        text={value}
        zone={zone}
        maxFontSize={maxFontSize}
        maxLines={config.maxLines}
        charRatio={config.charRatio}
        lineHeight={config.lineHeight}
        align="center"
        justify={align}
        style={common}
        box={box}
        boxTextAlign={textAlign}
        fitInsetX={bg.paddingX * 2}
        fitInsetY={bg.paddingY * 2}
      />
    );
  }

  if (config.chip) {
    return (
      <div
        style={{
          ...zoneStyle(zone),
          display: "flex",
          alignItems: "flex-end",
          justifyContent: align,
          overflow: "hidden",
        }}
      >
        <FitText
          text={value}
          zone={{ x: 0, y: 0, width: zone.width - 52, height: zone.height - 20 }}
          maxFontSize={maxFontSize}
          maxLines={config.maxLines}
          charRatio={config.charRatio}
          style={{
            ...common,
            position: "relative",
            padding: "10px 26px",
            background: colors.primary,
            width: "auto",
            height: "auto",
          }}
        />
      </div>
    );
  }

  return (
    <FitText
      text={value}
      zone={zone}
      maxFontSize={maxFontSize}
      maxLines={config.maxLines}
      charRatio={config.charRatio}
      lineHeight={config.lineHeight}
      align="center"
      justify={align}
      style={common}
    />
  );
});


/* ------------------------------ renderizador ------------------------------ */

export type TemplateRendererProps = TemplateRenderProps & {
  layout: TemplateLayout;
  headline: string;
};

/**
 * Motor único de renderização: lê o arquivo de layout do template e desenha
 * cada camada de forma independente. Usado igualmente na prévia e no PNG.
 */
export function TemplateRenderer({
  layout,
  data,
  brand,
  player,
  headline,
  selected = null,
  onSelect,
  onSponsorAreaChange,
}: TemplateRendererProps) {
  const c = brandColors(brand);
  const a = layout.areas;
  const crest = brand?.crest_white_url || brand?.crest_url || "/team-logo.png";

  const node = (id: LayerId) => {
    switch (id) {
      case "background":
        return <BackgroundLayer key={id} url={data.backgroundUrl} />;
      case "graphics":
        return <GraphicsLayer key={id} urls={layout.graphics ?? []} />;
      case "overlay":
        return (
          <OverlayLayer key={id} color={c.secondary} strength={layout.overlayStrength ?? 1} />
        );
      case "watermark":
        return (
          <ImageLayer key={id} url={brand?.watermark_url ?? null} zone={a.watermark} opacity={0.08} />
        );
      case "crest":
        return <ImageLayer key={id} url={crest} zone={a.crest} />;
      case "teamName":
        return (
          <TextLayer
            key={id}
            text={brand?.team_name || "Carniceiros Fut 7"}
            zone={a.teamName}
            config={layout.text.teamName}
            colors={c}
          />
        );
      case "photo":
        return (
          <PlayerFrame
            key={id}
            photoUrl={data.playerPhotoUrl}
            scale={data.playerScale}
            offsetX={data.playerOffsetX}
            offsetY={data.playerOffsetY}
            rotation={data.playerRotation}
            zone={a.photo}
          />
        );
      case "playerName":
        return (
          <TextLayer
            key={id}
            text={artPlayerName(player, data)}
            zone={a.playerName}
            config={layout.text.playerName}
            override={data.textStyles.playerName}
            colors={c}
          />
        );
      case "title":
        return (
          <TextLayer
            key={id}
            text={headline}
            zone={a.title}
            config={layout.text.title}
            override={data.textStyles.title}
            colors={c}
          />
        );
      case "subtitle":
        return (
          <TextLayer
            key={id}
            text={data.subtitle}
            zone={a.subtitle}
            config={layout.text.subtitle}
            override={data.textStyles.subtitle}
            colors={c}
          />
        );
      case "agenda":
        return (
          <AgendaLayer
            key={id}
            zone={a.agenda}
            items={data.agendaItems ?? []}
            teamName={brand?.team_name || "Carniceiros Fut 7"}
            colors={c}
          />
        );
      case "roster":
        return (
          <RosterLayer key={id} zone={a.roster} names={data.rosterNames ?? []} colors={c} />
        );
      case "sponsors": {
        const base: SponsorConfig = data.sponsorConfig ?? DEFAULT_SPONSOR_CONFIG;
        // Migração transparente: enquanto o usuário não editar a área, usa as
        // logos já cadastradas na identidade visual, na posição do template.
        const config: SponsorConfig = {
          ...base,
          area: base.migrated ? base.area : (base.area ?? DEFAULT_SPONSOR_CONFIG.area),
          items: base.items.length ? base.items : sponsorsFromBrand(brand),
        };
        if (!config.items.length) return null;
        return <SponsorsLayer key={id} config={config} accent={c.primary} />;
      }
      default:
        return null;
    }
  };

  const hidden = data.hiddenLayers ?? [];
  const locked = data.lockedLayers ?? [];
  const order = (data.layerOrder ?? layout.layers).filter((id) =>
    layout.layers.includes(id),
  );

  const hotspots = onSelect
    ? (["photo", "playerName", "title", "subtitle"] as const)
        .filter((id) => !hidden.includes(id) && !locked.includes(id))
        .map((id) => (
          <div
            key={`hs-${id}`}
            onClick={() => onSelect(id)}
            style={{
              ...zoneStyle(a[id]),
              cursor: "pointer",
              border:
                selected === id ? `4px dashed ${c.primary}` : "4px dashed rgba(255,255,255,0.12)",
              borderRadius: 12,
            }}
          />
        ))
    : null;

  return (
    <StudioCanvas background={c.secondary}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          fontFamily: c.fontSecondary,
          color: c.accent,
        }}
      >
        {order.filter((id) => !hidden.includes(id)).map(node)}
        {hotspots}
      </div>
    </StudioCanvas>
  );
}
