import * as vscode from "vscode";
import { Capture } from "./capture";
import { stripEscapes, textToFragment } from "./textFragment";

const MAX_BYTES = 8 * 1024 * 1024;

export async function captureFromFile(): Promise<Capture | undefined> {
  const picked = await vscode.window.showOpenDialog({
    canSelectMany: false,
    openLabel: "Render",
    filters: {
      "Text and logs": ["log", "txt", "out", "err", "md", "json", "csv"],
      "All files": ["*"],
    },
  });
  const uri = picked?.[0];
  if (!uri) {
    return undefined;
  }

  const name = uri.path.split("/").pop() ?? "file";
  const bytes = await vscode.workspace.fs.readFile(uri);
  if (bytes.byteLength > MAX_BYTES) {
    vscode.window.showWarningMessage(
      `CLIsnap: ${name} is larger than 8 MB. Trim it and try again.`
    );
    return undefined;
  }

  const text = stripEscapes(Buffer.from(bytes).toString("utf8"));
  if (!text.trim()) {
    vscode.window.showWarningMessage("CLIsnap: that file is empty.");
    return undefined;
  }

  return { fragment: textToFragment(text), text, terminalName: name };
}
