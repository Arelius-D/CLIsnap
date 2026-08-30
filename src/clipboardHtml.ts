import { exec } from "child_process";
import { tmpdir } from "os";
import { join } from "path";
import { readFileSync, unlinkSync } from "fs";

export async function readClipboardHtml(): Promise<string | undefined> {
  try {
    const raw = await readByPlatform();
    const cleaned = raw?.replace(/^﻿/, "").trim();
    return cleaned ? cleaned : undefined;
  } catch {
    return undefined;
  }
}

async function readByPlatform(): Promise<string | undefined> {
  switch (process.platform) {
    case "win32":
      return stripCfHtmlHeader(await readWin32());
    case "darwin":
      return await readDarwin();
    default:
      return await readLinux();
  }
}

async function readWin32(): Promise<string> {
  const tmpFile = join(tmpdir(), `clisnap-clip-${Date.now()}.html`);
  const script = [
    "Add-Type -AssemblyName System.Windows.Forms;",
    "$h = [System.Windows.Forms.Clipboard]::GetText([System.Windows.Forms.TextDataFormat]::Html);",
    "$enc = New-Object System.Text.UTF8Encoding($false);",
    `[System.IO.File]::WriteAllText('${tmpFile}', $h, $enc)`,
  ].join(" ");

  try {
    await run(`powershell -NoProfile -STA -Command "${script}"`);
    return readFileSync(tmpFile, "utf8");
  } finally {
    try {
      unlinkSync(tmpFile);
    } catch {
    }
  }
}

async function readDarwin(): Promise<string | undefined> {
  const out = await run(
    `osascript -e 'try' -e 'the clipboard as «class HTML»' -e 'end try'`
  );
  const hex = /[0-9A-Fa-f]{16,}/.exec(out);
  return hex ? Buffer.from(hex[0], "hex").toString("utf8") : undefined;
}

async function readLinux(): Promise<string | undefined> {
  try {
    return await run(`xclip -selection clipboard -t text/html -o`);
  } catch {
    return await run(`wl-paste --type text/html`);
  }
}

function stripCfHtmlHeader(raw: string): string {
  const start = raw.search(/<html[\s>]/i);
  return start >= 0 ? raw.slice(start) : raw;
}

export function extractTerminalFragment(raw?: string): string | undefined {
  if (!raw) {
    return undefined;
  }
  const match = /<pre\b[^>]*>([\s\S]*)<\/pre>/i.exec(raw);
  const inner = match?.[1]?.trim();
  return inner ? inner : undefined;
}

function run(cmd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(cmd, { maxBuffer: 32 * 1024 * 1024 }, (error, stdout) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}
