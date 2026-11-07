#!/usr/bin/env node
// check-design.mjs (DESIGN.md Hub): checks an app's source against the design kit rules. No dependencies, read-only.
//   node design/check-design.mjs src                 (run from the project root; put this file next to tokens.tailwind.css)
//   node design/check-design.mjs src --theme design/tokens.tailwind.css --tokens design/tokens.css
// Exit code 1 when any check marked ✗ fails, so it can run in CI or be run by an AI before it says "done".
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const srcDir = resolve(args.find((a, i) => !a.startsWith('--') && (i === 0 || !args[i - 1].startsWith('--'))) || 'src');
const here = dirname(fileURLToPath(import.meta.url));
const themePath = resolve(opt('--theme') || [join(here, 'tokens.tailwind.css'), join(srcDir, 'tokens.tailwind.css')].find(existsSync) || join(here, 'tokens.tailwind.css'));
const tokensPath = resolve(opt('--tokens') || join(dirname(themePath), 'tokens.css'));
const root = process.cwd();

// ---- collect source files
const SKIP_DIR = new Set(['node_modules', 'dist', 'build', '.git', 'assets', 'public']);
const files = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f), st = statSync(p);
    if (st.isDirectory()) { if (!SKIP_DIR.has(f)) walk(p); continue; }
    if (!/\.(jsx?|tsx?|html|css|vue|svelte)$/.test(f)) continue;
    if (/^tokens(\.tailwind)?\.css$/.test(f) || f === 'check-design.mjs') continue;
    files.push(p);
  }
})(srcDir);

