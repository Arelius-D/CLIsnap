
export function textToFragment(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => `<div><span>${escapeHtml(expandTabs(line))}</span></div>`)
    .join("");
}

export function expandTabs(line: string): string {
  let out = "";
  for (const char of line) {
    if (char === "\t") {
      out += " ".repeat(8 - (out.length % 8));
    } else {
      out += char;
    }
  }
  return out;
}

export function stripEscapes(text: string): string {
  return text
    .replace(/\x1b\][\s\S]*?(?:\x07|\x1b\\)/g, "")
    .replace(/\x1b\[[0-9;?]*[ -/]*[@-~]/g, "")
    .replace(/\x1b[@-Z\\-_]/g, "")
    .replace(/[\x00-\x08\x0b-\x1f\x7f]/g, "");
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
