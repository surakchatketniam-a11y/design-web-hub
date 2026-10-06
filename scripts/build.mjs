#!/usr/bin/env node
// Static site generator: content/<slug>/DESIGN.md  ->  public/ (no database, no runtime server).
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, copyFileSync, rmSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { splitFrontMatter, parseYaml } from './lib/yaml.mjs';
import { renderMarkdown, esc } from './lib/md.mjs';
import { parseColor, deriveTheme, resolveRef, readableOn } from './lib/theme.mjs';
import { renderLanding, fontFor } from './lib/landing.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = join(ROOT, 'content');
const OUT = join(ROOT, 'public');
const SITE = JSON.parse(readFileSync(join(ROOT, 'site.config.json'), 'utf8'));
const CATS = JSON.parse(readFileSync(join(ROOT, 'categories.json'), 'utf8'));
const CUR = JSON.parse(readFileSync(join(ROOT, 'curation.json'), 'utf8'));
const VIBES = CUR.vibes, USES = CUR.uses;
const TONE = { light: 'โทนสว่าง', dark: 'โทนมืด', mixed: 'โทนผสม (สลับสว่าง/มืด)', mid: 'โทนกลาง' };
const CORNER = { sharp: 'มุมเหลี่ยม', soft: 'มุมโค้งเล็กน้อย', round: 'มุมโค้งมน/พิลล์' };
const FONTK = { serif: 'หัวข้อฟอนต์ serif', mono: 'ฟอนต์ monospace' };

