import { forwardRef, useEffect, useRef, useState, type ReactNode } from "react";
import { STORY_HEIGHT, STORY_WIDTH } from "@/lib/studio/constants";

/**
 * Canvas fixo 1080x1920 usado igualmente na pré-visualização e na exportação.
 * Nenhum elemento fora deste componente altera a resolução da arte.
 */
export const StudioCanvas = forwardRef<HTMLDivElement, { children: ReactNode; background?: string }>(
  function StudioCanvas({ children, background = "#000" }, ref) {
    return (
      <div
        ref={ref}
        style={{
          position: "relative",
          width: STORY_WIDTH,
          height: STORY_HEIGHT,
          minWidth: STORY_WIDTH,
          minHeight: STORY_HEIGHT,
          overflow: "hidden",
          background,
        }}
      >
        {children}
      </div>
    );
  },
);

/**
 * Exibe o canvas fixo reduzido proporcionalmente ao espaço disponível.
 * A escala é apenas visual — não afeta a exportação.
 */
export function ScaledCanvas({ zoom = 1, children }: { zoom?: number; children: ReactNode }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(0.25);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const update = () => setFit(el.clientWidth / STORY_WIDTH);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={boxRef}
      className="relative w-full overflow-hidden rounded-xl border border-border/60 bg-background"
      style={{ aspectRatio: `${STORY_WIDTH} / ${STORY_HEIGHT}` }}
    >
      <div
        className="absolute left-0 top-0 origin-top-left transition-transform duration-150"
        style={{ width: STORY_WIDTH, height: STORY_HEIGHT, transform: `scale(${fit * zoom})` }}
      >
        {children}
      </div>
    </div>
  );
}
