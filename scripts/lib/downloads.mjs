// Builds the downloadable tokens.css and the DESIGN.md addendum for a brand.
// Goal: tokens.css and DESIGN.md must never silently disagree (fonts, line-height, Thai rules).
import { fontFor, fontsUrlFor, thaiStack, fontPlan } from './landing.mjs';
import { extractProseTokens, extractProseColors } from './legacy.mjs';

const SAFE_CSS = /^[#\w().,%\s/+*-]+$/;
const css = (v, fallback = '') => (typeof v === 'string' && SAFE_CSS.test(v) ? v : fallback);
const famName = (s) => String(s || '').split(',')[0].replace(/["']/g, '').trim();

/** Line-height as a unitless ratio (px values are divided by the font size); NaN when unknown. */
const lhRatio = (t) => {
  const s = String(t.lineHeight ?? ''), n = parseFloat(s), fs = parseFloat(t.fontSize);
  if (!Number.isFinite(n)) return NaN;
  return /px$/.test(s) ? (Number.isFinite(fs) && fs ? n / fs : NaN) : n;
};

/** Every distinct font family DESIGN.md uses, mapped to the substitute stack the Hub ships and the CSS variable that carries it. */
export function fontRoles(b) {
  const ty = Object.values(b.tokens.typography).filter((t) => t && typeof t === 'object' && t.fontFamily);
  const dispOrig = famName(b.fonts.displayName), bodyOrig = famName(b.fonts.bodyName);
  const roles = new Map(), used = new Set();
  const take = (name) => { let n = name, i = 2; while (used.has(n)) n = `${name}-${i++}`; used.add(n); return n; };
  const add = (orig, t) => {
    if (roles.has(orig)) return;
    const stack = fontFor(t?.fontFamily ?? orig, t?.fontWeight);
    const kind = /monospace/.test(stack) ? 'mono' : /, serif$/.test(stack) ? 'serif' : 'alt';
    const v = orig === dispOrig ? take('display') : orig === bodyOrig ? take('body') : take(kind);
    roles.set(orig, { orig, stack, var: v, sub: famName(stack) });
  };
  add(dispOrig, ty.find((t) => famName(t.fontFamily) === dispOrig));
  add(bodyOrig, ty.find((t) => famName(t.fontFamily) === bodyOrig));
  for (const t of ty) add(famName(t.fontFamily), t);
  // brands with no typography tokens (legacy files) still get the two base variables
  if (!roles.has(dispOrig)) roles.set(dispOrig, { orig: dispOrig || '(not specified)', stack: b.fonts.display, var: 'display', sub: famName(b.fonts.display) });
  const list = [...roles.values()];
  if (!list.some((r) => r.var === 'body')) list.push({ orig: bodyOrig || dispOrig || '(not specified)', stack: b.fonts.body, var: 'body', sub: famName(b.fonts.body), derived: true });
  return list;
}
const fontNote = (r) => (!r.orig || r.orig === "(not specified)" ? `not specified in DESIGN.md -> this file uses ${r.sub} (default)` : r.orig.toLowerCase() === r.sub.toLowerCase() ? `${r.orig} (same as DESIGN.md)` : `DESIGN.md says "${r.orig}" -> this file uses ${r.sub} (free substitute)`);

/**
 * The brand as the downloads see it: YAML tokens first; whatever the YAML lacks (all of it for legacy files)
 * is filled from the DESIGN.md prose so tokens.css does not silently omit values the document describes.
 */
export function downloadView(b) {
  const p = extractProseTokens(b.body || ''), has = (o) => Object.keys(o || {}).length > 0;
  const typography = has(b.tokens.typography) ? b.tokens.typography : p.typography;
  const rounded = has(b.tokens.rounded) ? b.tokens.rounded : p.rounded;
  const spacing = has(b.tokens.spacing) ? b.tokens.spacing : p.spacing;
  const known = new Set(Object.values(b.tokens.colors).map((v) => String(v).toLowerCase()));
  const proseColors = Object.fromEntries(Object.entries(extractProseColors(b.body || '')).filter(([k, v]) => !(k in b.tokens.colors) && !known.has(String(v).toLowerCase())));
  const fromProse = [!has(b.tokens.typography) && has(p.typography) && 'typography', !has(b.tokens.rounded) && has(p.rounded) && 'radius', !has(b.tokens.spacing) && has(p.spacing) && 'spacing'].filter(Boolean);
  return { ...b, tokens: { ...b.tokens, typography, rounded, spacing }, fonts: has(b.tokens.typography) ? b.fonts : fontPlan({ typography }), proseColors, fromProse };
}

export function tokenCss(b0) {
  const b = downloadView(b0);
  const roles = fontRoles(b);
  const roleOf = (t) => roles.find((r) => !r.derived && r.orig === famName(t.fontFamily));
  const legacy = b.format !== 'tokens';
  const head = [`/* ${b.name} - design tokens (generated from DESIGN.md by DESIGN.md Hub, for learning)`,
    ' * Use THIS file for code; DESIGN.md explains when and why to use each token.',
    ' * If the two ever disagree, the values in this file win (fonts are substituted, see below).'];
  if (legacy) head.push(" * NOTE: this brand's DESIGN.md has no YAML token block. Colors, " + (b.fromProse.length ? b.fromProse.join(', ') : 'nothing else') + ' were read from its text (best effort):', ' * check DESIGN.md before relying on a value, and read the prose for anything missing here (e.g. component styles).');
  head.push(' * Fonts:', ...roles.map((r) => ` *   --font-${r.var}: ${fontNote(r)}`));
  if (Object.keys(b.tokens.typography).length) head.push(' * Thai: the :root:lang(th) block at the bottom zeroes letter-spacing and raises line-height. Set <html lang="th"> to enable it.');
  head.push(' */');
  const lines = [...head, ':root {'];
  for (const [k, v] of Object.entries(b.tokens.colors)) lines.push(`  --color-${k}: ${css(v, 'transparent')};`);
  for (const [k, v] of Object.entries(b.tokens.rounded)) if (typeof v === 'string') lines.push(`  --radius-${k}: ${css(v, '0')};`);
  for (const [k, v] of Object.entries(b.tokens.spacing)) if (typeof v === 'string') lines.push(`  --space-${k}: ${css(v, '0')};`);
  if (Object.keys(b.proseColors).length) { lines.push('  /* colors that appear only in the DESIGN.md text, not in its YAML */'); for (const [k, v] of Object.entries(b.proseColors)) lines.push(`  --color-${k}: ${css(v, 'transparent')};`); }
  for (const r of roles) lines.push(`  --font-${r.var}: ${r.stack};`);
  lines.push(`  --font-thai-display: ${thaiStack(b.fonts.thaiDisplay)};`, `  --font-thai-body: ${thaiStack(b.fonts.thaiBody)};`);
  const thai = [];
  for (const [k, t] of Object.entries(b.tokens.typography)) {
    if (!t || typeof t !== 'object') continue;
    const r = roleOf(t);
    if (r) lines.push(`  --text-${k}-font: var(--font-${r.var});`);
    if (t.fontSize) lines.push(`  --text-${k}-size: ${css(String(t.fontSize), 'inherit')};`);
    if (t.fontWeight) lines.push(`  --text-${k}-weight: ${css(String(t.fontWeight), 'inherit')};`);
    if (t.lineHeight !== undefined) lines.push(`  --text-${k}-lh: ${css(String(t.lineHeight), 'normal')};`);
    if (t.letterSpacing !== undefined) lines.push(`  --text-${k}-tracking: ${css(String(t.letterSpacing), 'normal')};`);
    const ratio = lhRatio(t), ls = parseFloat(t.letterSpacing), minLh = parseFloat(t.fontSize) > 24 ? 1.3 : 1.7;
    const fixLh = Number.isFinite(ratio) && ratio < minLh, fixLs = Number.isFinite(ls) && ls !== 0;
    if (fixLh || fixLs) thai.push([k, fixLh ? minLh : null, fixLs]);
  }
  lines.push('}');
  if (thai.length) {
    lines.push('', '/* Thai content: no letter-spacing, taller line-height (Thai tone marks need room) */', ':root:lang(th) {');
    for (const [k, lh, ls] of thai) { if (lh) lines.push(`  --text-${k}-lh: ${lh};`); if (ls) lines.push(`  --text-${k}-tracking: 0;`); }
    lines.push('}');
  }
  return lines.join('\n') + '\n';
}

/** Addendum appended to the downloadable DESIGN.md: relation to tokens.css, font substitutions, Thai rules. */
export function designAddendum(b0) {
  const b = downloadView(b0);
  const f = b.fonts, same = f.thaiDisplay === f.thaiBody, roles = fontRoles(b);
  const url = fontsUrlFor(roles.map((r) => r.stack), [f.thaiDisplay, f.thaiBody]);
  const tokenLine = b.format === 'tokens'
    ? 'Every color, radius, spacing and type token above exists in tokens.css under the same name (`--color-*`, `--radius-*`, `--space-*`, `--text-<name>-size|weight|lh|tracking|font`).'
    : `This file has no YAML token block, so tokens.css was built from the text above (colors${b.fromProse.length ? ', ' + b.fromProse.join(', ') : ''}); values are best-effort, and anything the text describes only in words (component styles, shadows) is not in tokens.css.`;
  return `

## Using this file with tokens.css (added by DESIGN.md Hub)

- **Which file wins:** DESIGN.md (above) is the upstream written analysis: intent, do/don't, context. \`tokens.css\` is the implementable version of the same values. For code, use \`tokens.css\`; if a value differs, \`tokens.css\` wins.
- **Fonts are substituted.** Many brand fonts are proprietary, so the Hub ships free look-alikes:
${roles.map((r) => `  - \`--font-${r.var}\`: ${fontNote(r)}`).join('\n')}
- **Load the fonts:** \`${url}\`
- ${tokenLine}

## Thai Typography (added by DESIGN.md Hub)

The fonts above have no Thai glyphs. When the page content is Thai, pair them with a free Thai font so the browser does not fall back to a system font:

- Thai display / headings: **${f.thaiDisplay}**${same ? ' (also used for body text)' : `
- Thai body text: **${f.thaiBody}**`}
- CSS stacks: \`--font-thai-display: ${thaiStack(f.thaiDisplay)}\`${same ? '' : `, \`--font-thai-body: ${thaiStack(f.thaiBody)}\``} (see tokens.css). Put the Thai font right after the Latin font in every \`font-family\`, e.g. \`font-family: ${f.display}\`.
- Set \`<html lang="th">\`. tokens.css then switches automatically (\`:root:lang(th)\`): every \`--text-*-tracking\` becomes 0 and short \`--text-*-lh\` values are raised (body 1.7+, headings 1.3+). Use those variables instead of the Latin numbers written above.
- Never apply letter-spacing (positive or negative) to Thai text. Do not use \`text-transform: uppercase\` or italics on Thai.
- Keep body text at 16px or larger. Thai has no spaces between words, so let the browser wrap lines (\`overflow-wrap: break-word\`) and avoid fixed-width truncation.
`;
}

