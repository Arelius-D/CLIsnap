import { ChromeColors } from "./themes";

export type ChromeStyle = "windows" | "macos" | "linux" | "none";

export interface ChromeSpec {
  style: ChromeStyle;
  height: number;
  radius: number;
}

export interface ChromeOptions extends ChromeColors {
  title: string;
  width: number;
}

export function detectChromeStyle(
  platform: string,
  remoteName?: string
): ChromeStyle {
  if (remoteName) {
    return "linux";
  }
  switch (platform) {
    case "win32":
      return "windows";
    case "darwin":
      return "macos";
    default:
      return "linux";
  }
}

export function chromeSpec(style: ChromeStyle): ChromeSpec {
  switch (style) {
    case "windows":
      return { style, height: 32, radius: 8 };
    case "macos":
      return { style, height: 28, radius: 10 };
    case "linux":
      return { style, height: 34, radius: 12 };
    default:
      return { style, height: 0, radius: 0 };
  }
}

export function renderChrome(
  spec: ChromeSpec,
  options: ChromeOptions
): string {
  if (spec.style === "none" || spec.height === 0) {
    return "";
  }

  const { width, titleBarBackground: bg, titleBarForeground: fg } = options;
  const mid = spec.height / 2;

  const bar =
    `<path d="M0 ${spec.radius} A ${spec.radius} ${spec.radius} 0 0 1 ${spec.radius} 0 ` +
    `L ${r(width - spec.radius)} 0 A ${spec.radius} ${spec.radius} 0 0 1 ${r(width)} ${spec.radius} ` +
    `L ${r(width)} ${spec.height} L 0 ${spec.height} Z" fill="${bg}"/>`;

  const title = (x: number, anchor: string) =>
    options.title
      ? `<text x="${x}" y="${mid}" fill="${fg}" font-size="12" opacity="0.75" ` +
        `text-anchor="${anchor}" dominant-baseline="central">${escapeXml(options.title)}</text>`
      : "";

  switch (spec.style) {
    case "macos": {
      const dots = ["#ff5f57", "#febc2e", "#28c840"]
        .map((c, i) => `<circle cx="${20 + i * 20}" cy="${mid}" r="6" fill="${c}"/>`)
        .join("");
      return bar + dots + title(r(width / 2), "middle");
    }

    case "windows": {
      const stroke = `stroke="${fg}" stroke-width="1" fill="none" opacity="0.9"`;
      const slot = (n: number) => r(width - 23 - 46 * (n - 1));
      const close = slot(1);
      const buttons =
        `<line x1="${r(slot(3) - 5)}" y1="${mid}" x2="${r(slot(3) + 5)}" y2="${mid}" ${stroke}/>` +
        `<rect x="${r(slot(2) - 5)}" y="${mid - 5}" width="10" height="10" ${stroke}/>` +
        `<path d="M${r(close - 5)} ${mid - 5} L${r(close + 5)} ${mid + 5} M${r(close + 5)} ${mid - 5} L${r(close - 5)} ${mid + 5}" ${stroke}/>`;
      return bar + title(16, "start") + buttons;
    }

    default: {
      const close =
        `<circle cx="${r(width - 24)}" cy="${mid}" r="11" fill="${fg}" opacity="0.12"/>` +
        `<path d="M${r(width - 29)} ${mid - 5} L${r(width - 19)} ${mid + 5} M${r(width - 19)} ${mid - 5} L${r(width - 29)} ${mid + 5}" ` +
        `stroke="${fg}" stroke-width="1.5" fill="none" opacity="0.85"/>`;
      return bar + title(r(width / 2), "middle") + close;
    }
  }
}

function r(value: number): number {
  return Math.round(value * 100) / 100;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
