import * as vscode from "vscode";

const FONT_SETTINGS = [
  "terminal.integrated.fontFamily",
  "editor.fontFamily",
  "debug.console.fontFamily",
  "notebook.output.fontFamily",
  "markdown.preview.fontFamily",
  "scm.inputFontFamily",
  "chat.editor.fontFamily",
];

const GENERIC = new Set([
  "monospace",
  "sans-serif",
  "serif",
  "cursive",
  "fantasy",
  "system-ui",
  "ui-monospace",
  "ui-sans-serif",
  "ui-serif",
  "ui-rounded",
]);

export function splitFamilies(list: string): string[] {
  return list
    .split(",")
    .map((name) => name.trim().replace(/^["']|["']$/g, "").trim())
    .filter(Boolean);
}

export function listFontFamilies(): string[] {
  const found = new Map<string, string>();
  for (const setting of FONT_SETTINGS) {
    const dot = setting.lastIndexOf(".");
    const value = vscode.workspace
      .getConfiguration(setting.slice(0, dot))
      .get(setting.slice(dot + 1));
    if (typeof value !== "string") {
      continue;
    }
    for (const name of splitFamilies(value)) {
      const key = name.toLowerCase();
      if (!GENERIC.has(key) && !found.has(key)) {
        found.set(key, name);
      }
    }
  }
  return [...found.values()];
}

export function fontOptions(captured?: string, chosen?: string): string[] {
  const options = listFontFamilies();
  const known = new Set(options.map((name) => name.toLowerCase()));

  for (const extra of [captured, chosen]) {
    for (const name of extra ? splitFamilies(extra) : []) {
      if (!GENERIC.has(name.toLowerCase()) && !known.has(name.toLowerCase())) {
        known.add(name.toLowerCase());
        options.push(name);
      }
    }
  }

  if (chosen && chosen.trim() && !known.has(chosen.trim().toLowerCase())) {
    options.push(chosen.trim());
  }
  return options;
}