/** Consistency check run at build time: returns human-readable problems when tokens.css and DESIGN.md could disagree. */
export function verifyDownload(b0, cssText) {
  const b = downloadView(b0), out = [], n = b.name;
  const head = cssText.slice(0, cssText.indexOf(':root'));
  for (const k of Object.keys(b.tokens.colors)) if (!cssText.includes(`--color-${k}:`)) out.push(`${n}: tokens.css ขาดสี ${k}`);
  for (const k of Object.keys(b.tokens.rounded)) if (typeof b.tokens.rounded[k] === 'string' && !cssText.includes(`--radius-${k}:`)) out.push(`${n}: tokens.css ขาด radius ${k}`);
  for (const k of Object.keys(b.tokens.spacing)) if (typeof b.tokens.spacing[k] === 'string' && !cssText.includes(`--space-${k}:`)) out.push(`${n}: tokens.css ขาด spacing ${k}`);
  for (const [k, t] of Object.entries(b.tokens.typography)) {
    if (!t || typeof t !== 'object') continue;
    if (t.lineHeight !== undefined && !cssText.includes(`--text-${k}-lh:`)) out.push(`${n}: tokens.css ขาด line-height ของ ${k}`);
    if (t.fontFamily && !head.includes(famName(t.fontFamily))) out.push(`${n}: หัว tokens.css ไม่บอกฟอนต์ ${famName(t.fontFamily)}`);
  }
  if ((cssText.match(/{/g) || []).length !== (cssText.match(/}/g) || []).length) out.push(`${n}: tokens.css วงเล็บ {} ไม่ครบ`);
  if (b0.format !== 'tokens' && !b.fromProse.length) out.push(`${n}: ไม่มี YAML และดึง typography/radius/spacing จากข้อความไม่ได้ (tokens.css มีแต่สี)`);
  return out;
}
