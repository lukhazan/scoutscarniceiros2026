import { memo, useRef } from "react";
import { STORY_HEIGHT, STORY_WIDTH } from "@/lib/studio/constants";
import { zoneStyle, type Zone } from "@/lib/studio/zones";
import { sponsorCellSize, type SponsorConfig } from "@/lib/studio/sponsors";

type HandleId = "nw" | "ne" | "sw" | "se" | "n" | "s" | "w" | "e" | "move";

const HANDLE_POS: Record<Exclude<HandleId, "move">, React.CSSProperties> = {
  nw: { left: -12, top: -12, cursor: "nwse-resize" },
  ne: { right: -12, top: -12, cursor: "nesw-resize" },
  sw: { left: -12, bottom: -12, cursor: "nesw-resize" },
  se: { right: -12, bottom: -12, cursor: "nwse-resize" },
  n: { left: "50%", top: -12, marginLeft: -12, cursor: "ns-resize" },
  s: { left: "50%", bottom: -12, marginLeft: -12, cursor: "ns-resize" },
  w: { left: -12, top: "50%", marginTop: -12, cursor: "ew-resize" },
  e: { right: -12, top: "50%", marginTop: -12, cursor: "ew-resize" },
};

const MIN_SIZE = 80;

function clampArea(a: Zone): Zone {
  const width = Math.max(MIN_SIZE, Math.min(a.width, STORY_WIDTH));
  const height = Math.max(MIN_SIZE, Math.min(a.height, STORY_HEIGHT));
  const x = Math.min(Math.max(0, a.x), STORY_WIDTH - width);
  const y = Math.min(Math.max(0, a.y), STORY_HEIGHT - height);
  return { x, y, width, height };
}

/**
 * Camada de patrocinadores: área configurável (posição/tamanho) com logos
 * organizadas automaticamente, sempre com proporção preservada.
 * A mesma camada é usada na prévia e na exportação — o overlay de edição só
 * aparece quando `editable` está ativo (nunca no PNG final).
 */
export const SponsorsLayer = memo(function SponsorsLayer({
  config,
  editable = false,
  selected = false,
  accent = "#e11d2e",
  onSelect,
  onAreaChange,
}: {
  config: SponsorConfig;
  editable?: boolean;
  selected?: boolean;
  accent?: string;
  onSelect?: () => void;
  onAreaChange?: (area: Zone) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const items = config.items ?? [];
  const cell = sponsorCellSize(config, items.length);
  const area = config.area;

  function startDrag(handle: HandleId, e: React.PointerEvent) {
    if (!onAreaChange) return;
    e.preventDefault();
    e.stopPropagation();
    const el = boxRef.current;
    const rect = el?.getBoundingClientRect();
    const scale = rect && area.width ? rect.width / area.width : 1;
    const startX = e.clientX;
    const startY = e.clientY;
    const start = { ...area };
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / (scale || 1);
      const dy = (ev.clientY - startY) / (scale || 1);
      let next: Zone = { ...start };
      if (handle === "move") {
        next = { ...start, x: start.x + dx, y: start.y + dy };
      } else {
        if (handle.includes("w")) {
          next.x = start.x + dx;
          next.width = start.width - dx;
        }
        if (handle.includes("e")) next.width = start.width + dx;
        if (handle.includes("n")) {
          next.y = start.y + dy;
          next.height = start.height - dy;
        }
        if (handle.includes("s")) next.height = start.height + dy;
      }
      onAreaChange(clampArea({
        x: Math.round(next.x),
        y: Math.round(next.y),
        width: Math.round(next.width),
        height: Math.round(next.height),
      }));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <div
      ref={boxRef}
      style={{
        ...zoneStyle(area),
        padding: config.padding,
        display: "flex",
        flexWrap: "wrap",
        alignContent: config.alignY,
        alignItems: "center",
        justifyContent: config.alignX,
        columnGap: config.gapX,
        rowGap: config.gapY,
        boxSizing: "border-box",
        cursor: editable ? "move" : undefined,
        border: editable
          ? selected
            ? `4px dashed ${accent}`
            : "4px dashed rgba(255,255,255,0.16)"
          : undefined,
        borderRadius: editable ? 12 : undefined,
      }}
      onPointerDown={(e) => {
        if (!editable) return;
        onSelect?.();
        if (selected) startDrag("move", e);
      }}
    >
      {items.map((item) => {
        const w = item.width ?? cell.width * item.scale * config.logoScale;
        const h = item.height ?? cell.height * item.scale * config.logoScale;
        return (
          <img
            key={item.id}
            src={item.url}
            alt={item.name ?? ""}
            style={{
              width: w,
              height: h,
              maxWidth: "none",
              objectFit: "contain",
              transform: `translate(${item.offsetX}px, ${item.offsetY}px)`,
              imageRendering: "auto",
            }}
          />
        );
      })}

      {editable && selected ? (
        <>
          <span
            style={{
              position: "absolute",
              left: 8,
              top: -46,
              padding: "4px 12px",
              borderRadius: 8,
              background: accent,
              color: "#fff",
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: 2,
              whiteSpace: "nowrap",
            }}
          >
            ÁREA DE PATROCÍNIOS
          </span>
          {(Object.keys(HANDLE_POS) as (keyof typeof HANDLE_POS)[]).map((h) => (
            <span
              key={h}
              onPointerDown={(e) => startDrag(h, e)}
              style={{
                position: "absolute",
                width: 24,
                height: 24,
                borderRadius: 6,
                background: "#fff",
                border: `4px solid ${accent}`,
                ...HANDLE_POS[h],
              }}
            />
          ))}
        </>
      ) : null}
    </div>
  );
});