// ---- what the theme defines
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');
const themeCss = read(themePath), tokensCss = read(tokensPath);
const definedRoles = new Set([...themeCss.matchAll(/--color-app-([a-z0-9-]+)\s*:/g)].map((m) => m[1]));
const plainVars = (css) => new Set([...css.matchAll(/--app-([a-z0-9-]+)\s*:/g)].map((m) => m[1]));
const themeVars = plainVars(themeCss);
const allText = files.map((f) => readFileSync(f, 'utf8'));
const tokensImported = allText.some((t) => /(@import|import)\s*(url\()?['"][^'"]*tokens\.css['"]/.test(t));
const effectiveVars = new Set([...themeVars, ...(tokensImported ? plainVars(tokensCss) : [])]);
// component classes (.ds-app-*) the kit defines, and how readable on-accent text is on this brand's accent (3.5:1 for Airbnb)
const dsOf = (css) => new Set([...css.matchAll(/\.(ds-app-[a-z0-9-]+)/g)].map((m) => m[1]));
const definedDs = new Set([...dsOf(themeCss), ...(tokensImported ? dsOf(tokensCss) : [])]);
const hexOf = (css, name) => (css.match(new RegExp(`--color-app-${name}\\s*:\\s*(#[0-9a-fA-F]{6})`)) || [])[1];
const lum = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const crOf = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const accentHex = hexOf(themeCss, 'accent'), onAccentHex = hexOf(themeCss, 'on-accent');
const onAccentCr = accentHex && onAccentHex ? crOf(accentHex, onAccentHex) : 99;

// ---- scan
const PAL = '(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)';
const UTIL = '(?:bg|text|border|ring|fill|stroke|from|to|via|divide|outline|shadow|accent|decoration|placeholder|caret)';
const R = {
  hex: /(?<=[:\s("'=,])#[0-9a-fA-F]{8}\b|(?<=[:\s("'=,])#[0-9a-fA-F]{6}\b|(?<=[:\s("'=,])#[0-9a-fA-F]{3,4}(?![\w-])/g,
  fn: /\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\(\s*[\d.%\s,/-]+\)/g,
  pal: new RegExp(`(?<![\\w-])((?:[a-z0-9-]+:)*${UTIL}-${PAL}-\\d{2,3}(?:/\\d+)?)(?![\\w-])`, 'g'),
  bw: new RegExp(`(?<![\\w-])((?:[a-z0-9-]+:)*(?:bg|text|border|ring|fill|stroke|from|to|via|divide)-(?:white|black)(?:/\\d+)?)(?![\\w-])`, 'g'),
  arb: /(?<![\w-])((?:[a-z0-9-]+:)*(?:bg|text|border|ring|fill|stroke|from|to|via)-\[(?:#|rgb|hsl|oklch)[^\]]*\])/g,
  tiny: /(?<![\w-])((?:[a-z0-9-]+:)*text-\[(\d+(?:\.\d+)?)px\])/g,
  role: /(?<![\w-])(?:[a-z0-9-]+:)*(?:bg|text|border|ring|fill|stroke|from|to|via|divide|outline|decoration|shadow|accent|caret|placeholder)-app-([a-z0-9-]+?)(?:\/\d+)?(?![\w-])/g,
  varApp: /var\(\s*--app-([a-z0-9-]+)/g,
  ds: /(?<![\w-])(ds-app-[a-z0-9-]+)(?![\w-])/g,
  accentFill: /(?<![\w-])bg-app-accent(?![\w-])/,
  smallText: /(?<![\w-])(?:[a-z0-9-]+:)*text-(?:xs|sm)(?![\w-])/,
  // class names assembled from strings: bg-${x}-500, `text-${tone}`, 'bg-' + color  (Tailwind cannot see them, so no CSS is generated)
  dyn: /(?<![\w-])(?:[a-z0-9-]+:)*(?:bg|text|border|ring|fill|stroke|from|to|via|divide|outline|shadow|accent|decoration|placeholder|caret|rounded|p|px|py|m|mx|my|w|h|gap)-\$\{[^}]*\}[\w-]*|['"`](?:bg|text|border|ring|fill|stroke|from|to|via|divide|outline|shadow)-['"`]\s*\+/g,
  accentPlain: /(?<![\w-])((?:[a-z0-9-]+:)*text-app-accent)(?![\w-])/g,
  brand: /(?<![\w-])((?:[a-z0-9-]+:)*(?:bg|text|border)-(?:muted|muted-soft|canvas|ink|body|hairline|hairline-soft|surface-soft|surface-strong|surface-card))(?![\w-])/g,
  tracking: /(?<![\w-])(?:[a-z0-9-]+:)*tracking-[a-z]+/g,
  upper: /(?<![\w-])(?:[a-z0-9-]+:)*uppercase(?![\w-])/g
};
const found = { undefinedDs: [], smallOnAccent: [], dynamic: [], hex: [], fn: [], pal: [], bw: [], arb: [], tiny: [], undefinedRole: [], undefinedVar: [], accentPlain: 0, brand: [], tracking: 0, upper: 0 };
const roleUse = new Map(); let roleTotal = 0;
const loc = (f, text, idx) => `${relative(root, f)}:${text.slice(0, idx).split('\n').length}`;
const isComment = (text, idx) => { const ls = text.lastIndexOf('\n', idx) + 1; return /^\s*(\/\/|\*|\/\*|<!--)/.test(text.slice(ls, text.indexOf('\n', idx) < 0 ? undefined : text.indexOf('\n', idx))); };
files.forEach((f, i) => {
  const t = allText[i];
  const push = (arr, re, fn) => { for (const m of t.matchAll(re)) { if (isComment(t, m.index)) continue; arr.push(fn ? fn(m) : { where: loc(f, t, m.index), what: m[0] }); } };
  push(found.hex, R.hex); push(found.fn, R.fn); push(found.pal, R.pal); push(found.bw, R.bw); push(found.arb, R.arb);
  for (const m of t.matchAll(R.tiny)) if (parseFloat(m[2]) < 12) found.tiny.push({ where: loc(f, t, m.index), what: m[1] });
  for (const m of t.matchAll(R.role)) { roleTotal++; roleUse.set(m[1], (roleUse.get(m[1]) || 0) + 1); if (definedRoles.size && !definedRoles.has(m[1])) found.undefinedRole.push({ where: loc(f, t, m.index), what: m[0] }); }
  if (!/\.css$/.test(f)) push(found.dynamic, R.dyn);
  if (!/\.css$/.test(f) && definedDs.size) for (const m of t.matchAll(R.ds)) if (!definedDs.has(m[1])) found.undefinedDs.push({ where: loc(f, t, m.index), what: m[1] });
  // heuristic (same line only): an accent fill and small text together, when white-on-accent is below 4.5:1 for this brand
  if (!/\.css$/.test(f) && onAccentCr < 4.5) t.split('\n').forEach((line, n) => { if (R.accentFill.test(line) && R.smallText.test(line) && !/^\s*(\/\/|\*)/.test(line)) found.smallOnAccent.push({ where: `${relative(root, f)}:${n + 1}`, what: line.trim().slice(0, 90) }); });
  for (const m of t.matchAll(R.varApp)) if (!effectiveVars.has(m[1])) found.undefinedVar.push({ where: loc(f, t, m.index), what: `var(--app-${m[1]})` });
  found.accentPlain += (t.match(R.accentPlain) || []).length; found.tracking += (t.match(R.tracking) || []).length; found.upper += (t.match(R.upper) || []).length;
  push(found.brand, R.brand);
});

// Thai text but the page is not declared as Thai: the kit's Thai line-height / tracking rules only apply under lang="th"
const thaiSeen = files.some((f, i) => !/\.css$/.test(f) && /[฀-๿]/.test(allText[i]));
const htmlPages = [resolve(srcDir, '..', 'index.html'), join(srcDir, 'index.html'), resolve('index.html')].filter((p, i, a) => existsSync(p) && a.indexOf(p) === i);
const langIssues = !thaiSeen ? [] : htmlPages.map((p) => ({ p, lang: (read(p).match(/<html[^>]*\blang=["']([\w-]+)["']/i) || [])[1] || null })).filter((x) => !(x.lang || '').toLowerCase().startsWith('th')).map((x) => ({ where: relative(root, x.p), what: x.lang ? `lang="${x.lang}"` : 'no lang attribute' }));

// ---- report
let errors = 0, warns = 0;
const sample = (arr, n = 5) => arr.slice(0, n).map((x) => `      ${x.where}  ${x.what}`).join('\n') + (arr.length > n ? `\n      … and ${arr.length - n} more` : '');
const check = (level, arr, title, hint) => {
  if (!arr.length) { console.log(`  ✓ ${title}`); return; }
  if (level === 'error') errors++; else warns++;
  console.log(`  ${level === 'error' ? '✗' : '⚠'} ${title}: ${arr.length}${hint ? `  (${hint})` : ''}\n${sample(arr)}`);
};
const rel = (p) => relative(root, p) || p;
console.log(`check-design: ${files.length} files in ${rel(srcDir)}  |  theme: ${existsSync(themePath) ? rel(themePath) : 'NOT FOUND'}${tokensImported ? '  |  tokens.css imported' : ''}`);
if (!existsSync(themePath)) { console.log('  ⚠ theme file not found: role and variable checks skipped (use --theme path/to/tokens.tailwind.css)'); warns++; }
console.log('\nColors');
check('error', found.hex, 'raw hex colors', 'use app-* roles');
check('error', found.fn, 'raw rgb()/hsl()/oklch() colors', 'use app-* roles or color-mix(in srgb, var(--app-accent) 10%, var(--app-page))');
check('error', found.pal, 'Tailwind default palette classes (red-500, slate-600 ...)', 'use app-* roles');
check('error', found.arb, 'arbitrary color classes (bg-[#...])');
check('warn', found.bw, 'bg-white / text-black style classes', 'prefer bg-app-page / bg-app-surface / text-app-text / text-app-on-accent');
if (existsSync(themePath)) {
  check('error', found.undefinedRole, 'app-* classes that do not exist in the theme (they silently do nothing)');
  check('error', found.undefinedVar, 'var(--app-*) that is not defined', tokensImported || !existsSync(tokensPath) ? 'define it in the theme file' : 'import design/tokens.css or use the newer tokens.tailwind.css that defines --app-*');
}
console.log('\nClasses');
check('error', found.dynamic, 'Tailwind class names built from strings (bg-${x}-500, "text-" + x)', 'they silently produce no CSS: write full class names and map variants to complete strings');
if (definedDs.size) check('error', found.undefinedDs, '.ds-app-* classes that the kit does not define (they silently do nothing)'); else console.log('  · .ds-app-* classes not checked (the theme file does not define them: use the latest kit files)');
console.log('\nText');
check('warn', found.smallOnAccent, `small text (text-xs/text-sm) on bg-app-accent: on-accent text is only ${onAccentCr.toFixed(1)}:1 on this brand`, definedRoles.has('accent-strong') ? 'use bg-app-accent-strong for surfaces with small text; same-line check only' : 'use text-base or larger');
check('warn', langIssues, 'Thai text found but <html lang="th"> is missing', 'the kit\'s Thai line-height and tracking rules only apply under lang="th"');
check('error', found.tiny, 'text smaller than 12px (text-[10px] ...)', 'smallest allowed is text-xs; Thai body text is text-sm or larger');
if (found.accentPlain) { warns++; console.log(`  ⚠ text-app-accent used ${found.accentPlain} time(s): for text use text-app-accent-text (readable); keep text-app-accent for large icons and decoration`); } else console.log('  ✓ no plain text-app-accent');
if (found.tracking || found.upper) console.log(`  · tracking-* ×${found.tracking}, uppercase ×${found.upper} (ignored for Thai when <html lang="th"> and tokens.tailwind.css is loaded)`);
console.log('\nStructure');
check('warn', found.brand, 'brand palette names used for structure (text-muted, bg-canvas ...)', 'prefer app-* roles');
const used = [...roleUse.entries()].sort((a, b) => b[1] - a[1]);
const status = used.filter(([k]) => /^(danger|success|warning|info)/.test(k)).reduce((s, [, n]) => s + n, 0);
const chart = used.filter(([k]) => /^chart-/.test(k)).reduce((s, [, n]) => s + n, 0);
console.log(`  · app roles: ${roleTotal} uses, ${roleUse.size} distinct${definedRoles.size ? ` of ${definedRoles.size} defined` : ''}`);
if (roleTotal) console.log(`  · status colors (danger/success/warning/info): ${status} uses = ${Math.round((status / roleTotal) * 100)}% of role uses${status / roleTotal > 0.25 ? '  ⚠ high: status colors should mean status only (not ranks, tags or decoration)' : ''}; chart colors: ${chart}`);
if (status / roleTotal > 0.25) warns++;
console.log(`\n${errors ? '✗' : '✓'} ${errors} failing check(s), ${warns} warning(s)`);
process.exit(errors ? 1 : 0);