// content-hash version for static assets, so a long browser cache can never serve a stale file
const ver = (f) => createHash('sha1').update(readFileSync(join(ROOT, 'src', f))).digest('hex').slice(0, 8);
const V = { css: ver('style.css'), js: ver('app.js'), preview: ver('preview.css') };

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
  return { slug, raw, body, tokens, format, description, darkHint: darkHint || forceDark, forceNight: forceDark, name: displayName(slug), category: catOf[slug] || 'other',
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
  <nav><a href="${base || './'}#brands">แบรนด์ทั้งหมด</a><a href="${base}about/">วิธีใช้</a><a href="${esc(SITE.upstream)}" target="_blank" rel="noopener noreferrer">ต้นทางข้อมูล ↗</a></nav>
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
  lines.push('}');
  return lines.join('\n') + '\n';
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
  { key: 'tool', title: 'แดชบอร์ด / เครื่องมือภายใน', uses: ['tool', 'docs', 'fin'], extra: 'ส่วนที่ต้องมี: sidebar, การ์ดสรุปตัวเลข, ตารางข้อมูลพร้อมค้นหา/กรอง, ฟอร์ม, ป้ายสถานะ' }
];
const promptText = (name, t) => `ฉันกำลังสร้าง${t.title} ช่วยออกแบบและเขียนโค้ดตามระบบดีไซน์ในไฟล์ DESIGN.md และ tokens.css ที่วางไว้ที่รากโปรเจกต์

เนื้อหาของฉัน: [ใส่ชื่อเว็บ ธุรกิจ และสิ่งที่อยากสื่อ]
${t.extra}

กติกา:
1. ยึดสี ฟอนต์ รัศมีมุม ระยะห่าง และคอมโพเนนต์ตาม DESIGN.md อย่างเคร่งครัด ห้ามเพิ่มสีหรือสไตล์ที่ไม่มีในไฟล์ (ใช้ค่าจาก tokens.css)
2. อ่านส่วน Do's and Don'ts ให้ครบและทำตาม
3. ใช้ชื่อ โลโก้ และข้อความของฉันเอง — ห้ามใช้ชื่อหรือโลโก้ของ ${name}
4. รองรับมือถือ และใช้ HTML ที่เข้าถึงได้ง่าย (semantic tags, คอนทราสต์ผ่านเกณฑ์)
5. ใช้ Tailwind CSS (หรือ CSS ธรรมดา) แล้วสรุปสั้นๆ ว่าตัดสินใจเรื่องดีไซน์อะไรไปบ้าง`;

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
      <a class="btn sm" href="${previewUrl}" target="_blank" rel="noopener">เปิดเต็มหน้าจอ ↗</a>
    </div>
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
    <div class="pgrid">${sortedPrompts.map((t) => { const rec = t.uses.some((u) => b.uses.includes(u)); const txt = promptText(b.name, t);
      return `<article class="pcard"><div class="phead"><h3>${esc(t.title)}</h3>${rec ? '<em class="rec">เหมาะกับสไตล์นี้</em>' : ''}</div><pre>${esc(txt)}</pre><button class="btn sm" data-copy="${esc(txt)}">คัดลอกคำสั่ง</button></article>`; }).join('')}</div>`;

  const tabDefs = [
    { id: 'colors', label: 'สี', count: colorEntries.length, html: `<p class="muted">คลิกที่สีเพื่อคัดลอกค่า · <strong>หน้าตัวอย่างนำไปใช้ ${usedCount} จาก ${colorEntries.length} สี</strong> (สีที่ค่าเดียวกันนับว่าใช้ร่วมกัน) แต่ละสีบอกว่าถูกใช้ตรงไหน สีที่ “ไม่ได้ใช้ในตัวอย่าง” ยังมีอยู่ในไฟล์ DESIGN.md และ tokens.css</p>${palette}` },
    { id: 'ai', label: 'คำสั่งให้ AI', count: 0, html: aiHtml },
    typo && { id: 'type', label: 'ตัวอักษร', count: tyEntries.length, html: typo },
    shapes && { id: 'shapes', label: 'รูปทรงและระยะห่าง', count: 0, html: shapes },
    compHtml && { id: 'comps', label: 'คอมโพเนนต์', count: comps.length, html: compHtml },
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
    </div>
    <div class="prompt"><span class="muted">วางไฟล์ที่รากโปรเจกต์แล้วสั่ง AI:</span><code id="prompt">${esc(prompt)}</code><button class="btn sm" data-copy="${esc(prompt)}">คัดลอก</button></div>
    ${b.format === 'legacy' ? '<p class="note">ไฟล์นี้เป็นรูปแบบเอกสารเก่า (ไม่มี token แบบ YAML) หน้านี้จึงแสดงสีที่ดึงจากข้อความเท่าที่อ่านได้</p>' : ''}
  </div></section>
  <div class="wrap content">
    <section><h2>ตัวอย่างการนำดีไซน์ไปใช้</h2><p class="muted"><strong>ไม่ใช่การจำลองหน้าเว็บจริงของ ${esc(b.name)}</strong> — เป็นหน้า landing page ทั่วไป (โครงเลย์เอาต์และข้อความเราเขียนเอง) ที่นำ <em>สี ตัวอักษร รัศมีมุม และ padding ปุ่ม</em> จาก DESIGN.md มาใส่ เพื่อให้เห็นความรู้สึกโดยรวมของดีไซน์นี้ ส่วนที่เป็นเอกลักษณ์เฉพาะแบรนด์ เช่น ภาพ จังหวะการจัดวาง และเอฟเฟกต์ ยังไม่ได้ถูกนำมาแสดง ฟอนต์เสียเงินแสดงด้วยฟอนต์ใกล้เคียงแทน</p>${mockup}</section>
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

  for (const b of brands) {
    const dir = join(OUT, 'b', b.slug); mkdirSync(dir, { recursive: true });
    const lctx = { v: V.preview };
    const pd = join(OUT, 'p', b.slug); mkdirSync(pd, { recursive: true });
    writeFileSync(join(pd, 'index.html'), renderLanding(b, deriveTheme(b.tokens.colors, { dark: b.darkHint, forceNight: b.forceNight }), lctx));
    b.usage = lctx.usage || [];
    writeFileSync(join(dir, 'index.html'), renderBrandPage(b, brands));
    const dd = join(OUT, 'd', b.slug); mkdirSync(dd, { recursive: true });
    writeFileSync(join(dd, 'DESIGN.md'), b.raw);
    writeFileSync(join(dd, 'tokens.css'), tokenCss(b));
    writeFileSync(join(dd, 'tokens.json'), JSON.stringify({ name: b.name, source: SITE.upstream, ...b.tokens }, null, 2));
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
    return `<a class="card" href="b/${esc(b.slug)}/" data-vibes="${esc(b.vibes.join(' '))}" data-uses="${esc(b.uses.join(' '))}" data-tone="${b.tone}" data-corner="${b.corner}" data-q="${esc(q)}">
      <div class="card-top" style="background:${css(th.bg, '#fff')};color:${css(th.ink, '#111')}"><span class="card-name">${esc(b.name)}</span><span class="card-pill" style="background:${css(th.primary, '#333')};color:${css(th.onPrimary, '#fff')}">Aa</span></div>
      <div class="strip">${swatches(b.tokens.colors)}</div>
      <div class="card-body"><div class="mini-tags">${labels.slice(0, 3).map((l) => `<span>${esc(l)}</span>`).join('')}</div><p>${esc(b.th || firstSentence(b.description, 110))}</p></div></a>`;
  }).join('');
  const indexHtml = `<section class="hero"><div class="wrap">
    <p class="eyebrow">แหล่งไอเดียดีไซน์ · ไม่แสวงหาผลกำไร</p>
    <h1>${esc(SITE.headline)}</h1>
    <p class="lead">${esc(SITE.description)}</p>
    <div class="stats"><div><b>${brands.length}</b><span>สไตล์ดีไซน์</span></div><div><b>${Object.keys(VIBES).length}</b><span>แนวความรู้สึก</span></div><div><b>${brands.filter((b) => b.format === 'tokens').length}</b><span>มี design tokens</span></div></div>
  </div></section>
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
    <h2>ข้อควรรู้</h2><ul><li>ไฟล์เหล่านี้เป็นการ “วิเคราะห์เชิงแรงบันดาลใจ” จากเว็บไซต์จริง ใช้เพื่อการเรียนรู้ ไม่ใช่ไฟล์ทางการของแบรนด์</li><li>หน้าตัวอย่างบนเว็บนี้เป็นหน้าทั่วไปที่นำสี ตัวอักษร และมุมโค้งของแบรนด์มาใส่ <strong>ไม่ใช่การจำลองเว็บจริงของแบรนด์นั้น</strong></li><li>ไม่ควรใช้โลโก้ ชื่อ หรือทำให้ผลงานของคุณดูเหมือนเป็นเว็บของแบรนด์นั้น</li><li>ฟอนต์บางตัวเป็นของเสียเงิน หน้าตัวอย่างจึงใช้ Inter แทน</li></ul>
    <h2>เกี่ยวกับโครงการ</h2><p>${esc(SITE.disclaimer)}</p></section>`, { depth: 1 }));

  writeFileSync(join(OUT, 'brands.json'), JSON.stringify(brands.map((b) => ({ slug: b.slug, name: b.name, category: b.category, format: b.format, colors: Object.keys(b.tokens.colors).length })), null, 2));
  writeFileSync(join(OUT, '404.html'), PAGE('ไม่พบหน้านี้', '<section class="wrap content narrow"><h1>ไม่พบหน้านี้</h1><p><a href="/">กลับหน้าแรก</a></p></section>'));
  const sm = ['/', '/about/', ...brands.map((b) => `/b/${b.slug}/`)];
  writeFileSync(join(OUT, 'sitemap.txt'), sm.map((p) => (SITE.url || '') + p).join('\n') + '\n');

  const legacy = brands.filter((b) => b.format === 'legacy').map((b) => b.slug);
  console.log(`✓ built ${brands.length} brands → public/`);
  console.log(`  dark hint (legacy): ${brands.filter((x) => x.darkHint).map((x) => x.slug).join(', ') || '-'}`);
  console.log(`  tokens format: ${brands.length - legacy.length} | legacy (colors from text): ${legacy.length}${legacy.length ? ' [' + legacy.join(', ') + ']' : ''}`);
  if (problems.length) console.log('  ⚠ ' + problems.join('\n  ⚠ '));
}
main();
