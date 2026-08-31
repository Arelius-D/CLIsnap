import * as vscode from "vscode";
import { homedir, tmpdir } from "os";
import { Row, captureFont, parseCapture, CaptureFont } from "./captureModel";
import { applyPalette, remapPalette, TerminalPalette } from "./palette";
import { renderSvg, DEFAULT_SVG_OPTIONS } from "./renderSvg";
import { renderHtml } from "./renderHtml";
import { ChromeStyle, chromeSpec, detectChromeStyle } from "./chrome";
import { ThemeRef, ChromeColors } from "./themes";
import {
  activeTheme,
  chromeColorsOf,
  findByKey,
  listThemes,
  paletteOf,
  themeKey,
} from "./themeService";
import { Capture } from "./capture";
import {
  clearPreferences,
  readPreferences,
  resolveFrame,
  writePreference,
} from "./settings";

export interface PanelState {
  rows: Row[];
  text: string;
  font: CaptureFont;
  sourceTheme?: ThemeRef;
  sourcePalette: TerminalPalette;
  targetKey?: string;
  chromeStyle: ChromeStyle;
  fontSize: number;
  showChrome: boolean;
  title: string;
}

let panel: vscode.WebviewPanel | undefined;
let state: PanelState | undefined;

export function buildState(capture: Capture): PanelState {
  const themes = listThemes();
  const { theme: source, ambiguous } = activeTheme(themes);
  if (ambiguous) {
    vscode.window.showInformationMessage(
      "CLIsnap: more than one installed theme matches your active theme name; using the first."
    );
  }

  const sourcePalette = source
    ? paletteOf(source)
    : { background: "#1E1E1E", foreground: "#CCCCCC", ansi: [] };

  const prefs = readPreferences();

  return {
    rows: applyPalette(parseCapture(capture.fragment), sourcePalette),
    text: capture.text,
    font: captureFont(capture.fragment),
    sourceTheme: source,
    sourcePalette,
    targetKey: prefs.themeKey || (source ? themeKey(source) : undefined),
    chromeStyle: resolveFrame(prefs.frame === "none" ? "windows" : prefs.frame),
    fontSize: prefs.fontSize,
    showChrome: prefs.frame !== "none",
    title: capture.terminalName?.trim() || "Terminal",
  };
}

export function showCapture(
  extensionUri: vscode.Uri,
  capture: Capture,
  autoSave?: "png"
): void {
  state = buildState(capture);

  if (!panel) {
    panel = vscode.window.createWebviewPanel(
      "clisnap.preview",
      "CLIsnap",
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, "media")],
      }
    );
    panel.onDidDispose(() => {
      panel = undefined;
      state = undefined;
    });
    panel.webview.onDidReceiveMessage((message) => handleMessage(message));
    panel.webview.html = pageHtml(panel.webview, extensionUri, listThemes());
  } else {
    panel.reveal(vscode.ViewColumn.Beside);
  }

  postRender();

  if (autoSave === "png") {
    panel.webview.postMessage({ type: "rasterise" });
  }
}

function renderInputs(from?: PanelState) {
  const s = from ?? state;
  if (!s) {
    return undefined;
  }
  const themes = listThemes();
  const target = s.targetKey ? findByKey(themes, s.targetKey) : undefined;

  let rows = s.rows;
  let palette = s.sourcePalette;
  let chromeColors: ChromeColors = s.sourceTheme
    ? chromeColorsOf(s.sourceTheme)
    : { titleBarBackground: "#3C3C3C", titleBarForeground: "#CCCCCC" };

  if (target && s.sourceTheme && themeKey(target) !== themeKey(s.sourceTheme)) {
    palette = paletteOf(target);
    rows = remapPalette(rows, s.sourcePalette, palette);
    chromeColors = chromeColorsOf(target);
  } else if (target) {
    palette = paletteOf(target);
    chromeColors = chromeColorsOf(target);
  }

  const fontFamily = s.font.family
    ? `${s.font.family}, ${DEFAULT_SVG_OPTIONS.fontFamily}`
    : DEFAULT_SVG_OPTIONS.fontFamily;

  return {
    rows,
    fontFamily,
    fontSize: s.fontSize,
    background: palette.background,
    foreground: palette.foreground,
    chrome: s.showChrome
      ? {
          spec: chromeSpec(s.chromeStyle),
          colors: { ...chromeColors, title: s.title },
        }
      : undefined,
  };
}

export function currentSvg(from?: PanelState): string {
  const input = renderInputs(from);
  if (!input) {
    return "";
  }
  return renderSvg(input.rows, {
    ...DEFAULT_SVG_OPTIONS,
    fontFamily: input.fontFamily,
    fontSize: input.fontSize,
    background: input.background,
    foreground: input.foreground,
    chrome: input.chrome,
  });
}

export function currentHtml(from?: PanelState): string {
  const input = renderInputs(from);
  if (!input) {
    return "";
  }
  return renderHtml(input.rows, {
    fontFamily: input.fontFamily,
    fontSize: input.fontSize,
    lineHeight: DEFAULT_SVG_OPTIONS.lineHeight,
    advanceRatio: DEFAULT_SVG_OPTIONS.advanceRatio,
    padding: DEFAULT_SVG_OPTIONS.padding,
    background: input.background,
    foreground: input.foreground,
    title: (from ?? state)?.title ?? "CLIsnap",
    chrome: input.chrome,
  });
}

