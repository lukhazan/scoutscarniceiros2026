import type { Zone } from "@/lib/studio/zones";
import { zoneStyle } from "@/lib/studio/zones";

/**
 * Texto que sempre cabe 100% dentro da zona.
 * O cálculo é determinístico (sem medição do DOM), garantindo que a
 * pré-visualização e a exportação renderizem exatamente igual.
 */
export type FitTextProps = {
  text: string;
  zone: Zone;
  maxFontSize: number;
  /** Largura média do caractere em relação ao font-size. */
  charRatio?: number;
  lineHeight?: number;
  maxLines?: number;
  align?: "flex-start" | "center" | "flex-end";
  justify?: "flex-start" | "center" | "flex-end";
  style?: React.CSSProperties;
  /** caixa de fundo desenhada atrás das linhas de texto */
  box?: React.CSSProperties;
  /** alinhamento do texto dentro da caixa */
  boxTextAlign?: "left" | "center" | "right";
};


function balanceLines(text: string, lines: number) {
  const words = text.trim().split(/\s+/);
  if (lines <= 1 || words.length < 2) return [text.trim()];
  const target = Math.ceil(words.length / lines);
  const out: string[] = [];
  for (let i = 0; i < words.length; i += target) {
    out.push(words.slice(i, i + target).join(" "));
  }
  return out;
}

export function FitText({
  text,
  zone,
  maxFontSize,
  charRatio = 0.56,
  lineHeight = 1.02,
  maxLines = 2,
  align = "center",
  justify = "flex-start",
  style,
  box,
  boxTextAlign,
  fitInsetX = 0,
  fitInsetY = 0,
}: FitTextProps & { fitInsetX?: number; fitInsetY?: number }) {
  let best = { lines: [text], size: 0 };
  const fitWidth = Math.max(40, zone.width - fitInsetX);
  const fitHeight = Math.max(20, zone.height - fitInsetY);

  for (let n = 1; n <= maxLines; n++) {
    const lines = balanceLines(text, n);
    if (lines.length !== n && n > 1) continue;
    const longest = Math.max(...lines.map((l) => l.length), 1);
    const byWidth = fitWidth / (longest * charRatio);
    const byHeight = fitHeight / (lines.length * lineHeight);
    const size = Math.min(maxFontSize, byWidth, byHeight);
    if (size > best.size) best = { lines, size };
  }

  const lines = best.lines.map((l, i) => (
    <span key={i} style={{ whiteSpace: "nowrap" }}>
      {l}
    </span>
  ));

  return (
    <div
      style={{
        ...zoneStyle(zone),
        display: "flex",
        flexDirection: "column",
        alignItems: justify,
        justifyContent: align,
        overflow: box ? "visible" : "hidden",
        ...style,
        fontSize: best.size,
        lineHeight,
      }}
    >
      {box ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems:
              boxTextAlign === "center"
                ? "center"
                : boxTextAlign === "right"
                  ? "flex-end"
                  : "flex-start",
            justifyContent: "center",
            boxSizing: "border-box",
            ...box,
          }}
        >
          {lines}
        </div>
      ) : (
        lines
      )}
    </div>
  );
}
