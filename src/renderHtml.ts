import { Row, RunStyle } from "./captureModel";
import { ChromeSpec, ChromeOptions, renderChrome } from "./chrome";
import { textWidth } from "./textWidth";

export interface HtmlOptions {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  advanceRatio: number;
  padding: number;
  background: string;
  foreground: string;
  title: string;
  chrome?: {
    spec: ChromeSpec;
    colors: Omit<ChromeOptions, "width">;
  };
}

export function renderHtml(rows: Row[], options: HtmlOptions): string {
  const classNames = new Map<string, string>();
  const cell = options.fontSize * options.advanceRatio;

  const columns = Math.max(
    0,
    ...rows.map((row) => row.runs.reduce((n, r) => n + textWidth(r.text), 0))
  );
  const width = Math.round(columns * cell + options.padding * 2);

  const body = rows
    .map((row) => {
      if (!row.runs.length) {
        return `<div class="r"></div>`;
      }
      const spans = row.runs
        .map((run) => {
          const cls = classFor(run.style);
          const text = escapeHtml(run.text);
          return cls ? `<span class="${cls}">${text}</span>` : text;
        })
        .join("");
      return `<div class="r">${spans}</div>`;
    })
    .join("\n");

  const rules = [...classNames.entries()]
    .map(([declarations, name]) => `.${name}{${declarations}}`)
    .join("\n");

  const chrome = options.chrome
    ? `<svg class="chrome" xmlns="http://www.w3.org/2000/svg" width="${width}" height="${options.chrome.spec.height}" viewBox="0 0 ${width} ${options.chrome.spec.height}">` +
      renderChrome(options.chrome.spec, { ...options.chrome.colors, width }) +
      `</svg>`
    : "";

  const radius = options.chrome?.spec.radius ?? 0;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(options.title)}</title>
<style>
.clisnap{
  display:inline-block;
  border-radius:${radius}px;
  overflow:hidden;
  background:${options.background};
  box-shadow:0 18px 60px rgba(0,0,0,.45);
}
.clisnap .chrome{display:block}
.clisnap .body{
  padding:${options.padding}px;
  font-family:${cssFontFamily(options.fontFamily)};
  font-size:${options.fontSize}px;
  line-height:${options.lineHeight};
  color:${options.foreground};
  white-space:pre;
  tab-size:4;
}
.clisnap .r{min-height:${options.lineHeight}em}
${rules}
</style>
</head>
<body>
<div class="clisnap">
${chrome}
<div class="body">
${body}
</div>
</div>
</body>
</html>`;

  function classFor(style: RunStyle): string | undefined {
    const declarations = declarationsFor(style);
    if (!declarations) {
      return undefined;
    }
    let name = classNames.get(declarations);
    if (!name) {
      name = `c${classNames.size}`;
      classNames.set(declarations, name);
    }
    return name;
  }
}

function declarationsFor(style: RunStyle): string {
  const parts: string[] = [];
  if (style.fg) {
    parts.push(`color:${style.fg}`);
  }
  if (style.bg) {
    parts.push(`background-color:${style.bg}`);
  }
  if (style.bold) {
    parts.push("font-weight:bold");
  }
  if (style.italic) {
    parts.push("font-style:italic");
  }
  if (style.underline || style.strike) {
    const decoration = [
      style.underline ? "underline" : "",
      style.strike ? "line-through" : "",
    ]
      .filter(Boolean)
      .join(" ");
    parts.push(`text-decoration:${decoration}`);
  }
  if (style.opacity !== undefined) {
    parts.push(`opacity:${style.opacity}`);
  }
  return parts.join(";");
}

function cssFontFamily(list: string): string {
  return list
    .split(",")
    .map((name) => name.trim().replace(/["'\\<>{};]/g, ""))
    .filter(Boolean)
    .map((name) => (/^[A-Za-z][A-Za-z0-9-]*$/.test(name) ? name : `"${name}"`))
    .join(", ");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
