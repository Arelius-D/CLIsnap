import * as vscode from "vscode";
import { readClipboardHtml, extractTerminalFragment } from "./clipboardHtml";

const SENTINEL = "clisnap-capture-sentinel";

export interface Capture {
  fragment: string;
  text: string;
  terminalName?: string;
}

export async function captureSelection(): Promise<Capture | undefined> {
  const terminalName = vscode.window.activeTerminal?.name;
  const previous = await vscode.env.clipboard.readText();
  await vscode.env.clipboard.writeText(SENTINEL);

  try {
    await vscode.commands.executeCommand(
      "workbench.action.terminal.copySelectionAsHtml"
    );

    const text = await waitForClipboard();
    if (text === SENTINEL) {
      vscode.window.showWarningMessage(
        "CLIsnap: nothing selected. Select text in the terminal first."
      );
      return undefined;
    }

    const raw = await readClipboardHtml();
    const problem = validateSource(raw);
    if (problem) {
      vscode.window.showWarningMessage(`CLIsnap: ${problem}`);
      return undefined;
    }

    const fragment = extractTerminalFragment(raw);
    if (!fragment) {
      vscode.window.showWarningMessage(
        "CLIsnap: the clipboard has no terminal markup. Select text in the terminal and try again."
      );
      return undefined;
    }

    return { fragment, text, terminalName };
  } finally {
    await vscode.env.clipboard.writeText(previous);
  }
}

function validateSource(raw: string | undefined): string | undefined {
  if (!raw) {
    return "could not read the clipboard's HTML. Is the selection in the terminal?";
  }
  if (/SourceURL:\s*vscode-webview:\/\//i.test(raw)) {
    return "that selection came from a panel, not the terminal. Select in the terminal itself.";
  }
  if (!/<div style='[^']*font-family/i.test(raw)) {
    return "that does not look like terminal output. Select in the terminal and try again.";
  }
  return undefined;
}

async function waitForClipboard(): Promise<string> {
  const deadline = Date.now() + 600;
  let text = await vscode.env.clipboard.readText();
  while (text === SENTINEL && Date.now() < deadline) {
    await delay(15);
    text = await vscode.env.clipboard.readText();
  }
  return text;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
