// Terminal cells, not string length: "日本語" is 3 UTF-16 units but 6 cells,
// and a combining accent is 2 units but 1 cell. Emoji happen to match, which is
// what makes the bug easy to miss. Ranges follow Unicode TR11 (W and F) plus
// the double-width emoji blocks.

const WIDE_RANGES: Array<[number, number]> = [
  [0x1100, 0x115f], // Hangul Jamo initial consonants
  [0x2e80, 0x303e], // CJK radicals, Kangxi
  [0x3041, 0x33ff], // Hiragana, Katakana, CJK symbols, compatibility
  [0x3400, 0x4dbf], // CJK extension A
  [0x4e00, 0x9fff], // CJK unified ideographs
  [0xa000, 0xa4cf], // Yi
  [0xa960, 0xa97f], // Hangul Jamo extended-A
  [0xac00, 0xd7a3], // Hangul syllables
  [0xf900, 0xfaff], // CJK compatibility ideographs
  [0xfe10, 0xfe19], // vertical forms
  [0xfe30, 0xfe6f], // CJK compatibility forms
  [0xff00, 0xff60], // fullwidth forms
  [0xffe0, 0xffe6], // fullwidth signs
  [0x1f300, 0x1f64f], // emoji, pictographs, emoticons
  [0x1f680, 0x1f6ff], // transport and map symbols
  [0x1f7e0, 0x1f7eb], // geometric shapes extended
  [0x1f900, 0x1f9ff], // supplemental symbols and pictographs
  [0x1fa70, 0x1faff], // symbols and pictographs extended-A
  [0x20000, 0x3fffd], // CJK extension B and beyond
];

const ZERO_WIDTH_RANGES: Array<[number, number]> = [
  [0x0300, 0x036f], // combining diacritical marks
  [0x0483, 0x0489],
  [0x1ab0, 0x1aff],
  [0x1dc0, 0x1dff],
  [0x200b, 0x200f], // zero-width space, ZWJ, direction marks
  [0x20d0, 0x20f0], // combining marks for symbols
  [0xfe00, 0xfe0f], // variation selectors
  [0xfe20, 0xfe2f], // combining half marks
  [0xfeff, 0xfeff], // BOM
  [0xe0100, 0xe01ef], // variation selectors supplement
];

function inRanges(code: number, ranges: Array<[number, number]>): boolean {
  let low = 0;
  let high = ranges.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    const [start, end] = ranges[mid];
    if (code < start) {
      high = mid - 1;
    } else if (code > end) {
      low = mid + 1;
    } else {
      return true;
    }
  }
  return false;
}

export function codePointWidth(code: number): number {
  if (code === 0) {
    return 0;
  }
  if (code < 0x20 || (code >= 0x7f && code < 0xa0)) {
    return 0;
  }
  if (inRanges(code, ZERO_WIDTH_RANGES)) {
    return 0;
  }
  return inRanges(code, WIDE_RANGES) ? 2 : 1;
}

export function textWidth(text: string): number {
  let width = 0;
  for (const char of text) {
    width += codePointWidth(char.codePointAt(0) ?? 0);
  }
  return width;
}
