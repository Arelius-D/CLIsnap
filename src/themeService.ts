import * as vscode from "vscode";
import { readFileSync } from "fs";
import { dirname, join, resolve } from "path";
import {
  ThemeRef,
  findBySetting,
  loadThemeColors,
  resolveChromeColors,
  resolveLabel,
  resolvePalette,
  themeKey,
  uiThemeToKind,
  ChromeColors,
} from "./themes";
import { TerminalPalette } from "./palette";

const read = (path: string) => readFileSync(path, "utf8");
const resolveFrom = (from: string, to: string) => resolve(dirname(from), to);

interface ThemeContribution {
  id?: string;
  label?: string;
  uiTheme?: string;
  path: string;
}

let themeCache: ThemeRef[] | undefined;
const colorCache = new Map<string, Record<string, string>>();

export function invalidateThemeCache(): void {
  themeCache = undefined;
  colorCache.clear();
}

export function listThemes(): ThemeRef[] {
  if (themeCache) {
    return themeCache;
  }
  const themes: ThemeRef[] = [];

  for (const extension of vscode.extensions.all) {
    const contributions: ThemeContribution[] =
      extension.packageJSON?.contributes?.themes ?? [];
    const extensionPath = extension.extensionUri.fsPath;

    for (const contribution of contributions) {
      themes.push({
        label: resolveLabel(
          contribution.label ?? contribution.id ?? "(unnamed)",
          extensionPath,
          read,
          join
        ),
        contributedId: contribution.id,
        extensionId: extension.id,
        kind: uiThemeToKind(contribution.uiTheme),
        path: resolve(extensionPath, contribution.path),
        extensionPath,
      });
    }
  }

  themeCache = themes.sort((a, b) => a.label.localeCompare(b.label));
  return themeCache;
}

export function activeTheme(themes: ThemeRef[]): {
  theme?: ThemeRef;
  ambiguous: boolean;
} {
  const setting = vscode.workspace
    .getConfiguration("workbench")
    .get<string>("colorTheme");
  const { theme, candidates } = findBySetting(themes, setting);
  return { theme, ambiguous: candidates.length > 1 };
}

export function findByKey(
  themes: ThemeRef[],
  key: string
): ThemeRef | undefined {
  return themes.find((theme) => themeKey(theme) === key);
}

export function paletteOf(theme: ThemeRef): TerminalPalette {
  return resolvePalette(colorsOf(theme), theme.kind);
}

export function chromeColorsOf(theme: ThemeRef): ChromeColors {
  return resolveChromeColors(colorsOf(theme), theme.kind);
}

function colorsOf(theme: ThemeRef): Record<string, string> {
  const cached = colorCache.get(theme.path);
  if (cached) {
    return cached;
  }
  let colors: Record<string, string>;
  try {
    colors = loadThemeColors(theme.path, read, resolveFrom);
  } catch {
    colors = {};
  }
  colorCache.set(theme.path, colors);
  return colors;
}

export { themeKey };
