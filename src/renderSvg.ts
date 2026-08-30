import { Row, RunStyle } from "./captureModel";
import { ChromeSpec, ChromeOptions, renderChrome } from "./chrome";
import { textWidth } from "./textWidth";

export interface SvgOptions {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  advanceRatio: number;
  padding: number;
  background: string;
  foreground: string;
  chrome?: {
    spec: ChromeSpec;
    colors: Omit<ChromeOptions, "width">;
  };
}

export const DEFAULT_SVG_OPTIONS: SvgOptions = {
  fontFamily:
    "'Cascadia Mono', Consolas, 'JetBrains Mono', 'SF Mono', Menlo, monospace",
  fontSize: 14,
  lineHeight: 1.5,
  advanceRatio: 0.6,
  padding: 16,
  background: "#1e1e1e",
  foreground: "#cccccc",
};

export function renderSvg(rows: Row[], options: SvgOptions): string {
  const { fontSize, lineHeight, advanceRatio, padding } = options;
  const cell = fontSize * advanceRatio;
  const line = fontSize * lineHeight;

  const columns = Math.max(
    0,
    ...rows.map((row) => row.runs.reduce((n, r) => n + textWidth(r.text), 0))
  );
  const chromeSpec = options.chrome?.spec;
  const barHeight = chromeSpec?.height ?? 0;
  const radius = chromeSpec?.radius ?? 0;

  const minWidth = barHeight ? 260 : 0;
  const width = round(
    Math.max(minWidth, columns * cell + padding * 2)
  );
  const bodyHeight = round(rows.length * line + padding * 2);
  const height = round(bodyHeight + barHeight);

  const backgrounds: string[] = [];
  const texts: string[] = [];

  rows.forEach((row, index) => {
    const baseline = round(barHeight + padding + index * line + fontSize);
    const boxTop = round(barHeight + padding + index * line);
    let column = 0;
    const spans: string[] = [];

    for (const run of row.runs) {
      const x = round(padding + column * cell);
      const cells = textWidth(run.text);
      const span = cells * cell;

      if (run.style.bg) {
        backgrounds.push(
          `<rect x="${x}" y="${boxTop}" width="${round(span)}" height="${round(line)}" fill="${run.style.bg}"/>`
        );
      }
      spans.push(
        `<tspan x="${x}" textLength="${round(span)}" lengthAdjust="spacing"${styleAttrs(run.style)}>${escapeXml(run.text)}</tspan>`
      );
      column += cells;
    }

    if (spans.length) {
      texts.push(
        `<text y="${baseline}" xml:space="preserve">${spans.join("")}</text>`
      );
    }
  });

  const clip = radius
    ? `<defs><clipPath id="win"><rect width="${width}" height="${height}" rx="${radius}" ry="${radius}"/></clipPath></defs>`
    : "";
  const open = radius ? `<g clip-path="url(#win)">` : "<g>";

  const chrome = options.chrome
    ? renderChrome(options.chrome.spec, { ...options.chrome.colors, width })
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="${escapeXml(options.fontFamily)}" font-size="${fontSize}" fill="${options.foreground}">
${clip}${open}
<rect y="${barHeight}" width="${width}" height="${round(bodyHeight)}" fill="${options.background}"/>
${backgrounds.join("\n")}
${texts.join("\n")}
${chrome}
</g>
</svg>`;
}

function styleAttrs(style: RunStyle): string {
  const attrs: string[] = [];
  if (style.fg) {
    attrs.push(`fill="${style.fg}"`);
  }
  if (style.bold) {
    attrs.push(`font-weight="bold"`);
  }
  if (style.italic) {
    attrs.push(`font-style="italic"`);
  }
  if (style.underline || style.strike) {
    const decoration = [
      style.underline ? "underline" : "",
      style.strike ? "line-through" : "",
    ]
      .filter(Boolean)
      .join(" ");
    attrs.push(`text-decoration="${decoration}"`);
  }
  if (style.opacity !== undefined) {
    attrs.push(`opacity="${style.opacity}"`);
  }
  return attrs.length ? " " + attrs.join(" ") : "";
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
