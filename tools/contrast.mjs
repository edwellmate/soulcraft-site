// WCAG 2.1 contrast check for the Soulcraft token pairs (BRAND.md §1).
// Usage: node tools/contrast.mjs   (prints a table, exits 1 if any pair fails)
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const root = css.match(/:root\s*{([^}]*)}/)[1];
const tokens = {};
for (const m of root.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) tokens[m[1]] = m[2].trim();

function parse(v) {
  v = v.trim();
  let m;
  if ((m = v.match(/^#([0-9a-f]{6})$/i))) {
    const n = parseInt(m[1], 16);
    return [n >> 16 & 255, n >> 8 & 255, n & 255, 1];
  }
  if ((m = v.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)$/i)))
    return [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]];
  throw new Error("Cannot parse colour " + v);
}
const composite = (fg, bg) => fg[3] >= 1 ? fg : fg.map((c, i) => i < 3 ? Math.round(fg[3] * c + (1 - fg[3]) * bg[i]) : 1);
function luminance([r, g, b]) {
  const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function ratio(fgName, bgName) {
  const bg = parse(tokens[bgName]);
  const fg = composite(parse(tokens[fgName]), bg);
  const [a, b] = [luminance(fg), luminance(bg)];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

// [text token, background token, minimum, where it is used]
const pairs = [
  ["ink", "bone", 4.5, "body on page"],
  ["ink", "sand", 4.5, "body on sand cards / #quick-win / #join"],
  ["ink", "pebble", 4.5, "body on #how"],
  ["ink", "white", 4.5, "body on white cards / #work / #path"],
  ["stone", "bone", 4.5, "muted text on bone"],
  ["stone", "sand", 4.5, "muted text on sand"],
  ["stone", "pebble", 4.5, "muted text on pebble"],
  ["stone", "white", 4.5, "muted text on white"],
  ["euc-deep", "bone", 4.5, "links + eyebrow on bone"],
  ["euc-deep", "sand", 4.5, "links + eyebrow on sand"],
  ["euc-deep", "white", 4.5, "links + eyebrow on white"],
  ["euc-deep", "pebble", 4.5, "links + eyebrow on pebble"],
  ["euc", "bone", 3, "step numerals / icons (≥ 24 px) on bone"],
  ["euc", "pebble", 3, "step numerals / icons (≥ 24 px) on pebble"],
  ["on-dark", "night", 4.5, "body on #why / #podcast"],
  ["on-dark-muted", "night", 4.5, "muted body on night"],
  ["on-dark", "night-deep", 4.5, "footer text"],
  ["on-dark-muted", "night-deep", 4.5, "footer muted text"],
  ["on-dark", "euc-deep", 4.5, "text on euc-deep surfaces (buttons)"],
  ["on-dark", "euc", 3, "large text / icons on euc (no body text sits on plain euc)"],
  ["rose", "night", 3, "eyebrow / headings on night"],
  ["rose", "night-deep", 3, "eyebrow / headings on footer"],
  ["bone", "euc-deep", 4.5, "primary button text"],
  ["white", "euc-deep", 4.5, "button text on euc-deep"],
  ["ink", "rose", 4.5, "badge text on rose"],
];

let failed = false;
const rows = pairs.map(([fg, bg, min, note]) => {
  const r = ratio(fg, bg);
  const ok = r >= min;
  if (!ok) failed = true;
  return { pair: `${fg} / ${bg}`, ratio: r.toFixed(2), min: `${min}:1`, result: ok ? "pass" : "FAIL", note };
});
const w = k => Math.max(...rows.map(r => String(r[k]).length), k.length);
const line = r => ["pair", "ratio", "min", "result", "note"].map(k => String(r[k]).padEnd(w(k))).join(" | ");
console.log("| " + line({ pair: "pair", ratio: "ratio", min: "min", result: "result", note: "note" }) + " |");
console.log("|" + ["pair", "ratio", "min", "result", "note"].map(k => "-".repeat(w(k) + 2)).join("|") + "|");
for (const r of rows) console.log("| " + line(r) + " |");
if (failed) { console.error("\nContrast check FAILED"); process.exit(1); }
console.log("\nAll pairs pass WCAG AA.");
