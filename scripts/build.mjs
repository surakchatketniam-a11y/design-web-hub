#!/usr/bin/env node
// Static site generator: content/<slug>/DESIGN.md  ->  public/ (no database, no runtime server).
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, copyFileSync, rmSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { splitFrontMatter, parseYaml } from './lib/yaml.mjs';
import { renderMarkdown, esc } from './lib/md.mjs';
import { parseColor, deriveTheme, resolveRef, readableOn } from './lib/theme.mjs';
import { renderLanding, fontFor, categoryModel, fontPlan, fontsUrl, thaiStack, ALL_THAI_FONTS } from './lib/landing.mjs';
import { LAYOUTS, WIRE } from '../src/layouts.mjs';
import { buildPrompt, TOOLS } from '../src/prompt.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = join(ROOT, 'content');
const OUT = join(ROOT, 'public');
const SITE = JSON.parse(readFileSync(join(ROOT, 'site.config.json'), 'utf8'));
const CATS = JSON.parse(readFileSync(join(ROOT, 'categories.json'), 'utf8'));
const CUR = JSON.parse(readFileSync(join(ROOT, 'curation.json'), 'utf8'));
const VIBES = CUR.vibes, USES = CUR.uses;
const REC = JSON.parse(readFileSync(join(ROOT, 'recipes.json'), 'utf8')).recipes;
const TONE = { light: 'โทนสว่าง', dark: 'โทนมืด', mixed: 'โทนผสม (สลับสว่าง/มืด)', mid: 'โทนกลาง' };
const CORNER = { sharp: 'มุมเหลี่ยม', soft: 'มุมโค้งเล็กน้อย', round: 'มุมโค้งมน/พิลล์' };
const FONTK = { serif: 'หัวข้อฟอนต์ serif', mono: 'ฟอนต์ monospace' };

// content-hash version for static assets, so a long browser cache can never serve a stale file
const ver = (f) => createHash('sha1').update(readFileSync(join(ROOT, 'src', f))).digest('hex').slice(0, 8);
const V = { css: ver('style.css'), js: ver('app.js'), preview: ver('preview.css'), layouts: ver('layouts.mjs'), mix: ver('mix.js'), compare: ver('compare.js'), prompt: ver('prompt.mjs'), gallery: ver('gallery.js') };

const NAMES = {
  'linear.app': 'Linear', 'mistral.ai': 'Mistral AI', 'together.ai': 'Together AI', 'opencode.ai': 'OpenCode', 'x.ai': 'xAI',
  'bmw-m': 'BMW M', bmw: 'BMW', 'dell-1996': 'Dell (1996)', 'nintendo-2001': 'Nintendo (2001)', theverge: 'The Verge', runwayml: 'Runway',
  voltagent: 'VoltAgent', elevenlabs: 'ElevenLabs', minimax: 'MiniMax', posthog: 'PostHog', mongodb: 'MongoDB', hashicorp: 'HashiCorp',
  clickhouse: 'ClickHouse', playstation: 'PlayStation', ibm: 'IBM', hp: 'HP', nvidia: 'NVIDIA', spacex: 'SpaceX', cal: 'Cal.com', wired: 'WIRED',
  opencode: 'OpenCode', superhuman: 'Superhuman', lamborghini: 'Lamborghini'
};
const displayName = (slug) => NAMES[slug] || slug.charAt(0).toUpperCase() + slug.slice(1);
const catOf = Object.fromEntries(Object.entries(CATS).flatMap(([k, v]) => v.brands.map((b) => [b, k])));

