import { TerminalPalette } from "./palette";

export type ThemeKind = "light" | "dark" | "hcDark" | "hcLight";

export interface ThemeRef {
  label: string;
  contributedId?: string;
  extensionId: string;
  kind: ThemeKind;
  path: string;
  extensionPath?: string;
}

export function themeKey(theme: ThemeRef): string {
  return `${theme.extensionId}/${theme.contributedId ?? theme.label}`;
}

export function findBySetting(
  themes: ThemeRef[],
  setting: string | undefined
): { theme?: ThemeRef; candidates: ThemeRef[] } {
  if (!setting) {
    return { candidates: [] };
  }
  const candidates = themes.filter(
    (t) => t.contributedId === setting || t.label === setting
  );
  return { theme: candidates[0], candidates };
}

export type ReadFile = (path: string) => string;

export function uiThemeToKind(uiTheme: string | undefined): ThemeKind {
  switch (uiTheme) {
    case "vs":
      return "light";
    case "hc-black":
      return "hcDark";
    case "hc-light":
      return "hcLight";
    default:
      return "dark";
  }
}

const ANSI_DEFAULTS: Record<ThemeKind, string>[] = [
  { light: "#000000", dark: "#000000", hcDark: "#000000", hcLight: "#292929" },
  { light: "#cd3131", dark: "#cd3131", hcDark: "#cd0000", hcLight: "#cd3131" },
  { light: "#107C10", dark: "#0DBC79", hcDark: "#00cd00", hcLight: "#136C13" },
  { light: "#949800", dark: "#e5e510", hcDark: "#cdcd00", hcLight: "#949800" },
  { light: "#0451a5", dark: "#2472c8", hcDark: "#0000ee", hcLight: "#0451a5" },
  { light: "#bc05bc", dark: "#bc3fbc", hcDark: "#cd00cd", hcLight: "#bc05bc" },
  { light: "#0598bc", dark: "#11a8cd", hcDark: "#00cdcd", hcLight: "#0598bc" },
  { light: "#555555", dark: "#e5e5e5", hcDark: "#e5e5e5", hcLight: "#555555" },
  { light: "#666666", dark: "#666666", hcDark: "#7f7f7f", hcLight: "#666666" },
  { light: "#cd3131", dark: "#f14c4c", hcDark: "#ff0000", hcLight: "#cd3131" },
  { light: "#14CE14", dark: "#23d18b", hcDark: "#00ff00", hcLight: "#00bc00" },
  { light: "#b5ba00", dark: "#f5f543", hcDark: "#ffff00", hcLight: "#b5ba00" },
  { light: "#0451a5", dark: "#3b8eea", hcDark: "#5c5cff", hcLight: "#0451a5" },
  { light: "#bc05bc", dark: "#d670d6", hcDark: "#ff00ff", hcLight: "#bc05bc" },
  { light: "#0598bc", dark: "#29b8db", hcDark: "#00ffff", hcLight: "#0598bc" },
  { light: "#a5a5a5", dark: "#e5e5e5", hcDark: "#ffffff", hcLight: "#a5a5a5" },
];

const FOREGROUND_DEFAULTS: Record<ThemeKind, string> = {
  light: "#333333",
  dark: "#CCCCCC",
  hcDark: "#FFFFFF",
  hcLight: "#292929",
};

const BACKGROUND_DEFAULTS: Record<ThemeKind, string> = {
  light: "#FFFFFF",
  dark: "#1E1E1E",
  hcDark: "#000000",
  hcLight: "#FFFFFF",
};

const ANSI_KEYS = [
  "terminal.ansiBlack", "terminal.ansiRed", "terminal.ansiGreen",
  "terminal.ansiYellow", "terminal.ansiBlue", "terminal.ansiMagenta",
  "terminal.ansiCyan", "terminal.ansiWhite",
  "terminal.ansiBrightBlack", "terminal.ansiBrightRed", "terminal.ansiBrightGreen",
  "terminal.ansiBrightYellow", "terminal.ansiBrightBlue", "terminal.ansiBrightMagenta",
  "terminal.ansiBrightCyan", "terminal.ansiBrightWhite",
];

export interface ChromeColors {
  titleBarBackground: string;
  titleBarForeground: string;
}

const TITLEBAR_BG_DEFAULTS: Record<ThemeKind, string> = {
  light: "#DDDDDD",
  dark: "#3C3C3C",
  hcDark: "#000000",
  hcLight: "#FFFFFF",
};

export function resolveChromeColors(
  colors: Record<string, string>,
  kind: ThemeKind
): ChromeColors {
  return {
    titleBarBackground:
      colors["titleBar.activeBackground"] ??
      colors["editorGroupHeader.tabsBackground"] ??
      TITLEBAR_BG_DEFAULTS[kind],
    titleBarForeground:
      colors["titleBar.activeForeground"] ??
      colors["editor.foreground"] ??
      FOREGROUND_DEFAULTS[kind],
  };
}

export function resolvePalette(
  colors: Record<string, string>,
  kind: ThemeKind
): TerminalPalette {
  return {
    background:
      colors["terminal.background"] ??
      colors["panel.background"] ??
      colors["editor.background"] ??
      BACKGROUND_DEFAULTS[kind],
    foreground:
      colors["terminal.foreground"] ??
      colors["editor.foreground"] ??
      FOREGROUND_DEFAULTS[kind],
    ansi: ANSI_KEYS.map(
      (key, index) => colors[key] ?? ANSI_DEFAULTS[index][kind]
    ),
  };
}

export function loadThemeColors(
  file: string,
  readFile: ReadFile,
  resolvePath: (from: string, to: string) => string,
  depth = 0
): Record<string, string> {
  if (depth > 6) {
    return {};
  }
  const data = parseJsonc(readFile(file)) as {
    include?: string;
    colors?: Record<string, string>;
  };
  const base = data.include
    ? loadThemeColors(resolvePath(file, data.include), readFile, resolvePath, depth + 1)
    : {};
  return { ...base, ...(data.colors ?? {}) };
}

export function resolveLabel(
  label: string,
  extensionPath: string | undefined,
  readFile: ReadFile,
  join: (...parts: string[]) => string
): string {
  const key = /^%(.+)%$/.exec(label)?.[1];
  if (!key || !extensionPath) {
    return label;
  }
  try {
    const nls = JSON.parse(readFile(join(extensionPath, "package.nls.json")));
    const value = nls[key];
    return typeof value === "string" ? value : value?.message ?? label;
  } catch {
    return label;
  }
}

export function parseJsonc(text: string): unknown {
  let out = "";
  let inString = false;
  let escaped = false;
  let i = 0;

  const body = text.replace(/^﻿/, "");
  while (i < body.length) {
    const char = body[i];
    const next = body[i + 1];

    if (inString) {
      out += char;
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      i++;
      continue;
    }
    if (char === '"') {
      inString = true;
      out += char;
      i++;
      continue;
    }
    if (char === "/" && next === "/") {
      while (i < body.length && body[i] !== "\n") {
        i++;
      }
      continue;
    }
    if (char === "/" && next === "*") {
      i += 2;
      while (i < body.length && !(body[i] === "*" && body[i + 1] === "/")) {
        i++;
      }
      i += 2;
      continue;
    }
    out += char;
    i++;
  }

  return JSON.parse(out.replace(/,(\s*[}\]])/g, "$1"));
}
