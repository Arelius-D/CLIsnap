import * as vscode from "vscode";
import { captureSelection, Capture } from "./capture";
import { buildState, currentHtml, currentSvg, save, showCapture } from "./panel";
import { captureFromFile } from "./fromFile";
import { invalidateThemeCache } from "./themeService";
import { readPreferences } from "./settings";

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.extensions.onDidChange(() => invalidateThemeCache()),

    vscode.commands.registerCommand("clisnap.capture", async () => {
      const capture = await run();
      if (capture) {
        showCapture(context.extensionUri, capture);
      }
    }),

    vscode.commands.registerCommand("clisnap.captureAndSave", async () => {
      const capture = await run();
      if (!capture) {
        return;
      }

      const { format } = readPreferences();
      if (format === "png") {
        showCapture(context.extensionUri, capture, "png");
        return;
      }

      const state = buildState(capture);
      const content = format === "html" ? currentHtml(state) : currentSvg(state);
      await save(
        Buffer.from(content, "utf8"),
        format,
        format === "html" ? "HTML document" : "SVG image"
      );
    }),

    vscode.commands.registerCommand("clisnap.captureFromFile", async () => {
      const capture = await captureFromFile();
      if (capture) {
        showCapture(context.extensionUri, capture);
      }
    })
  );
}

async function run(): Promise<Capture | undefined> {
  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Window,
      title: "CLIsnap: capturing terminal selection",
    },
    () => captureSelection()
  );
}

export function deactivate(): void {
}