const SAFE_CSS = /^[#\w().,%\s/+*-]+$/;
const css = (v, fallback = '') => (typeof v === 'string' && SAFE_CSS.test(v) ? v : fallback);
const plain = (s) => String(s).replace(/[*`_]/g, '').replace(/\s+/g, ' ').trim();
const firstSentence = (s, max = 170) => {
  const t = plain(s);
  const m = t.match(/^(.{40,}?[.!?])(\s|$)/);
  const out = m ? m[1] : t;
  return out.length > max ? out.slice(0, max - 1).trimEnd() + '…' : out;
};

/* ---------- parsing ---------- */
function extractLegacyColors(body) {
  // "- **Kraken Purple** (`#7132f5`): role"  -> { 'kraken-purple': '#7132f5' }
  const out = {};
  for (const m of body.matchAll(/^[-*]\s+\*\*([^*]+)\*\*\s*\(`?(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\))`?[^)]*\)/gm)) {
    const key = m[1].trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (key && !(key in out)) out[key] = m[2];
  }
  return out;
}

function loadBrand(slug) {
  const file = join(CONTENT, slug, 'DESIGN.md');
  const raw = readFileSync(file, 'utf8');
  const { yaml, body } = splitFrontMatter(raw);
  let tokens = { colors: {}, typography: {}, rounded: {}, spacing: {}, components: {} };
  let format = 'legacy';
  let description = '';
  if (yaml) {
    const y = parseYaml(yaml);
    tokens = { colors: y.colors || {}, typography: y.typography || {}, rounded: y.rounded || {}, spacing: y.spacing || {}, components: y.components || {} };
    description = typeof y.description === 'string' ? y.description : '';
    format = Object.keys(tokens.colors).length ? 'tokens' : 'legacy';
  }
  if (format === 'legacy') {
    tokens.colors = extractLegacyColors(body);
    const m = body.match(/##\s*1\.[^\n]*\n+([^\n]+)/);
    description = description || (m ? m[1] : '');
  }
  const colors = Object.fromEntries(Object.entries(tokens.colors).filter(([, v]) => typeof v === 'string'));
  tokens.colors = colors;
  // legacy files carry no canvas token; detect an explicitly dark design from the opening text
  const head = (description + ' ' + body.slice(0, 1800)).toLowerCase();
  // "near-black" alone is ambiguous (often the TEXT color), so require it next to a surface word or an explicit dark-theme phrase
  const darkHint = format === 'legacy' && /((near-|jet-|true |pure )?black\s+(canvas|background|surface|page)|dark[- ](theme|mode|canvas|surface|background|dominant|first)|immersive dark|black[^.]{0,30}dominant surfaces|nocturnal|a dark,\s)/.test(head);
  const cur = CUR.brands[slug] || {};
  const forceDark = cur.tone === 'dark';
  const theme = deriveTheme(colors, { dark: darkHint || forceDark, forceNight: forceDark });
  // sites that deliberately alternate dark and light sections are tagged "mixed" instead of guessing one
  const dual = /(two[- ](canvas|mode|polarity|surface|track|parallel)|three[- ]canvas|multi-theme|dual[- ]mode|alternat(es|ing) (light|dark|black|white)|dark and light|light and dark)/.test((description + ' ' + body.slice(0, 2500)).toLowerCase());
  const tone = cur.tone || (dual ? 'mixed' : theme.dark ? 'dark' : 'light');
  // corner style from the primary button (fallback: median of the radius scale); unknown for legacy files
  const tk = tokens;
  const bk = Object.keys(tk.components).find((k) => /^button-primary|^btn-primary/.test(k) && !/pressed|hover|focus|disabled|active/.test(k)) || Object.keys(tk.components).find((k) => /button/.test(k));
  let r = bk ? parseFloat(resolveRef(tk.components[bk].rounded, tk)) : NaN;
  if (!Number.isFinite(r)) { const rs = Object.values(tk.rounded).map(parseFloat).filter((n) => Number.isFinite(n) && n < 500).sort((a, b2) => a - b2); r = rs.length ? rs[Math.floor(rs.length / 2)] : NaN; }
  const corner = !Number.isFinite(r) ? '' : r <= 4 ? 'sharp' : r < 16 ? 'soft' : 'round';
  const tyDisplay = Object.entries(tokens.typography).filter(([, v]) => v && typeof v === 'object').sort((a, b2) => parseFloat(b2[1].fontSize) - parseFloat(a[1].fontSize))[0];
  const ff = tyDisplay ? fontFor(tyDisplay[1].fontFamily) : '';
  const fontKind = /Source Serif/.test(ff) ? 'serif' : /JetBrains/.test(ff) ? 'mono' : '';
  const fonts = fontPlan(tokens);
  return { slug, raw, body, tokens, fonts, format, description, darkHint: darkHint || forceDark, forceNight: forceDark, name: displayName(slug), category: catOf[slug] || 'other',
    th: cur.th || '', vibes: cur.vibes || [], uses: cur.uses || [], tone, corner, fontKind };
}

/* ---------- rendering helpers ---------- */
const PAGE = (title, content, { desc = SITE.description, depth = 0, path = '' } = {}) => {
  const base = '../'.repeat(depth);
  return `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Sans+Thai:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${base}assets/style.css?v=${V.css}">
</head>
<body>
<a class="skip" href="#main">ข้ามไปเนื้อหา</a>
<header class="top"><div class="wrap bar">
  <a class="logo" href="${base || './'}"><span class="mark"></span>${esc(SITE.title)}</a>
  <nav><a class="nl-brands" href="${base || './'}#brands">แบรนด์ทั้งหมด</a><a class="nl-patterns" href="${base}patterns/">รูปแบบเลย์เอาต์</a><a class="nl-mix" href="${base}mix/">ผสมสไตล์</a><a class="nl-cmp" href="${base}compare/">เปรียบเทียบ</a><a class="nl-gal" href="${base}gallery/">ก่อน–หลัง</a><a class="nl-about" href="${base}about/">วิธีใช้</a><a class="nl-up" href="${esc(SITE.upstream)}" target="_blank" rel="noopener noreferrer">ต้นทางข้อมูล ↗</a></nav>
</div></header>
<main id="main">${content}</main>
<footer class="foot"><div class="wrap">
  <p>${esc(SITE.disclaimer)}</p>
  <p>ข้อมูล DESIGN.md จาก <a href="${esc(SITE.upstream)}" target="_blank" rel="noopener noreferrer">VoltAgent/awesome-design-md</a> (MIT License) · เว็บนี้ไม่มีการเก็บข้อมูลผู้ใช้</p>
</div></footer>
<script src="${base}assets/app.js?v=${V.js}" defer></script>
</body></html>`;
};



const swatches = (colors, n = 6) => {
  const vals = Object.values(colors).filter((v) => parseColor(v));
  const uniq = [...new Set(vals)];
  return uniq.slice(0, n).map((c) => `<i style="background:${css(c, '#ccc')}"></i>`).join('');
};

function tokenCss(b) {
  const lines = [`/* ${b.name} — design tokens (generated from DESIGN.md · for learning) */`, ':root {'];
  for (const [k, v] of Object.entries(b.tokens.colors)) lines.push(`  --color-${k}: ${css(v, 'transparent')};`);
  for (const [k, v] of Object.entries(b.tokens.rounded)) if (typeof v === 'string') lines.push(`  --radius-${k}: ${css(v, '0')};`);
  for (const [k, v] of Object.entries(b.tokens.spacing)) if (typeof v === 'string') lines.push(`  --space-${k}: ${css(v, '0')};`);
  for (const [k, t] of Object.entries(b.tokens.typography)) {
    if (typeof t !== 'object') continue;
    if (t.fontSize) lines.push(`  --text-${k}-size: ${css(String(t.fontSize), 'inherit')};`);
    if (t.fontWeight) lines.push(`  --text-${k}-weight: ${css(String(t.fontWeight), 'inherit')};`);
    if (t.letterSpacing !== undefined) lines.push(`  --text-${k}-tracking: ${css(String(t.letterSpacing), 'normal')};`);
  }
  lines.push(`  --font-display: ${b.fonts.display};`, `  --font-body: ${b.fonts.body};`, `  --font-thai-display: ${thaiStack(b.fonts.thaiDisplay)};`, `  --font-thai-body: ${thaiStack(b.fonts.thaiBody)};`);
  lines.push('}');
  return lines.join('\n') + '\n';
}

/** Thai typography section appended to the downloadable DESIGN.md (upstream files are English-only and their fonts have no Thai glyphs). */
function thaiSection(b) {
  const f = b.fonts, same = f.thaiDisplay === f.thaiBody;
  return `

## Thai Typography (added by DESIGN.md Hub)

The fonts above have no Thai glyphs. When the page content is Thai, pair them with a free Thai font so the browser does not fall back to a system font:

- Thai display / headings: **${f.thaiDisplay}**${same ? ' (also used for body text)' : `
- Thai body text: **${f.thaiBody}**`}
- CSS stacks: \`--font-thai-display: ${thaiStack(f.thaiDisplay)}\`${same ? '' : `, \`--font-thai-body: ${thaiStack(f.thaiBody)}\``} (see tokens.css). Put the Thai font right after the Latin font in every \`font-family\`, e.g. \`font-family: ${f.display}\`.
- Load them from Google Fonts: \`${fontsUrl([f.thaiDisplay, f.thaiBody])}\`
- Set \`<html lang="th">\`. Body line-height 1.7 or more (Thai tone marks need room); headings 1.3 or more, even if the Latin value above is tighter.
- Never apply letter-spacing (positive or negative) to Thai text; ignore the tracking values above for Thai. Do not use \`text-transform: uppercase\` or italics on Thai.
- Keep body text at 16px or larger. Thai has no spaces between words, so let the browser wrap lines (\`overflow-wrap: break-word\`) and avoid fixed-width truncation.
`;
}

/* ---------- brand page sections ---------- */
function typoStyle(t, cap = 64) {
  if (!t || typeof t !== 'object') return '';
  const px = parseFloat(t.fontSize);
  const size = Number.isFinite(px) ? Math.min(px, cap) : 16;
  const scale = Number.isFinite(px) && px > cap ? size / px : 1;
  const ls = parseFloat(t.letterSpacing);
  return [`font-size:${size}px`, t.fontWeight ? `font-weight:${css(String(t.fontWeight), '400')}` : '',
    t.lineHeight ? `line-height:${css(String(t.lineHeight), '1.4')}` : '',
    Number.isFinite(ls) ? `letter-spacing:${(ls * scale).toFixed(2)}px` : ''].filter(Boolean).join(';');
}

function renderComponent(key, comp, b, theme) {
  const t = b.tokens;
  const get = (v) => resolveRef(v, t);
  const bgRaw = get(comp.backgroundColor), fgRaw = get(comp.textColor);
  const bgC = parseColor(bgRaw);
  const bg = bgC ? css(bgRaw) : 'transparent';
  const fg = parseColor(fgRaw) ? css(fgRaw) : (bgC && bgC.a > 0.5 ? readableOn(bgC) : theme.ink);
  const rad = css(get(comp.rounded), '0');
  const ty = typeof comp.typography === 'string' ? t.typography[comp.typography.replace(/^\{typography\.|\}$/g, '')] : null;
  // brand paddings can be huge (hero bands); cap each number so previews stay compact
  const pad = css(String(comp.padding ?? '8px 14px').replace(/(\d+(?:\.\d+)?)px/g, (_, n) => `${Math.min(parseFloat(n), 20)}px`), '8px 14px');
  const kind = /button|btn|cta/.test(key) ? 'btn' : /input|field|search|select/.test(key) ? 'input' : /tag|chip|badge|pill|status/.test(key) ? 'pill' : /card|tile|panel|banner|callout|quote/.test(key) ? 'card' : /nav|header|footer|bar/.test(key) ? 'nav' : 'box';
  const themeBg = parseColor(theme.bg);
  const nearBg = bgC && bgC.a > 0.99 && Math.abs(bgC.r - themeBg.r) + Math.abs(bgC.g - themeBg.g) + Math.abs(bgC.b - themeBg.b) < 30;
  const transparent = !bgC || bgC.a < 0.1;
  // transparent variants (outline/ghost/link): draw a border and pick a backdrop that keeps the text readable
  const border = transparent && /outline|secondary|ghost|input|field/.test(key) ? '1px solid currentColor' : nearBg ? `1px solid ${css(theme.border, '#ddd')}` : '1px solid transparent';
  const fgC = parseColor(fg);
  const backdrop = transparent && fgC ? readableOn(fgC) : theme.bg;
  const label = { btn: 'Button', input: 'Input…', pill: 'Tag', card: 'Card', nav: 'Navigation', box: 'Component' }[kind];
  const style = `background:${bg};color:${fg};border-radius:${rad};padding:${kind === 'card' ? '20px' : pad};border:${border};${typoStyle(ty, 20)}`;
  return `<figure class="comp"><div class="comp-demo" style="background:${css(backdrop, theme.bg)}"><div class="cx cx-${kind}" style="${style}">${esc(label)}</div></div><figcaption><code>${esc(key)}</code></figcaption></figure>`;
}

const PROMPT_TYPES = [
  { key: 'saas', title: 'หน้า landing ของเว็บผลิตภัณฑ์/บริการ', uses: ['saas', 'brand'], extra: 'ส่วนที่ต้องมี: แถบนำทาง, hero พร้อมปุ่มหลัก, จุดเด่น 3–6 ข้อ, หลักฐานทางสังคม (รีวิวหรือโลโก้ลูกค้า), ตารางราคา, FAQ และ CTA ปิดท้าย' },
  { key: 'portfolio', title: 'พอร์ตโฟลิโอ / งานครีเอทีฟ', uses: ['portfolio'], extra: 'ส่วนที่ต้องมี: แนะนำตัว, ผลงานเด่นแบบกริด (เน้นภาพ), เกี่ยวกับฉัน, ช่องทางติดต่อ' },
  { key: 'shop', title: 'ร้านค้า / หน้าสินค้า', uses: ['shop'], extra: 'ส่วนที่ต้องมี: หน้าแรกพร้อมสินค้าแนะนำ, รายการสินค้าแบบการ์ดพร้อมตัวกรอง, หน้ารายละเอียดสินค้า, ตะกร้า' },
  { key: 'media', title: 'บล็อก / เว็บข่าว', uses: ['media'], extra: 'ส่วนที่ต้องมี: หน้าแรกรวมบทความเด่น, หน้าอ่านบทความ (ความกว้างบรรทัดอ่านสบายตา), หมวดหมู่, ช่องสมัครรับข่าว' },
  { key: 'local', title: 'เว็บธุรกิจท้องถิ่น (ร้านอาหาร คลินิก โรงเรียน ช่าง หน่วยงาน)', uses: ['food', 'health', 'edu', 'trade', 'gov'], extra: 'ส่วนที่ต้องมี: hero บอกว่าเราคือใครและอยู่ที่ไหน, บริการ/เมนูพร้อมราคา, รูปผลงานหรือบรรยากาศร้าน, รีวิวลูกค้า, เวลาทำการ แผนที่ และช่องทางติดต่อ (โทร, LINE) พร้อมปุ่มโทร/จองคิวที่กดง่ายบนมือถือ' },
  { key: 'tool', title: 'แดชบอร์ด / เครื่องมือภายใน', uses: ['tool', 'docs', 'fin'], extra: 'ส่วนที่ต้องมี: sidebar, การ์ดสรุปตัวเลข, ตารางข้อมูลพร้อมค้นหา/กรอง, ฟอร์ม, ป้ายสถานะ' }
];

function listAfter(body, startRe, stopAtBlank = false) {
  const lines = body.split('\n'); const out = [];
  const i = lines.findIndex((l) => startRe.test(l)); if (i < 0) return out;
  for (let j = i + 1; j < lines.length; j++) {
    if (/^#{1,6}\s/.test(lines[j])) break;
    const m = lines[j].match(/^\s*[-*]\s+(.*)$/);
    if (m) out.push(m[1]);
    else if (lines[j].trim() && out.length && !/^\s{2,}/.test(lines[j])) break;
  }
  return out;
}
const refText = (x) => x.replace(/\{([a-z0-9.\-]+)\}/gi, '$1');
const mdList = (items) => renderMarkdown(items.map((x) => '- ' + refText(x)).join('\n'));

function renderBrandPage(b, siblings) {
  const t = b.tokens;
  const theme = deriveTheme(t.colors, { dark: b.darkHint, forceNight: b.forceNight });
  const cat = CATS[b.category]?.label || 'อื่น ๆ';
  const stageVars = `--bg:${css(theme.bg, '#fff')};--ink:${css(theme.ink, '#111')};--mute:${css(theme.mute, '#666')};--pri:${css(theme.primary, '#333')};--onpri:${css(theme.onPrimary, '#fff')};--sur:${css(theme.surface, '#f5f5f5')};--bd:${css(theme.border, '#ddd')}`;

  // pick display / body typography tokens for the preview
  const tyEntries = Object.entries(t.typography).filter(([, v]) => v && typeof v === 'object');
  const bySize = [...tyEntries].sort((a, c) => parseFloat(c[1].fontSize) - parseFloat(a[1].fontSize));
  const display = bySize.find(([k]) => /display|hero/.test(k))?.[1] || bySize[0]?.[1];
  const body = tyEntries.find(([k]) => /^body/.test(k))?.[1] || tyEntries.find(([k]) => /body|text/.test(k))?.[1];
  const btnKey = Object.keys(t.components).find((k) => /^button-primary/.test(k) && !/pressed|hover|focus|disabled|active/.test(k)) || Object.keys(t.components).find((k) => /button/.test(k));
  const btnRad = btnKey ? css(resolveRef(t.components[btnKey].rounded, t), '8px') : '8px';
  const cardKey = Object.keys(t.components).find((k) => /card/.test(k));
  const cardRad = cardKey ? css(resolveRef(t.components[cardKey].rounded, t), '12px') : '12px';
  const previewUrl = `../../p/${esc(b.slug)}/`;
  const mockup = `<div class="device-bar" role="group" aria-label="ขนาดหน้าจอ">
      <button class="chip on" data-w="100%">เดสก์ท็อป</button><button class="chip" data-w="820px">แท็บเล็ต</button><button class="chip" data-w="390px">มือถือ</button>
      <a class="btn sm" id="pvOpen" href="${previewUrl}" target="_blank" rel="noopener">เปิดเต็มหน้าจอ ↗</a>
    </div>
    <div class="layout-bar" role="group" aria-label="รูปแบบเลย์เอาต์"><span class="flabel">เลย์เอาต์</span><div class="chips">${LAYOUTS.map((l) => `<button class="chip${l.key === 'hero' ? ' on' : ''}" data-layout="${l.key}" data-desc="${esc(l.desc)}" aria-pressed="${l.key === 'hero'}">${l.n}. ${esc(l.thai)}</button>`).join('')}</div></div>
    <div class="layout-bar lang-bar" role="group" aria-label="ภาษาของตัวอย่าง"><span class="flabel">ภาษา</span><div class="chips"><button class="chip on" data-lang="th" aria-pressed="true">ตัวอย่างภาษาไทย</button><button class="chip" data-lang="en" aria-pressed="false">English</button></div></div>
    <p class="layout-desc muted" id="layoutDesc">${esc(LAYOUTS.find((l) => l.key === 'hero').desc)} <a href="../../patterns/">ดูรูปแบบทั้ง 14 แบบ →</a></p>
    <div class="device-wrap"><iframe id="pv" class="device" src="${previewUrl}" title="ตัวอย่างการนำสีและฟอนต์ของ ${esc(b.name)} ไปใช้กับหน้าทั่วไป" loading="lazy"></iframe></div>`;

  const colorEntries = Object.entries(t.colors);
  const usedBy = (v) => { const c = parseColor(v); if (!c) return []; return (b.usage || []).filter(([, uv]) => { const u = parseColor(uv); return u && Math.abs(u.r - c.r) + Math.abs(u.g - c.g) + Math.abs(u.b - c.b) < 8; }).map(([l]) => l); };
  const usedCount = colorEntries.filter(([, v]) => usedBy(v).length).length;
  const palette = colorEntries.length ? `<div class="palette">${colorEntries.map(([k, v]) => {
    const c = parseColor(v);
    const fg = c && c.a > 0.5 ? readableOn(c) : '#111';
    const labels = [...new Set(usedBy(v))];
    return `<button class="sw" data-copy="${esc(v)}" title="คลิกเพื่อคัดลอก ${esc(v)}" style="background:${css(v, '#ccc')};color:${fg}"><span>${esc(k)}</span><code>${esc(v)}</code><small class="use${labels.length ? '' : ' none'}">${labels.length ? 'ใช้ใน: ' + esc(labels.slice(0, 3).join(' · ')) + (labels.length > 3 ? ` +${labels.length - 3}` : '') : 'ไม่ได้ใช้ในตัวอย่าง'}</small></button>`;
  }).join('')}</div>` : '<p class="muted">ไฟล์นี้ไม่มีข้อมูลสีแบบมีโครงสร้าง</p>';

  const typo = tyEntries.length ? `<div class="typo">${tyEntries.map(([k, v]) => `<div class="trow"><div class="tmeta"><code>${esc(k)}</code><span>${esc(String(v.fontSize ?? ''))} · ${esc(String(v.fontWeight ?? ''))} · lh ${esc(String(v.lineHeight ?? '-'))} · ls ${esc(String(v.letterSpacing ?? '0'))}</span></div><div class="tsample" style="${typoStyle(v, 64)}">Aa The quick brown fox 0123456789</div></div>`).join('')}</div>` : '';

  const rad = Object.entries(t.rounded).filter(([, v]) => typeof v === 'string');
  const spc = Object.entries(t.spacing).filter(([, v]) => typeof v === 'string');
  const shapes = (rad.length || spc.length) ? `<div class="two">
    ${rad.length ? `<div><h3>รัศมีมุม</h3><div class="radii">${rad.map(([k, v]) => `<div><span class="rbox" style="border-radius:${css(v, '0')}"></span><code>${esc(k)}</code><small>${esc(v)}</small></div>`).join('')}</div></div>` : ''}
    ${spc.length ? `<div><h3>ระยะห่าง</h3><div class="spaces">${spc.map(([k, v]) => `<div><span class="sbar" style="width:${Math.min(parseFloat(v) || 0, 160)}px"></span><code>${esc(k)}</code><small>${esc(v)}</small></div>`).join('')}</div></div>` : ''}
  </div>` : '';

  const comps = Object.entries(t.components).filter(([, v]) => v && typeof v === 'object');
  const compHtml = comps.length ? `<div class="comps" style="${stageVars}">${comps.slice(0, 60).map(([k, v]) => renderComponent(k, v, b, theme)).join('')}</div>` : '';

  const prompt = `อ่านไฟล์ DESIGN.md แล้วสร้างหน้า landing page ที่ใช้สี ตัวอักษร รัศมีมุม และคอมโพเนนต์ตามสไตล์ ${b.name} ใช้ Tailwind CSS`;
  const idx = siblings.findIndex((s) => s.slug === b.slug);
  const prev = siblings[(idx - 1 + siblings.length) % siblings.length], next = siblings[(idx + 1) % siblings.length];

  const sortedPrompts = [...PROMPT_TYPES].sort((a, c) => (c.uses.some((u) => b.uses.includes(u)) ? 1 : 0) - (a.uses.some((u) => b.uses.includes(u)) ? 1 : 0));
  const aiHtml = `<div class="tips"><b>เคล็ดลับให้ AI ทำตามสไตล์ได้แม่นขึ้น</b><ul>
      <li>วาง <code>DESIGN.md</code> และ <code>tokens.css</code> ไว้ในโปรเจกต์ <u>ก่อน</u> เริ่มสั่ง</li>
      <li>สั่งทีละส่วน (เช่น hero ก่อน) แล้วค่อยต่อ จะคุมผลลัพธ์ง่ายกว่าสั่งทั้งหน้าครั้งเดียว</li>
      <li>ถ้า AI ใช้สีเพี้ยน ให้บอกว่า “ใช้เฉพาะ <code>var(--color-…)</code> จาก tokens.css”</li>
      <li>ใช้เป็นแรงบันดาลใจ ไม่ใช่การลอก: เปลี่ยนชื่อ โลโก้ ภาพ และข้อความเป็นของคุณ เพื่อให้เว็บมีเอกลักษณ์ของตัวเอง</li></ul></div>
    <div class="pctl" id="pctl" data-pv="${V.prompt}"><label class="mx-f"><span>เครื่องมือ AI ที่จะใช้</span><select id="pTool">${TOOLS.map((t) => `<option value="${t.key}">${esc(t.label)}</option>`).join('')}</select></label>
      <label class="mx-f"><span>ชื่อเว็บ / ธุรกิจของคุณ</span><input id="pName" type="text" maxlength="60" placeholder="เช่น ร้านกาแฟบ้านสวน"></label>
      <label class="mx-f"><span>บริการหรือสินค้าหลัก</span><input id="pOffer" type="text" maxlength="120" placeholder="เช่น กาแฟคั่วเอง เบเกอรี่ เปิด 8:00–18:00"></label>
      <label class="mx-f"><span>กลุ่มลูกค้า</span><input id="pAud" type="text" maxlength="120" placeholder="เช่น คนทำงานย่านอารีย์ นักท่องเที่ยว"></label></div>
    <p class="muted pnote">กรอกแล้วคำสั่งด้านล่างอัปเดตให้ทันที ข้อมูลที่กรอกอยู่ในเบราว์เซอร์ของคุณเท่านั้น ไม่ถูกส่งไปไหน เหลือช่องไหนว่างก็ได้</p>
    <div class="pgrid">${sortedPrompts.map((t) => { const rec = t.uses.some((u) => b.uses.includes(u)); const txt = buildPrompt(t, { avoid: b.name });
      return `<article class="pcard" data-title="${esc(t.title)}" data-extra="${esc(t.extra)}" data-avoid="${esc(b.name)}"><div class="phead"><h3>${esc(t.title)}</h3>${rec ? '<em class="rec">เหมาะกับสไตล์นี้</em>' : ''}</div><pre>${esc(txt)}</pre><button class="btn sm" data-copy="${esc(txt)}">คัดลอกคำสั่ง</button></article>`; }).join('')}</div>`;

  const keyChars = listAfter(b.body, /key characteristics/i);
  const dos = listAfter(b.body, /^#{2,4}\s*do(?:'s)?\s*$/i), donts = listAfter(b.body, /^#{2,4}\s*don'?t(?:'s)?\s*$/i);
  const rulesHtml = [keyChars.length ? `<h3 class="rh">ลักษณะเด่นของสไตล์นี้ <small class="muted">(ข้อความต้นฉบับภาษาอังกฤษจากเอกสาร)</small></h3>${mdList(keyChars)}` : '',
    dos.length || donts.length ? `<div class="dd">${dos.length ? `<div class="dd-do"><h3 class="rh">✓ ควรทำ (Do)</h3>${mdList(dos)}</div>` : ''}${donts.length ? `<div class="dd-dont"><h3 class="rh">✕ ไม่ควรทำ (Don’t)</h3>${mdList(donts)}</div>` : ''}</div>` : ''].join('');
  const tabDefs = [
    { id: 'colors', label: 'สี', count: colorEntries.length, html: `<p class="muted">คลิกที่สีเพื่อคัดลอกค่า · <strong>หน้าตัวอย่างนำไปใช้ ${usedCount} จาก ${colorEntries.length} สี</strong> (สีที่ค่าเดียวกันนับว่าใช้ร่วมกัน) แต่ละสีบอกว่าถูกใช้ตรงไหน สีที่ “ไม่ได้ใช้ในตัวอย่าง” ยังมีอยู่ในไฟล์ DESIGN.md และ tokens.css</p>${palette}` },
    { id: 'ai', label: 'คำสั่งให้ AI', count: 0, html: aiHtml },
    typo && { id: 'type', label: 'ตัวอักษร', count: tyEntries.length, html: typo },
    shapes && { id: 'shapes', label: 'รูปทรงและระยะห่าง', count: 0, html: shapes },
    compHtml && { id: 'comps', label: 'คอมโพเนนต์', count: comps.length, html: compHtml },
    rulesHtml.trim() && { id: 'rules', label: 'ลักษณะเด่นและกฎ', count: keyChars.length + dos.length + donts.length, html: `<div class="prose rules">${rulesHtml}</div>` },
    { id: 'doc', label: 'เอกสารฉบับเต็ม', count: 0, html: `<article class="prose doc-prose">${renderMarkdown(b.body)}</article>` }
  ].filter(Boolean);

  const html = `<section class="hero-b"><div class="wrap">
    <p class="crumb"><a href="../../">หน้าแรก</a> / ${esc(b.name)}</p>
    <h1>${esc(b.name)}</h1>
    <div class="tagrow">${[...b.vibes.map((v) => `<span class="tag vibe">${esc(VIBES[v])}</span>`), `<span class="tag">${TONE[b.tone]}</span>`, b.corner ? `<span class="tag">${CORNER[b.corner]}</span>` : '', b.fontKind ? `<span class="tag">${FONTK[b.fontKind]}</span>` : ''].join('')}</div>
    <p class="lead">${esc(b.th || firstSentence(b.description, 320))}</p>
    ${b.uses.length ? `<p class="uses"><b>เหมาะกับ:</b> ${b.uses.map((u) => esc(USES[u])).join(' · ')}</p>` : ''}
    ${b.th ? `<details class="orig"><summary>ดูคำอธิบายต้นฉบับ (อังกฤษ)</summary><p>${esc(plain(b.description))}</p></details>` : ''}
    <div class="actions">
      <a class="btn primary" href="../../d/${esc(b.slug)}/DESIGN.md" download="DESIGN.md">⬇ ดาวน์โหลด DESIGN.md</a>
      <button class="btn" data-fetchcopy="../../d/${esc(b.slug)}/DESIGN.md">คัดลอกเนื้อหา</button>
      <a class="btn" href="../../d/${esc(b.slug)}/tokens.css" download="${esc(b.slug)}-tokens.css">tokens.css</a>
      <a class="btn" href="../../d/${esc(b.slug)}/tokens.json" download="${esc(b.slug)}-tokens.json">tokens.json</a>
      <a class="btn" href="../../mix/?c=${esc(b.slug)}&t=${esc(b.slug)}&s=${esc(b.slug)}&f=${esc(b.slug)}">ใช้เป็นฐานผสมสไตล์ →</a>
    </div>
    <div class="prompt"><span class="muted">วางไฟล์ที่รากโปรเจกต์แล้วสั่ง AI:</span><code id="prompt">${esc(prompt)}</code><button class="btn sm" data-copy="${esc(prompt)}">คัดลอก</button></div>
    ${b.format === 'legacy' ? '<p class="note">ไฟล์นี้เป็นรูปแบบเอกสารเก่า (ไม่มี token แบบ YAML) หน้านี้จึงแสดงสีที่ดึงจากข้อความเท่าที่อ่านได้</p>' : ''}
  </div></section>
  <div class="wrap content">
    <section><h2>ตัวอย่างการนำดีไซน์ไปใช้</h2><p class="muted"><strong>ไม่ใช่การจำลองหน้าเว็บจริงของ ${esc(b.name)}</strong> — เป็นหน้า landing page ทั่วไป (โครงเลย์เอาต์และข้อความเราเขียนเอง) ที่นำ <em>สี ตัวอักษร รัศมีมุม และ padding ปุ่ม</em> จาก DESIGN.md มาใส่ เพื่อให้เห็นความรู้สึกโดยรวมของดีไซน์นี้ ส่วนที่เป็นเอกลักษณ์เฉพาะแบรนด์ เช่น ภาพ จังหวะการจัดวาง และเอฟเฟกต์ ยังไม่ได้ถูกนำมาแสดง ฟอนต์เสียเงินแสดงด้วยฟอนต์ใกล้เคียงแทน</p>${(b.traits || []).length ? `<p class="feel"><b>ลักษณะที่อ่านจากเอกสารและนำมาใช้ในตัวอย่าง:</b> ${b.traits.map((x) => `<span class="tag">${esc(x)}</span>`).join(' ')}</p>` : ''}${mockup}</section>
    <div class="tabs-wrap" id="tabs">
      <div class="tabbar" role="tablist" aria-label="รายละเอียดดีไซน์">${tabDefs.map((d, i) => `<button role="tab" id="tab-${d.id}" aria-controls="panel-${d.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" class="tabbtn">${d.label}${d.count ? ` <span class="count">${d.count}</span>` : ''}</button>`).join('')}</div>
      ${tabDefs.map((d) => `<section class="tp" role="tabpanel" id="panel-${d.id}" aria-labelledby="tab-${d.id}"><h2 class="tp-h">${d.label}</h2>${d.html}</section>`).join('')}
    </div>
    <nav class="pager"><a href="../${esc(prev.slug)}/">← ${esc(prev.name)}</a><a href="../${esc(next.slug)}/">${esc(next.name)} →</a></nav>
  </div>`;
  return PAGE(`${b.name} — ${SITE.title}`, html, { depth: 2, desc: firstSentence(b.description, 150) });
}

/* ---------- main ---------- */
function main() {
  if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  mkdirSync(join(OUT, 'assets'), { recursive: true });
  copyFileSync(join(ROOT, 'src', 'style.css'), join(OUT, 'assets', 'style.css'));
  copyFileSync(join(ROOT, 'src', 'app.js'), join(OUT, 'assets', 'app.js'));
  copyFileSync(join(ROOT, 'src', 'preview.css'), join(OUT, 'assets', 'preview.css'));
  copyFileSync(join(ROOT, 'src', 'layouts.mjs'), join(OUT, 'assets', 'layouts.js'));
  copyFileSync(join(ROOT, 'src', 'mix.js'), join(OUT, 'assets', 'mix.js'));
  copyFileSync(join(ROOT, 'src', 'compare.js'), join(OUT, 'assets', 'compare.js'));
  copyFileSync(join(ROOT, 'src', 'gallery.js'), join(OUT, 'assets', 'gallery.js'));
  copyFileSync(join(ROOT, 'src', 'prompt.mjs'), join(OUT, 'assets', 'prompt.js'));

  const slugs = readdirSync(CONTENT).filter((d) => statSync(join(CONTENT, d)).isDirectory() && existsSync(join(CONTENT, d, 'DESIGN.md'))).sort();
  const brands = [];
  const problems = [];
  for (const s of slugs) {
    try {
      const b = loadBrand(s);
      if (!Object.keys(b.tokens.colors).length) problems.push(`${s}: ไม่พบสีที่อ่านได้`);
      if (!catOf[s]) problems.push(`${s}: ยังไม่ได้จัดหมวดใน categories.json`);
      brands.push(b);
    } catch (e) { problems.push(`${s}: อ่านไฟล์ไม่สำเร็จ (${e.message})`); }
  }

  const mixBrands = [];
  for (const b of brands) {
    const dir = join(OUT, 'b', b.slug); mkdirSync(dir, { recursive: true });
    const lctx = { v: V.preview, vLayouts: V.layouts };
    const pd = join(OUT, 'p', b.slug); mkdirSync(pd, { recursive: true });
    writeFileSync(join(pd, 'index.html'), renderLanding(b, deriveTheme(b.tokens.colors, { dark: b.darkHint, forceNight: b.forceNight }), lctx));
    b.usage = lctx.usage || [];
    b.traits = lctx.traits || [];
    mixBrands.push({ slug: b.slug, name: b.name, vars: Object.fromEntries((lctx.vars || '').split(';').filter(Boolean).map((p) => { const i = p.indexOf(':'); return [p.slice(2, i), p.slice(i + 1)]; })), classes: (lctx.classes || '').split(' ').filter(Boolean), hasBand: !!lctx.hasBand, tileCount: lctx.tileCount || 0, dark: !!lctx.dark, fonts: lctx.fonts || {} });
    writeFileSync(join(dir, 'index.html'), renderBrandPage(b, brands));
    const dd = join(OUT, 'd', b.slug); mkdirSync(dd, { recursive: true });
    writeFileSync(join(dd, 'DESIGN.md'), b.raw.replace(/\s*$/, '') + thaiSection(b));
    writeFileSync(join(dd, 'tokens.css'), tokenCss(b));
    writeFileSync(join(dd, 'tokens.json'), JSON.stringify({ name: b.name, source: SITE.upstream, ...b.tokens, fonts: { display: b.fonts.display, body: b.fonts.body, thaiDisplay: b.fonts.thaiDisplay, thaiBody: b.fonts.thaiBody, note: 'Latin fonts have no Thai glyphs: use the Thai fonts for Thai content, body line-height >= 1.7, no letter-spacing.' } }, null, 2));
  }

  // index
  const count = (fn) => brands.filter(fn).length;
  const chip = (key, v, label, n) => `<button class="chip" data-v="${esc(v)}" aria-pressed="false">${esc(label)} <span>${n}</span></button>`;
  const group = (key, label, items) => `<div class="fgroup" data-key="${key}"><span class="flabel">${label}</span><div class="chips">${items.join('')}</div></div>`;
  const filters = [
    group('vibes', 'ความรู้สึก', Object.entries(VIBES).map(([k, l]) => chip('vibes', k, l, count((x) => x.vibes.includes(k))))),
    group('uses', 'เหมาะกับ', Object.entries(USES).map(([k, l]) => chip('uses', k, l, count((x) => x.uses.includes(k))))),
    group('tone', 'โทน', Object.entries(TONE).filter(([k]) => count((x) => x.tone === k) > 0).map(([k, l]) => chip('tone', k, l, count((x) => x.tone === k)))),
    group('corner', 'มุม', Object.entries(CORNER).map(([k, l]) => chip('corner', k, l, count((x) => x.corner === k))))
  ].join('');
  const cards = brands.map((b) => {
    const th = deriveTheme(b.tokens.colors, { dark: b.darkHint, forceNight: b.forceNight });
    const labels = [...b.vibes.map((v) => VIBES[v]), TONE[b.tone]];
    const q = [b.name, b.slug, b.th, plain(b.description), ...labels, ...b.uses.map((u) => USES[u])].join(' ').toLowerCase();
    return `<div class="card-wrap"><a class="card" href="b/${esc(b.slug)}/" data-vibes="${esc(b.vibes.join(' '))}" data-uses="${esc(b.uses.join(' '))}" data-tone="${b.tone}" data-corner="${b.corner}" data-pri="${esc(css(th.primary, ''))}" data-q="${esc(q)}">
      <div class="card-top" style="background:${css(th.bg, '#fff')};color:${css(th.ink, '#111')}"><span class="card-name">${esc(b.name)}</span><span class="card-pill" style="background:${css(th.primary, '#333')};color:${css(th.onPrimary, '#fff')}">Aa</span></div>
      <div class="strip">${swatches(b.tokens.colors)}</div>
      <div class="strip">${swatches(b.tokens.colors)}</div>
      <div class="card-body"><div class="mini-tags">${labels.slice(0, 3).map((l) => `<span>${esc(l)}</span>`).join('')}</div><p>${esc(b.th || firstSentence(b.description, 110))}</p></div></a><button type="button" class="cmp-btn" data-cmp="${esc(b.slug)}" data-name="${esc(b.name)}" aria-pressed="false" aria-label="เพิ่ม ${esc(b.name)} เข้าเปรียบเทียบ">+ เทียบ</button></div>`;
  }).join('');
  // 3-question style finder (answers are matched against the cards' data attributes in the browser)
  const WIZ = [
    ['food', 'ร้านอาหาร / คาเฟ่', 'consumer', 'full-hero'], ['health', 'คลินิก / สุขภาพ', 'other', 'single'], ['shop', 'ร้านค้าออนไลน์', 'consumer', 'card-grid'], ['edu', 'โรงเรียน / คอร์ส', 'other', 'z-pattern'],
    ['trade', 'รับเหมา / ช่าง', 'other', 'sticky-footer'], ['gov', 'หน่วยงาน / องค์กร', 'other', 'f-pattern'], ['portfolio', 'พอร์ตโฟลิโอ', 'consumer', 'masonry'], ['saas', 'SaaS / เทค', 'dev', 'hero']
  ];
  const wizard = `<section class="wrap wiz" id="wizard" aria-labelledby="wizH"><h2 id="wizH">ไม่รู้จะเริ่มจากไหน? ตอบ 3 ข้อ แล้วเราแนะนำให้</h2>
    <div class="wiz-q"><b>1. เว็บของคุณคืออะไร</b><div class="chips" role="group" aria-label="ประเภทเว็บ">${WIZ.map(([k, l, c, ly]) => `<button type="button" class="chip" data-wq="uses" data-v="${k}" data-cat="${c}" data-l="${ly}" aria-pressed="false">${esc(l)}</button>`).join('')}</div></div>
    <div class="wiz-q"><b>2. อยากให้คนรู้สึกอย่างไร <small class="muted">(ไม่บังคับ)</small></b><div class="chips" role="group" aria-label="ความรู้สึก">${Object.entries(VIBES).map(([k, l]) => `<button type="button" class="chip" data-wq="vibes" data-v="${k}" aria-pressed="false">${esc(l)}</button>`).join('')}</div></div>
    <div class="wiz-q"><b>3. สว่างหรือมืด <small class="muted">(ไม่บังคับ)</small></b><div class="chips" role="group" aria-label="โทนสี"><button type="button" class="chip" data-wq="tone" data-v="light" aria-pressed="false">โทนสว่าง</button><button type="button" class="chip" data-wq="tone" data-v="dark" aria-pressed="false">โทนมืด</button></div></div>
    <div id="wizOut" aria-live="polite" hidden></div></section>`;
  // before/after gallery: data, screenshots (WebP) and the generated pages live in gallery-before-after/ (made outside the build); the build only lays them out
  const GAL_DIR = join(ROOT, 'gallery-before-after');
  let galTeaser = '', galleryPage = null;
  if (existsSync(join(GAL_DIR, 'gallery.json'))) {
    const G = JSON.parse(readFileSync(join(GAL_DIR, 'gallery.json'), 'utf8'));
    const gout = join(OUT, 'gallery', G.id);
    mkdirSync(gout, { recursive: true });
    const webpSize = (f) => {
      const b = readFileSync(f), t = b.toString('ascii', 12, 16);
      if (t === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
      if (t === 'VP8L') { const v = b.readUInt32LE(21); return { w: (v & 0x3fff) + 1, h: ((v >> 14) & 0x3fff) + 1 }; }
      return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
    };
    const items = G.items.map((it) => {
      const shots = {};
      for (const [k, rel] of Object.entries(it.shots || {})) {
        const webp = rel.replace(/\.png$/i, '.webp'), src = join(GAL_DIR, webp);
        if (!existsSync(src)) { problems.push(`gallery: ไม่พบภาพ ${webp} (แปลง PNG เป็น WebP ก่อน)`); continue; }
        mkdirSync(dirname(join(gout, webp)), { recursive: true });
        copyFileSync(src, join(gout, webp));
        shots[k] = { src: `${G.id}/${webp}`, ...webpSize(src) };
      }
      let html = '';
      if (it.html && existsSync(join(GAL_DIR, it.html))) { copyFileSync(join(GAL_DIR, it.html), join(gout, it.html)); html = `${G.id}/${it.html}`; }
      const name = it.style ? displayName(it.style) : '';
      return { slug: it.slug, label: it.label, style: it.style || null, name, notes: it.notes || '', html, mix: it.mix_link ? '../' + it.mix_link.replace(/^\//, '') : '', shots };
    });
    const before = items.find((x) => !x.style), afters = items.filter((x) => x.style);
    // prompts.md: 1st fenced block = shared brief, 2nd = "before" addition, 3rd = "after" addition; the bullets under "หมายเหตุเรื่องความโปร่งใส" are shown as-is
    const md = existsSync(join(GAL_DIR, G.brief_file || 'prompts.md')) ? readFileSync(join(GAL_DIR, G.brief_file || 'prompts.md'), 'utf8').replace(/\r/g, '') : '';
    const blocks = [...md.matchAll(/```\n([\s\S]*?)```/g)].map((m) => m[1].trim());
    const brief = blocks[0] || '', fill = (t) => (t || '').replace('[โจทย์ร่วม]', brief);
    const notes = ((md.split(/##\s*หมายเหตุเรื่องความโปร่งใส[^\n]*\n/)[1] || '').split('\n').filter((l) => /^-\s/.test(l)).map((l) => l.replace(/^-\s*/, '')));
    if (before && afters.length) {
      const first = afters[0], sh = (it, k) => it.shots[k];
      galTeaser = `<section class="wrap gal-teaser" id="before-after" aria-labelledby="galH"><h2 id="galH">AI ตัวเดียวกัน โจทย์เดียวกัน ต่างกันแค่ไฟล์ DESIGN.md</h2>
    <p class="muted">โจทย์: ${esc(G.title)} (${esc(G.business)}) ซ้ายคือสั่งแบบปกติ ขวาคือแนบไฟล์ DESIGN.md ของสไตล์ ${esc(first.name)}</p>
    <div class="gal-cmp">${[[before, 'ก่อน: ไม่มี DESIGN.md', 'หน้าเว็บที่ AI สร้างโดยไม่มี DESIGN.md'], [first, `หลัง: แนบ DESIGN.md (${first.name})`, `หน้าเว็บที่ AI สร้างโดยแนบ DESIGN.md สไตล์ ${first.name}`]].map(([it, cap, alt]) => `<a class="gal-fig" href="gallery/"><figure><div class="gal-shot desktop fold"><img src="gallery/${esc(sh(it, 'desktop_fold').src)}" width="${sh(it, 'desktop_fold').w}" height="${sh(it, 'desktop_fold').h}" alt="${esc(alt)}" loading="lazy" decoding="async"></div><figcaption>${esc(cap)}</figcaption></figure></a>`).join('')}</div>
    <p class="gal-more"><a class="btn primary" href="gallery/">ดูก่อน–หลังทั้งชุด · ${afters.length} สไตล์ · ดูแบบมือถือได้ →</a><span class="muted">ร้านสมมติ สร้างโดย Claude ครั้งเดียว ผลของคุณอาจต่างไป</span></p></section>`;
      const opts = (arr, attr, on) => arr.map(([k, l], i) => `<button type="button" class="chip${i === on ? ' on' : ''}" data-${attr}="${k}" aria-pressed="${i === on}">${esc(l)}</button>`).join('');
      const pbox = (title, text) => `<article class="pcard"><div class="phead"><h3>${esc(title)}</h3></div><pre>${esc(text)}</pre><button class="btn sm" type="button" data-copy="${esc(text)}">คัดลอกคำสั่ง</button></article>`;
      const data = JSON.stringify({ before, afters }).replace(/</g, '\\u003c');
      galleryPage = PAGE(`ก่อน–หลัง — ${SITE.title}`, `<section class="hero"><div class="wrap"><p class="eyebrow">ดูผลจริง · ${esc(G.title)}</p><h1>ก่อน–หลัง</h1><p class="lead">AI ตัวเดียวกัน โจทย์เดียวกัน ต่างกันแค่ว่าแนบไฟล์ DESIGN.md หรือไม่ เลือกสไตล์ ดูแบบเดสก์ท็อปหรือมือถือ แล้วเทียบกันเอง</p></div></section>
  <section class="wrap gal" id="gal"><div class="gal-ctrl">
    <div class="fgroup"><span class="flabel">สไตล์ที่แนบ</span><div class="chips" role="group" aria-label="สไตล์ที่แนบ">${afters.map((a, i) => `<button type="button" class="chip${i === 0 ? ' on' : ''}" data-gs="${esc(a.slug)}" aria-pressed="${i === 0}">${esc(a.name)}</button>`).join('')}</div></div>
    <div class="fgroup"><span class="flabel">อุปกรณ์</span><div class="chips" role="group" aria-label="อุปกรณ์">${opts([['desktop', 'เดสก์ท็อป'], ['mobile', 'มือถือ']], 'gd', 0)}</div></div>
    <div class="fgroup"><span class="flabel">มุมมอง</span><div class="chips" role="group" aria-label="มุมมอง">${opts([['fold', 'หน้าจอแรก'], ['full', 'ทั้งหน้า (เลื่อนดูในกรอบ)']], 'gv', 0)}</div></div></div>
    <div class="gal-cmp gal-big"><figure class="gal-fig"><figcaption><b>${esc(before.label)}</b><small>${esc(before.notes)}</small></figcaption><div class="gal-shot desktop fold" id="galBeforeBox"><img id="galBeforeImg" alt="" decoding="async"></div><div class="actions">${before.html ? `<a class="btn sm" href="${esc(before.html)}" target="_blank" rel="noopener">เปิดหน้า HTML จริง ↗</a>` : ''}</div></figure>
    <figure class="gal-fig"><figcaption><b id="galAfterLabel"></b><small id="galAfterNotes"></small></figcaption><div class="gal-shot desktop fold" id="galAfterBox"><img id="galAfterImg" alt="" decoding="async"></div><div class="actions" id="galAfterActs"></div></figure></div>
    <p class="muted gal-lead">${esc(G.business)} · ${esc(G.title)} · สร้างเมื่อ ${esc(G.created)}</p>
    <div class="gal-trust"><h2>ความโปร่งใส</h2><ul>${[`<b>สร้างโดย:</b> ${esc(G.generator)}`, ...notes.map(esc), 'ผลของ AI แต่ละครั้งไม่เหมือนกัน นี่คือตัวอย่างหนึ่งครั้ง ไม่ใช่การรับประกันผล', 'ร้านนี้เป็นร้านสมมติ เบอร์โทร LINE และตัวเลขทั้งหมดเป็นข้อมูลตัวอย่าง', 'ชื่อสไตล์ที่ระบุคือไฟล์ DESIGN.md ที่แนบ เป็นการวิเคราะห์เชิงแรงบันดาลใจ ไม่ใช่เว็บหรือไฟล์ทางการของแบรนด์นั้น'].map((x) => `<li>${x}</li>`).join('')}</ul></div>
    <h2>คำสั่งที่ใช้</h2><p class="muted">ลองสั่งซ้ำกับเครื่องมือของคุณเองได้ ไฟล์ DESIGN.md และ tokens.css ของแต่ละสไตล์ดาวน์โหลดได้จากหน้าสไตล์นั้น</p>
    <div class="pgrid">${pbox('โจทย์ร่วม (ใช้ทุกหน้า)', brief)}${pbox('ก่อน: ไม่มี DESIGN.md', fill(blocks[1]))}${pbox('หลัง: แนบ DESIGN.md + tokens.css', fill(blocks[2]))}</div></section>
  <script type="application/json" id="galData">${data}</script><script src="../assets/gallery.js?v=${V.gallery}" defer></script>`, { depth: 1 });
    }
  }

  // curated mix recipes: same simple header as the brand cards, painted with the colors the recipe takes from its color brand
  const mbBy = Object.fromEntries(mixBrands.map((m) => [m.slug, m]));
  const recipes = `<section class="wrap recipes" id="recipes"><h2>สูตรผสมแนะนำ ${REC.length} แบบ</h2><p class="muted">คัดมาให้สำหรับธุรกิจที่พบบ่อย กดเปิดแล้วปรับต่อในหน้าผสมสไตล์ ดาวน์โหลดเป็น DESIGN.md ที่มีฟอนต์ไทยได้เลย</p><div class="rec-grid">${REC.map((r) => {
    for (const k of ['c', 't', 's', 'f']) if (!mbBy[r[k]]) problems.push(`recipes.json: ไม่พบแบรนด์ ${r[k]} ในสูตร ${r.id}`);
    if (!['c', 't', 's', 'f'].every((k) => mbBy[r[k]])) return '';
    const v = mbBy[r.c].vars, nm = (k) => esc(mbBy[k].name);
    const strip = ['bg', 'pri', 'band1', 'soft1', 'a1', 'a2'].map((k) => `<i style="background:${css(v[k], '#ccc')}"></i>`).join('');
    return `<a class="card rec-card" href="mix/?c=${esc(r.c)}&t=${esc(r.t)}&s=${esc(r.s)}&f=${esc(r.f)}&cat=${esc(r.cat)}&l=${esc(r.l)}"><div class="card-top" style="background:${css(v.bg, '#fff')};color:${css(v.ink, '#111')}"><span class="card-name">${esc(r.name)}</span><span class="card-pill" style="background:${css(v.pri, '#333')};color:${css(v.onpri, '#fff')}">Aa</span></div><div class="strip">${strip}</div><div class="card-body"><div class="mini-tags"><span>${esc(r.for)}</span></div><p>${esc(r.desc)}</p><p class="rec-src">สี ${nm(r.c)} · ตัวอักษร ${nm(r.t)} · รูปทรง ${nm(r.s)} · ความรู้สึก ${nm(r.f)}</p></div></a>`;
  }).join('')}</div></section>`;
  const indexHtml = `<section class="hero"><div class="wrap">
    <p class="eyebrow">แหล่งไอเดียดีไซน์ · ไม่แสวงหาผลกำไร</p>
    <h1>${esc(SITE.headline)}</h1>
    <p class="lead">${esc(SITE.description)}</p>
    <p class="hero-cta"><a class="btn primary" href="mix/">✨ ผสมสไตล์ของคุณเอง</a> <a class="btn" href="patterns/">ดูรูปแบบเลย์เอาต์ 14 แบบ</a></p>
    <div class="stats"><div><b>${brands.length}</b><span>สไตล์ดีไซน์</span></div><div><b>${Object.keys(VIBES).length}</b><span>แนวความรู้สึก</span></div><div><b>${brands.filter((b) => b.format === 'tokens').length}</b><span>มี design tokens</span></div></div>
  </div></section>
  ${galTeaser}
  ${wizard}
  ${recipes}
  <section class="wrap" id="brands">
    <div class="tools"><input id="q" type="search" placeholder="ค้นหา เช่น มืด, อบอุ่น, ร้านค้า, stripe…" aria-label="ค้นหา">
      <div class="filters">${filters}</div>
      <div class="fbar"><span id="shown" class="muted" aria-live="polite"></span><button id="clear" class="btn sm" type="button" hidden>ล้างตัวกรอง</button></div></div>
    <p id="empty" class="muted" hidden>ไม่พบสไตล์ที่ตรงกับตัวกรอง ลองลดเงื่อนไขลงหรือกด “ล้างตัวกรอง”</p>
    <div class="grid" id="grid">${cards}</div>
  </section>`;
  writeFileSync(join(OUT, 'index.html'), PAGE(SITE.title, indexHtml));

  // about
  mkdirSync(join(OUT, 'about'), { recursive: true });
  writeFileSync(join(OUT, 'about', 'index.html'), PAGE(`วิธีใช้ — ${SITE.title}`, `<section class="wrap content narrow"><h1>วิธีใช้</h1>
    <h2>DESIGN.md คืออะไร</h2><p>ไฟล์ markdown ธรรมดาที่บรรยายระบบดีไซน์ของเว็บ (สี ตัวอักษร ระยะห่าง คอมโพเนนต์ กฎการใช้งาน) เพื่อให้ AI ที่ช่วยเขียนโค้ดอ่านแล้วสร้าง UI ที่หน้าตาสอดคล้องกัน</p>
    <h2>ใช้งาน 3 ขั้น</h2><ol><li>เลือกแบรนด์จากหน้าแรกและดูตัวอย่าง</li><li>กด “ดาวน์โหลด DESIGN.md” แล้ววางไว้ที่รากโปรเจกต์ของคุณ</li><li>สั่ง AI เช่น “อ่าน DESIGN.md แล้วสร้างหน้า landing page ตามสไตล์นี้”</li></ol>
    <h2>ไม่รู้จะเลือกสไตล์ไหน</h2><p>ใช้ตัวกรองหน้าแรก: เลือก <strong>ความรู้สึก</strong> ที่อยากได้ (เช่น มินิมอล อบอุ่น หรูหรา) แล้วเลือก <strong>เหมาะกับ</strong> ประเภทเว็บของคุณ จากนั้นเปิดดู 2–3 แบบเทียบกัน ป้าย “โทน” และ “มุม” คำนวณจากไฟล์ DESIGN.md โดยตรง ส่วนสรุปภาษาไทยและป้ายความรู้สึก/การใช้งานเขียนจากคำอธิบายในไฟล์ อาจไม่ตรงกับความเห็นของทุกคน</p>
    <h2>ให้ AI สร้างเว็บให้ แต่ไม่ให้ออกมาหน้าตาเดิมๆ</h2><p>AI มักออกแบบแบบกลางๆ ถ้าไม่ได้รับข้อกำหนดที่ชัดเจน การวางไฟล์ <code>DESIGN.md</code> กับ <code>tokens.css</code> ไว้ในโปรเจกต์ แล้วสั่งตามแท็บ “คำสั่งให้ AI” ในหน้าแบรนด์ จะบังคับให้ AI ใช้สี ฟอนต์ และมุมโค้งที่คุณเลือก และควรเปลี่ยนชื่อ โลโก้ ภาพ และข้อความเป็นของคุณเสมอ</p>
    <h2>ข้อควรรู้</h2><ul><li>ไฟล์เหล่านี้เป็นการ “วิเคราะห์เชิงแรงบันดาลใจ” จากเว็บไซต์จริง ใช้เพื่อการเรียนรู้ ไม่ใช่ไฟล์ทางการของแบรนด์</li><li>หน้าตัวอย่างบนเว็บนี้เป็นหน้าทั่วไปที่นำสี ตัวอักษร และมุมโค้งของแบรนด์มาใส่ <strong>ไม่ใช่การจำลองเว็บจริงของแบรนด์นั้น</strong></li><li>ไม่ควรใช้โลโก้ ชื่อ หรือทำให้ผลงานของคุณดูเหมือนเป็นเว็บของแบรนด์นั้น</li><li>ฟอนต์บางตัวเป็นของเสียเงิน หน้าตัวอย่างจึงใช้ Inter แทน</li><li>ฟอนต์ละตินของแบรนด์ไม่มีตัวอักษรไทย ไฟล์ที่ดาวน์โหลดจึงมีส่วน “Thai Typography” ที่ระบุฟอนต์ไทยฟรีคู่กัน (เช่น Anuphan, Noto Serif Thai, IBM Plex Sans Thai) พร้อมกฎ line-height และการไม่ใช้ letter-spacing กับภาษาไทย หน้าตัวอย่างสลับดูเป็นภาษาไทยหรือ English ได้</li></ul>
    <h2>เกี่ยวกับโครงการ</h2><p>${esc(SITE.disclaimer)}</p></section>`, { depth: 1 }));

  // ---- Mix page + its live-preview frame + data ----
  mkdirSync(join(OUT, 'data'), { recursive: true });
  mkdirSync(join(OUT, 'mix', 'preview'), { recursive: true });
  const CAT_KEYS = ['ai', 'dev', 'work', 'finance', 'auto', 'consumer', 'hardware', 'other'];
  writeFileSync(join(OUT, 'data', 'mix.json'), JSON.stringify({
    brands: mixBrands, models: Object.fromEntries(CAT_KEYS.map((k) => [k, categoryModel(k)])),
    layouts: LAYOUTS.map(({ key, n, th, thai }) => ({ key, n, th, thai })),
    prompts: PROMPT_TYPES.map(({ key, title, extra }) => ({ key, title, extra }))
  }));
  const FONT_LINK = fontsUrl(ALL_THAI_FONTS);
  const mixGroup = (id, label, hint) => `<div class="mx-group"><label for="mx-${id}"><b>${label}</b><small>${hint}</small></label><select id="mx-${id}"></select><div class="mx-pv" id="pv-${id}" aria-hidden="true"></div></div>`;
  writeFileSync(join(OUT, 'mix', 'index.html'), PAGE(`ผสมสไตล์ — ${SITE.title}`, `<link href="${FONT_LINK}" rel="stylesheet">
  <section class="hero"><div class="wrap"><p class="eyebrow">สร้างดีไซน์ของคุณเอง</p><h1>ผสมสไตล์</h1><p class="lead">เลือก <b>สี</b> จากแบรนด์หนึ่ง <b>ตัวอักษร</b> จากอีกแบรนด์ <b>รูปทรง</b> และ <b>ความรู้สึก</b> จากแบรนด์อื่น แล้วดูผลสดในหน้าตัวอย่าง จากนั้นดาวน์โหลดเป็น DESIGN.md ใหม่ของคุณเอง ให้ AI สร้างเว็บที่ไม่เหมือนใคร ไม่ใช่หน้าตาเดิมๆ</p></div></section>
  <section class="wrap mix" id="mix" data-v="${V.mix}" data-pv="${V.prompt}">
    <div class="mix-ctrl">
      <div class="mx-box"><h2>1. เว็บของคุณ</h2>
        <label class="mx-f"><span>ชื่อเว็บ (ใช้แสดงในตัวอย่าง)</span><input id="mxName" type="text" maxlength="40" placeholder="Your Brand"></label>
        <label class="mx-f"><span>ประเภทเว็บ (กำหนดข้อความตัวอย่าง)</span><select id="mxCat"></select></label>
        <label class="mx-f"><span>เลย์เอาต์ (14 แบบ)</span><select id="mxLayout"></select></label>
        <label class="mx-f"><span>ภาษาของตัวอย่าง</span><select id="mxLang"></select></label></div>
      <div class="mx-box"><h2>2. เลือกส่วนผสม</h2>
        ${mixGroup('colors', 'สี', 'พื้นหลัง ตัวอักษร ปุ่ม แถบเข้ม สีเน้น')}${mixGroup('type', 'ตัวอักษร', 'ฟอนต์ ขนาด น้ำหนัก ระยะห่าง')}${mixGroup('shape', 'รูปทรง', 'มุมโค้งปุ่ม/การ์ด padding')}${mixGroup('feel', 'ความรู้สึก', 'เงา gradient ตัวพิมพ์ใหญ่ การ์ดสีบล็อก')}
        <div class="mx-row"><button class="btn sm" id="mxRandom" type="button">🎲 สุ่ม</button><button class="btn sm" id="mxReset" type="button">รีเซ็ต</button><select id="mxAll" aria-label="ตั้งทุกกลุ่มเป็นแบรนด์เดียว"></select></div></div>
      <div class="mx-box"><h2>3. ปรับสีหลักของคุณ <small>(ไม่บังคับ)</small></h2>
        <label class="mx-f inline"><input id="mxPriOn" type="checkbox"><span>ใช้สีหลักของฉันแทนสีของแบรนด์ต้นแบบ</span><input id="mxPri" type="color" value="#533afd" aria-label="สีหลัก"></label>
        <ul class="mx-warn" id="mxWarn" aria-live="polite"></ul></div>
    </div>
    <div class="mix-view">
      <div class="mx-dev device-bar" role="group" aria-label="ขนาดหน้าจอ"><button class="chip on" data-w="100%" type="button">เดสก์ท็อป</button><button class="chip" data-w="820px" type="button">แท็บเล็ต</button><button class="chip" data-w="390px" type="button">มือถือ</button><button class="btn sm" id="mxShare" type="button" style="margin-left:auto">🔗 คัดลอกลิงก์การผสมนี้</button></div>
      <div class="device-wrap"><iframe id="mxFrame" class="device" src="./preview/" title="ตัวอย่างหน้าเว็บจากสไตล์ที่ผสม"></iframe></div>
    </div>
  </section>
  <button class="btn primary mx-jump" id="mxJump" type="button" aria-live="polite">👁 ดูตัวอย่าง</button>
  <section class="wrap mix-out" id="mxExport"><h2>ดาวน์โหลดผลงานของคุณ</h2>
    <p class="muted">ไฟล์ที่ได้เป็นภาษาอังกฤษแบบเดียวกับ DESIGN.md ต้นแบบ เพื่อให้ AI อ่านเข้าใจ ใช้ชื่อเว็บและสีที่คุณเลือก และระบุแหล่งแรงบันดาลใจไว้ท้ายไฟล์</p>
    <div class="actions"><button class="btn primary" id="mxDlMd" type="button">⬇ DESIGN.md</button><button class="btn" id="mxDlCss" type="button">tokens.css</button><button class="btn" id="mxDlJson" type="button">tokens.json</button><button class="btn" id="mxCopyMd" type="button">คัดลอก DESIGN.md</button></div>
    <p class="mx-src"><b>ส่วนผสมที่ใช้:</b></p><ul class="plain-list" id="mxSrc"></ul>
    <details class="doc"><summary>ดูตัวอย่างเนื้อหา DESIGN.md ที่สร้างขึ้น</summary><textarea id="mxMdText" readonly rows="18" aria-label="เนื้อหา DESIGN.md"></textarea></details>
    <h3>คำสั่งให้ AI</h3><div class="mx-pctl"><label class="mx-f"><span>ประเภทเว็บ</span><select id="mxPrompt"></select></label><label class="mx-f"><span>เครื่องมือ AI ที่จะใช้</span><select id="mxTool">${TOOLS.map((t) => `<option value="${t.key}">${esc(t.label)}</option>`).join('')}</select></label><label class="mx-f"><span>บริการหรือสินค้าหลัก</span><input id="mxOffer" type="text" maxlength="120" placeholder="เช่น กาแฟคั่วเอง เบเกอรี่"></label><label class="mx-f"><span>กลุ่มลูกค้า</span><input id="mxAud" type="text" maxlength="120" placeholder="เช่น คนทำงานย่านอารีย์"></label></div><p class="muted pnote">ชื่อเว็บใช้ช่อง “ชื่อเว็บ” ด้านบน กรอกแล้วคำสั่งอัปเดตทันที ข้อมูลไม่ถูกส่งไปไหน</p><textarea id="mxPromptText" readonly rows="12" aria-label="คำสั่งให้ AI"></textarea><div class="actions"><button class="btn sm" id="mxCopyPrompt" type="button">คัดลอกคำสั่ง</button></div>
    <p class="muted" style="margin-top:16px">ข้อควรรู้: การผสมสไตล์เป็นแรงบันดาลใจ ไม่ใช่การทำให้เหมือนแบรนด์ใดแบรนด์หนึ่ง ควรเปลี่ยนชื่อ โลโก้ ภาพ และข้อความเป็นของคุณเสมอ ฟอนต์ของแบรนด์ส่วนใหญ่เป็นของเสียเงิน ไฟล์ที่ได้ใช้ฟอนต์ใกล้เคียงที่หาได้ฟรี</p>
  </section>
  <script src="../assets/mix.js?v=${V.mix}" defer></script>`, { depth: 1 }));
  writeFileSync(join(OUT, 'mix', 'preview', 'index.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Mix preview</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="${FONT_LINK}" rel="stylesheet">
<link rel="stylesheet" href="../../assets/preview.css?v=${V.preview}"><style>.mixwait{padding:40px;text-align:center;font:14px system-ui;color:#667}</style></head>
<body><div id="app"><p class="mixwait">กำลังโหลดตัวอย่าง…</p></div>
<script type="module">
import { renderLayout, activate } from '../../assets/layouts.js?v=${V.layouts}';
const app = document.getElementById('app'); let cleanup = null;
function apply(d) {
  const y = window.scrollY; if (cleanup) cleanup();
  document.documentElement.style.cssText = d.style; document.documentElement.className = d.classes + ' framed'; document.documentElement.lang = d.model && d.model.lang === 'en' ? 'en' : 'th'; document.body.className = d.dark ? 'is-dark' : '';
  app.innerHTML = renderLayout(d.layout, d.model); cleanup = activate(app); window.scrollTo(0, y);
  parent.postMessage({ type: 'applied' }, location.origin);
}
window.addEventListener('message', (e) => { if (e.origin !== location.origin) return; const d = e.data; if (d && d.type === 'mix') apply(d); });
parent.postMessage({ type: 'ready' }, location.origin);
</script></body></html>`);

  if (galleryPage) { mkdirSync(join(OUT, 'gallery'), { recursive: true }); writeFileSync(join(OUT, 'gallery', 'index.html'), galleryPage); }

  // compare page + its data
  const fam1 = (f) => String(f || '').split(',')[0].replace(/["']/g, '').trim() || 'ฟอนต์ระบบ';
  writeFileSync(join(OUT, 'data', 'compare.json'), JSON.stringify({
    layouts: LAYOUTS.map(({ key, n, thai }) => ({ key, n, thai })),
    brands: Object.fromEntries(brands.map((b) => [b.slug, { name: b.name, th: b.th || firstSentence(b.description, 140), tags: [...b.vibes.map((v) => VIBES[v]), TONE[b.tone], b.corner ? CORNER[b.corner] : ''].filter(Boolean),
      colors: [...new Set(Object.values(b.tokens.colors).filter((v) => parseColor(v)).map((v) => css(v, '')).filter(Boolean))].slice(0, 8), font: fam1(b.fonts.displayName), thai: b.fonts.thaiDisplay }]))
  }));
  mkdirSync(join(OUT, 'compare'), { recursive: true });
  writeFileSync(join(OUT, 'compare', 'index.html'), PAGE(`เปรียบเทียบสไตล์ — ${SITE.title}`, `<section class="hero"><div class="wrap"><p class="eyebrow">เลือกให้ชัวร์ก่อนตัดสินใจ</p><h1>เปรียบเทียบสไตล์</h1><p class="lead">วาง 2–3 สไตล์เคียงกัน ใช้โครงหน้าและภาษาเดียวกัน จะเห็นความต่างของสี ตัวอักษร และมุมโค้งชัดขึ้น ตัวอย่างเป็นหน้าทั่วไปที่ใส่ tokens ของแบรนด์ ไม่ใช่หน้าจริงของแบรนด์นั้น</p></div></section>
  <section class="wrap cmp" id="cmp" data-v="${V.compare}"><div class="cmp-ctrl"><label class="mx-f"><span>สไตล์ที่ 1</span><select id="cmpS0"></select></label><label class="mx-f"><span>สไตล์ที่ 2</span><select id="cmpS1"></select></label><label class="mx-f"><span>สไตล์ที่ 3 (ไม่บังคับ)</span><select id="cmpS2"></select></label><label class="mx-f"><span>โครงหน้า</span><select id="cmpLayout"></select></label>
    <div class="mx-f"><span>ภาษาของตัวอย่าง</span><div class="chips"><button class="chip on" data-lg="th" type="button" aria-pressed="true">ไทย</button><button class="chip" data-lg="en" type="button" aria-pressed="false">English</button></div></div><div class="mx-f"><span>&nbsp;</span><button class="btn sm" id="cmpShare" type="button">🔗 คัดลอกลิงก์</button></div></div>
    <div class="cmp-cols n2" id="cmpCols"><p class="muted">กำลังโหลด…</p></div></section>
  <script src="../assets/compare.js?v=${V.compare}" defer></script>`, { depth: 1 }));

  // patterns gallery
  mkdirSync(join(OUT, 'patterns'), { recursive: true });
  const brandOpts = brands.map((x) => `<option value="${esc(x.slug)}"${x.slug === 'stripe' ? ' selected' : ''}>${esc(x.name)}</option>`).join('');
  const groups = [...new Set(LAYOUTS.map((l) => l.group))];
  const patternCards = LAYOUTS.map((l) => `<article class="pat" data-group="${esc(l.group)}"><div class="wire" aria-hidden="true">${WIRE[l.key] || ''}</div><div class="pat-body"><small class="pat-n">แบบที่ ${l.n} · ${esc(l.group)}</small><h3>${esc(l.th)} <span>${esc(l.thai)}</span></h3><p>${esc(l.desc)}</p><div class="tags">${l.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div><a class="btn primary sm" data-pat="${l.key}" href="../p/stripe/${l.key === 'hero' ? '' : '?layout=' + l.key}" target="_blank" rel="noopener">ดูตัวอย่างกับแบรนด์ที่เลือก ↗</a></div></article>`).join('');
  writeFileSync(join(OUT, 'patterns', 'index.html'), PAGE(`รูปแบบเลย์เอาต์ — ${SITE.title}`, `<section class="hero"><div class="wrap"><p class="eyebrow">โครงหน้าเว็บ 14 แบบ</p><h1>รูปแบบเลย์เอาต์</h1><p class="lead">เลือก “โครงหน้า” ที่เหมาะกับงานของคุณ แล้วดูว่าเมื่อใส่สไตล์ของแบรนด์ใดแบรนด์หนึ่งลงไป จะได้หน้าตาแบบไหน ทุกแบบใช้สี ตัวอักษร มุมโค้ง และคอมโพเนนต์จาก DESIGN.md ของแบรนด์ที่คุณเลือก</p>
    <div class="pat-pick"><label for="patBrand"><b>เลือกแบรนด์สำหรับดูตัวอย่าง</b></label><select id="patBrand">${brandOpts}</select></div></div></section>
    <section class="wrap pat-wrap"><div class="pat-grid">${patternCards}</div>
    <p class="muted pat-credit">ชื่อและการจัดหมวด 14 โครงหน้าอ้างอิงจากคอลเลกชัน <a href="https://html-layout-patterns.netlify.app/" target="_blank" rel="noopener noreferrer">HTML Layout Patterns</a> ที่ผู้จัดทำเว็บนี้รวบรวมไว้ เทมเพลตหน้าตัวอย่างในเว็บนี้เขียนขึ้นใหม่ทั้งหมด หากต้องการพิมพ์เขียวและทฤษฎีเชิงลึกของแต่ละโครงหน้า ดูได้ที่คอลเลกชันนั้น</p></section>`, { depth: 1 }));

  writeFileSync(join(OUT, 'brands.json'), JSON.stringify(brands.map((b) => ({ slug: b.slug, name: b.name, category: b.category, format: b.format, colors: Object.keys(b.tokens.colors).length })), null, 2));
  writeFileSync(join(OUT, '404.html'), PAGE('ไม่พบหน้านี้', '<section class="wrap content narrow"><h1>ไม่พบหน้านี้</h1><p><a href="/">กลับหน้าแรก</a></p></section>'));
  const sm = ['/', '/about/', '/patterns/', '/mix/', '/compare/', ...(galleryPage ? ['/gallery/'] : []), ...brands.map((b) => `/b/${b.slug}/`)];
  writeFileSync(join(OUT, 'sitemap.txt'), sm.map((p) => (SITE.url || '') + p).join('\n') + '\n');

  const legacy = brands.filter((b) => b.format === 'legacy').map((b) => b.slug);
  console.log(`✓ built ${brands.length} brands → public/`);
  console.log(`  dark hint (legacy): ${brands.filter((x) => x.darkHint).map((x) => x.slug).join(', ') || '-'}`);
  console.log(`  tokens format: ${brands.length - legacy.length} | legacy (colors from text): ${legacy.length}${legacy.length ? ' [' + legacy.join(', ') + ']' : ''}`);
  if (problems.length) console.log('  ⚠ ' + problems.join('\n  ⚠ '));
}
main();
