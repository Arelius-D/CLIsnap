import * as vscode from "vscode";
import { ChromeStyle, detectChromeStyle } from "./chrome";

export type FrameSetting = ChromeStyle | "auto";

export type OutputFormat = "svg" | "html" | "png";

export interface Preferences {
  frame: FrameSetting;
  fontSize: number;
  themeKey: string;
  format: OutputFormat;
}

const SECTION = "clisnap";

export function readPreferences(): Preferences {
  const config = vscode.workspace.getConfiguration(SECTION);
  return {
    frame: config.get<FrameSetting>("frame", "auto"),
    fontSize: config.get<number>("fontSize", 14),
    themeKey: config.get<string>("theme", ""),
    format: config.get<OutputFormat>("format", "svg"),
  };
}

export function resolveFrame(frame: FrameSetting): ChromeStyle {
  return frame === "auto" ? detectChromeStyle(process.platform) : frame;
}

export async function writePreference<K extends keyof Preferences>(
  key: K,
  value: Preferences[K]
): Promise<void> {
  const name = key === "themeKey" ? "theme" : key;
  await vscode.workspace
    .getConfiguration(SECTION)
    .update(name, value, vscode.ConfigurationTarget.Global);
}

export async function clearPreferences(): Promise<void> {
  const config = vscode.workspace.getConfiguration(SECTION);
  for (const name of ["frame", "fontSize", "theme", "format"]) {
    await config.update(name, undefined, vscode.ConfigurationTarget.Global);
  }
}
