export interface RunStyle {
  fg?: string;
  bg?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  opacity?: number;
  fgIsDefault?: boolean;
  bgIsDefault?: boolean;
}

export interface Run {
  text: string;
  style: RunStyle;
}

export interface Row {
  runs: Run[];
}

const COLOR = /^(#[0-9a-f]{3,8}|rgba?\([\d\s,.%]+\))$/i;
const ALLOWED_PROPS: Record<string, RegExp> = {
  "color": COLOR,
  "background-color": COLOR,
  "font-weight": /^(bold|normal|[1-9]00)$/i,
  "font-style": /^(italic|oblique|normal)$/i,
  "text-decoration": /^(underline|line-through|overline|none)(\s+(underline|line-through|overline))*$/i,
  "opacity": /^(0|1|0?\.\d+)$/,
};

const ALLOWED_TAGS = new Set(["div", "span", "br"]);

export const XTERM_PLACEHOLDER_FG = "#BFBFBF";
export const XTERM_PLACEHOLDER_BG = "#000000";

export interface CaptureFont {
  family?: string;
  size?: number;
}

export function captureFont(fragment: string): CaptureFont {
  const wrapper = /<div style='([^']*font-family[^']*)'/i.exec(fragment)?.[1];
  if (!wrapper) {
    return {};
  }
  const family = /font-family:\s*([^;]+)/i.exec(wrapper)?.[1]?.trim();
  const size = /font-size:\s*([\d.]+)px/i.exec(wrapper)?.[1];
  return {
    family: family || undefined,
    size: size ? Number(size) : undefined,
  };
}

export function parseCapture(fragment: string): Row[] {
  const rows: Row[] = [];
  let current: Run[] | undefined;
  let style: RunStyle = {};
  let divDepth = 0;

  const push = (text: string) => {
    if (!text || !current) {
      return;
    }
    const decoded = decodeEntities(text);
    const last = current[current.length - 1];
    if (last && sameStyle(last.style, style)) {
      last.text += decoded;
    } else {
      current.push({ text: decoded, style });
    }
  };

  const tagPattern = /<(\/?)([a-z][a-z0-9]*)\b([^>]*)>/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(fragment)) !== null) {
    push(fragment.slice(lastIndex, match.index));
    lastIndex = tagPattern.lastIndex;

    const [, closing, rawName, attrs] = match;
    const name = rawName.toLowerCase();
    if (!ALLOWED_TAGS.has(name)) {
      continue;
    }

    if (name === "br") {
      push("\n");
    } else if (name === "span") {
      style = closing ? {} : styleOf(attrs);
    } else if (!closing) {
      divDepth++;
      if (divDepth === 1 && /font-family/i.test(attrs)) {
        continue;
      }
      current = [];
    } else {
      if (current) {
        rows.push({ runs: trimPadding(current) });
        current = undefined;
      }
      divDepth--;
    }
  }

  push(fragment.slice(lastIndex));
  if (current) {
    rows.push({ runs: trimPadding(current) });
  }
  return rows;
}

function trimPadding(runs: Run[]): Run[] {
  const result = [...runs];
  while (result.length) {
    const last = result[result.length - 1];
    if (last.style.bg) {
      break;
    }
    const trimmed = last.text.replace(/[ \t]+$/, "");
    if (trimmed) {
      if (trimmed !== last.text) {
        result[result.length - 1] = { ...last, text: trimmed };
      }
      break;
    }
    result.pop();
  }
  return result;
}

function styleOf(attrs: string): RunStyle {
  const raw = /style\s*=\s*(['"])([^'"]*)\1/i.exec(attrs)?.[2];
  if (!raw) {
    return {};
  }

  const decls: Array<[string, string]> = [];
  for (const part of raw.split(";")) {
    const idx = part.indexOf(":");
    if (idx < 0) {
      continue;
    }
    const prop = part.slice(0, idx).trim().toLowerCase();
    const value = part.slice(idx + 1).trim();
    if (ALLOWED_PROPS[prop]?.test(value)) {
      decls.push([prop, value]);
    }
  }

  const { resolved, fgIsDefault, bgIsDefault } = resolveInverse(decls);
  const decoration = resolved.get("text-decoration") ?? "";
  const opacity = resolved.get("opacity");

  const style: RunStyle = {};
  const fg = resolved.get("color");
  const bg = resolved.get("background-color");
  if (fg) {
    style.fg = fg;
    if (fgIsDefault) {
      style.fgIsDefault = true;
    }
  }
  if (bg) {
    style.bg = bg;
    if (bgIsDefault) {
      style.bgIsDefault = true;
    }
  }
  if (/^(bold|[7-9]00)$/i.test(resolved.get("font-weight") ?? "")) {
    style.bold = true;
  }
  if (/^(italic|oblique)$/i.test(resolved.get("font-style") ?? "")) {
    style.italic = true;
  }
  if (decoration.includes("underline")) {
    style.underline = true;
  }
  if (decoration.includes("line-through")) {
    style.strike = true;
  }
  if (opacity !== undefined) {
    style.opacity = Number(opacity);
  }

  if (
    !style.fgIsDefault &&
    !style.bgIsDefault &&
    style.fg === XTERM_PLACEHOLDER_BG &&
    style.bg === XTERM_PLACEHOLDER_FG
  ) {
    style.fgIsDefault = true;
    style.bgIsDefault = true;
  }
  return style;
}

function resolveInverse(decls: Array<[string, string]>): {
  resolved: Map<string, string>;
  fgIsDefault: boolean;
  bgIsDefault: boolean;
} {
  const occurrences = (prop: string) =>
    decls.filter(([name]) => name === prop).length;

  if (occurrences("color") < 2 && occurrences("background-color") < 2) {
    return {
      resolved: new Map(decls),
      fgIsDefault: false,
      bgIsDefault: false,
    };
  }

  const dropLast = (prop: string) => {
    for (let i = decls.length - 1; i >= 0; i--) {
      if (decls[i][0] === prop) {
        decls.splice(i, 1);
        return;
      }
    }
  };
  dropLast("color");
  dropLast("background-color");

  const resolved = new Map(decls);
  const foreground = resolved.get("color");
  const background = resolved.get("background-color");
  resolved.set("color", background ?? XTERM_PLACEHOLDER_BG);
  resolved.set("background-color", foreground ?? XTERM_PLACEHOLDER_FG);
  return {
    resolved,
    fgIsDefault: background === undefined,
    bgIsDefault: foreground === undefined,
  };
}

function sameStyle(a: RunStyle, b: RunStyle): boolean {
  return (
    a.fg === b.fg &&
    a.bg === b.bg &&
    !!a.bold === !!b.bold &&
    !!a.italic === !!b.italic &&
    !!a.underline === !!b.underline &&
    !!a.strike === !!b.strike &&
    a.opacity === b.opacity
  );
}

function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}