function postRender(): void {
  if (!panel || !state) {
    return;
  }
  panel.webview.postMessage({
    type: "render",
    svg: currentSvg(),
    state: {
      targetKey: state.targetKey,
      chromeStyle: state.chromeStyle,
      fontSize: state.fontSize,
      showChrome: state.showChrome,
      font: state.font.family ?? "(terminal font not reported)",
      rows: state.rows.length,
      defaults: {
        themeKey: state.sourceTheme ? themeKey(state.sourceTheme) : undefined,
        chromeStyle: detectChromeStyle(process.platform, vscode.env.remoteName),
        fontSize: DEFAULT_SVG_OPTIONS.fontSize,
      },
    },
  });
}

async function handleMessage(message: {
  type: string;
  value?: string | number | boolean;
  dataUrl?: string;
}): Promise<void> {
  if (!state) {
    return;
  }

  switch (message.type) {
    case "setTheme":
      state.targetKey = String(message.value);
      postRender();
      await writePreference(
        "themeKey",
        state.sourceTheme && state.targetKey === themeKey(state.sourceTheme)
          ? ""
          : state.targetKey ?? ""
      );
      break;
    case "setChrome":
      state.chromeStyle = String(message.value) as ChromeStyle;
      postRender();
      await writePreference("frame", state.chromeStyle);
      break;
    case "setShowChrome":
      state.showChrome = Boolean(message.value);
      postRender();
      await writePreference("frame", state.showChrome ? state.chromeStyle : "none");
      break;
    case "setFontSize":
      state.fontSize = Number(message.value);
      postRender();
      break;
    case "commitFontSize":
      await writePreference("fontSize", Number(message.value));
      break;
    case "reset":
      state.targetKey = state.sourceTheme
        ? themeKey(state.sourceTheme)
        : undefined;
      state.chromeStyle = detectChromeStyle(process.platform, vscode.env.remoteName);
      state.fontSize = DEFAULT_SVG_OPTIONS.fontSize;
      state.showChrome = true;
      postRender();
      await clearPreferences();
      break;
    case "saveHtml":
      await save(Buffer.from(currentHtml(), "utf8"), "html", "HTML document");
      break;
    case "saveSvg":
      await save(Buffer.from(currentSvg(), "utf8"), "svg", "SVG image");
      break;
    case "savePng":
      if (message.dataUrl) {
        const base64 = message.dataUrl.replace(/^data:image\/png;base64,/, "");
        await save(Buffer.from(base64, "base64"), "png", "PNG image");
      }
      break;
    case "copyText":
      await vscode.env.clipboard.writeText(state.text);
      vscode.window.showInformationMessage("CLIsnap: text copied.");
      break;
  }
}

function defaultFolder(): vscode.Uri {
  const workspace = vscode.workspace.workspaceFolders?.[0]?.uri;
  if (workspace) {
    return workspace;
  }
  const home = homedir();
  return home ? vscode.Uri.file(home) : vscode.Uri.file(tmpdir());
}

export async function save(
  data: Buffer,
  extension: string,
  label: string
): Promise<void> {
  const uri = await vscode.window.showSaveDialog({
    defaultUri: vscode.Uri.joinPath(defaultFolder(), `clisnap.${extension}`),
    filters: { [label]: [extension] },
  });
  if (!uri) {
    return;
  }
  await vscode.workspace.fs.writeFile(uri, data);
  vscode.window.showInformationMessage(`CLIsnap: saved ${uri.fsPath}`);
}

function pageHtml(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  themes: ThemeRef[]
): string {
  const styleUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "media", "panel.css")
  );
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "media", "panel.js")
  );
  const nonce = makeNonce();

  const options = themes
    .map(
      (theme) =>
        `<option value="${escapeHtml(themeKey(theme))}">${escapeHtml(theme.label)}</option>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} data: blob:;">
<link href="${styleUri}" rel="stylesheet">
<title>CLIsnap</title>
</head>
<body>
<div class="toolbar">
  <div class="row">
    <label>Theme <select id="theme">${options}</select></label>
    <label>Frame
      <select id="chrome">
        <option value="windows">Windows</option>
        <option value="macos">macOS</option>
        <option value="linux">Linux</option>
      </select>
    </label>
    <label><input type="checkbox" id="show-chrome" checked> Window frame</label>
  </div>
  <div class="row">
    <label>Size
      <input type="range" id="font-size" min="8" max="32" step="1">
      <span id="font-size-value" class="num"></span>px
    </label>
    <button id="reset" title="Back to the theme and frame this capture was taken with">Reset</button>
    <button id="copy-text">Copy text</button>
    <span class="spacer"></span>
    <button id="save-svg" class="primary">Save SVG</button>
    <button id="save-png">Save PNG</button>
    <button id="save-html">Save HTML</button>
  </div>
</div>
<div class="meta" id="meta"></div>
<div class="preview" id="preview"></div>
<script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}

function makeNonce(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let nonce = "";
  for (let i = 0; i < 32; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
