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
}: FitTextProps) {
  let best = { lines: [text], size: 0 };

  for (let n = 1; n <= maxLines; n++) {
    const lines = balanceLines(text, n);
    if (lines.length !== n && n > 1) continue;
    const longest = Math.max(...lines.map((l) => l.length), 1);
    const byWidth = zone.width / (longest * charRatio);
    const byHeight = zone.height / (lines.length * lineHeight);
    const size = Math.min(maxFontSize, byWidth, byHeight);
    if (size > best.size) best = { lines, size };
  }

  return (
    <div
      style={{
        ...zoneStyle(zone),
        display: "flex",
        flexDirection: "column",
        alignItems: justify,
        justifyContent: align,
        overflow: "hidden",
        ...style,
        fontSize: best.size,
        lineHeight,
      }}
    >
      {best.lines.map((l, i) => (
        <span key={i} style={{ whiteSpace: "nowrap" }}>
          {l}
        </span>
      ))}
    </div>
  );
}
