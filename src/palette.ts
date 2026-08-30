import { Row } from "./captureModel";

export interface TerminalPalette {
  background: string;
  foreground: string;
  ansi: string[];
}

export function remapPalette(
  rows: Row[],
  from: TerminalPalette,
  to: TerminalPalette
): Row[] {
  const mapping = new Map<string, string>();
  const link = (a: string | undefined, b: string | undefined) => {
    if (a && b) {
      mapping.set(a.toLowerCase(), b);
    }
  };

  from.ansi.forEach((color, index) => link(color, to.ansi[index]));
  link(from.background, to.background);
  link(from.foreground, to.foreground);

  if (!mapping.size) {
    return rows;
  }

  return rows.map((row) => ({
    runs: row.runs.map((run) => {
      const fg = run.style.fg && mapping.get(run.style.fg.toLowerCase());
      const bg = run.style.bg && mapping.get(run.style.bg.toLowerCase());
      if (!fg && !bg) {
        return run;
      }
      return {
        ...run,
        style: {
          ...run.style,
          ...(fg ? { fg } : {}),
          ...(bg ? { bg } : {}),
        },
      };
    }),
  }));
}

export function applyPalette(rows: Row[], palette: TerminalPalette): Row[] {
  return rows.map((row) => ({
    runs: row.runs.map((run) => {
      if (!run.style.fgIsDefault && !run.style.bgIsDefault) {
        return run;
      }
      const style = { ...run.style };
      if (style.fgIsDefault && palette.background) {
        style.fg = palette.background;
      }
      if (style.bgIsDefault && palette.foreground) {
        style.bg = palette.foreground;
      }
      return { ...run, style };
    }),
  }));
}
