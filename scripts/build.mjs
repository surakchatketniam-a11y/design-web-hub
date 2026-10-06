#!/usr/bin/env node
// Static site generator: content/<slug>/DESIGN.md  ->  public/ (no database, no runtime server).
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, copyFileSync, rmSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { splitFrontMatter, parseYaml } from './lib/yaml.mjs';
import { renderMarkdown, esc } from './lib/md.mjs';
import { parseColor, deriveTheme, resolveRef, readableOn } from './lib/theme.mjs';
import { renderLanding } from './lib/landing.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = join(ROOT, 'content');
const OUT = join(ROOT, 'public');
const SITE = JSON.parse(readFileSync(join(ROOT, 'site.config.json'), 'utf8'));
const CATS = JSON.parse(readFileSync(join(ROOT, 'categories.json'), 'utf8'));

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
  const darkHint = format === 'legacy' && /(near-black|dark (theme|mode|canvas|surface|background)|immersive dark|black (canvas|background)|dark-first|dark, )/.test(head);
  return { slug, raw, body, tokens, format, description, darkHint, name: displayName(slug), category: catOf[slug] || 'other' };
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
<link rel="stylesheet" href="${base}assets/style.css">
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
<script src="${base}assets/app.js" defer></script>
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

function renderBrandPage(b, siblings) {
  const t = b.tokens;
  const theme = deriveTheme(t.colors, { dark: b.darkHint });
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
    <div class="device-wrap"><iframe id="pv" class="device" src="${previewUrl}" title="ตัวอย่างหน้าเว็บสไตล์ ${esc(b.name)}" loading="lazy"></iframe></div>`;

  const colorEntries = Object.entries(t.colors);
  const palette = colorEntries.length ? `<div class="palette">${colorEntries.map(([k, v]) => {
    const c = parseColor(v);
    const fg = c && c.a > 0.5 ? readableOn(c) : '#111';
    return `<button class="sw" data-copy="${esc(v)}" title="คลิกเพื่อคัดลอก ${esc(v)}" style="background:${css(v, '#ccc')};color:${fg}"><span>${esc(k)}</span><code>${esc(v)}</code></button>`;
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

  const html = `<section class="hero-b"><div class="wrap">
    <p class="crumb"><a href="../../">หน้าแรก</a> / ${esc(cat)}</p>
    <h1>${esc(b.name)}</h1>
    <p class="lead">${esc(firstSentence(b.description, 320))}</p>
    <div class="actions">
      <a class="btn primary" href="../../d/${esc(b.slug)}/DESIGN.md" download="DESIGN.md">⬇ ดาวน์โหลด DESIGN.md</a>
      <button class="btn" data-fetchcopy="../../d/${esc(b.slug)}/DESIGN.md">คัดลอกเนื้อหา</button>
      <a class="btn" href="../../d/${esc(b.slug)}/tokens.css" download="${esc(b.slug)}-tokens.css">tokens.css</a>
      <a class="btn" href="../../d/${esc(b.slug)}/tokens.json" download="${esc(b.slug)}-tokens.json">tokens.json</a>
    </div>
    ${b.format === 'legacy' ? '<p class="note">ไฟล์นี้เป็นรูปแบบเอกสารเก่า (ไม่มี token แบบ YAML) หน้านี้จึงแสดงสีที่ดึงจากข้อความเท่าที่อ่านได้</p>' : ''}
  </div></section>
  <div class="wrap content">
    <section><h2>ตัวอย่างหน้าเว็บ</h2><p class="muted">หน้า landing page เต็มรูปแบบที่สร้างจากสี ตัวอักษร รัศมีมุม และคอมโพเนนต์ใน DESIGN.md — ข้อความเป็นตัวอย่าง และฟอนต์เสียเงินของแบรนด์แสดงด้วยฟอนต์ใกล้เคียงแทน ลองสลับขนาดหน้าจอด้านล่าง</p>${mockup}</section>
    <section><h2>สี <span class="count">${colorEntries.length}</span></h2><p class="muted">คลิกที่สีเพื่อคัดลอกค่า</p>${palette}</section>
    ${typo ? `<section><h2>ตัวอักษร <span class="count">${tyEntries.length}</span></h2>${typo}</section>` : ''}
    ${shapes ? `<section><h2>รูปทรงและระยะห่าง</h2>${shapes}</section>` : ''}
    ${compHtml ? `<section><h2>คอมโพเนนต์ <span class="count">${comps.length}</span></h2>${compHtml}</section>` : ''}
    <section><h2>วิธีนำไปใช้กับ AI</h2><p class="muted">วางไฟล์ไว้ที่รากโปรเจกต์ แล้วสั่งตัวช่วยเขียนโค้ดของคุณ</p>
      <div class="prompt"><code id="prompt">${esc(prompt)}</code><button class="btn sm" data-copy="${esc(prompt)}">คัดลอก</button></div></section>
    <section><h2>เอกสารฉบับเต็ม</h2>
      <details class="doc"><summary>เปิดอ่าน DESIGN.md ทั้งไฟล์</summary><article class="prose">${renderMarkdown(b.body)}</article></details></section>
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
    writeFileSync(join(dir, 'index.html'), renderBrandPage(b, brands));
    const pd = join(OUT, 'p', b.slug); mkdirSync(pd, { recursive: true });
    writeFileSync(join(pd, 'index.html'), renderLanding(b, deriveTheme(b.tokens.colors, { dark: b.darkHint }), {}));
    const dd = join(OUT, 'd', b.slug); mkdirSync(dd, { recursive: true });
    writeFileSync(join(dd, 'DESIGN.md'), b.raw);
    writeFileSync(join(dd, 'tokens.css'), tokenCss(b));
    writeFileSync(join(dd, 'tokens.json'), JSON.stringify({ name: b.name, source: SITE.upstream, ...b.tokens }, null, 2));
  }

  // index
  const catChips = Object.entries(CATS).map(([k, v]) => `<button class="chip" data-cat="${esc(k)}">${esc(v.label)} <span>${brands.filter((b) => b.category === k).length}</span></button>`).join('');
  const cards = brands.map((b) => {
    const th = deriveTheme(b.tokens.colors, { dark: b.darkHint });
    return `<a class="card" href="b/${esc(b.slug)}/" data-cat="${esc(b.category)}" data-q="${esc((b.name + ' ' + b.slug + ' ' + plain(b.description)).toLowerCase())}">
      <div class="card-top" style="background:${css(th.bg, '#fff')};color:${css(th.ink, '#111')}"><span class="card-name">${esc(b.name)}</span><span class="card-pill" style="background:${css(th.primary, '#333')};color:${css(th.onPrimary, '#fff')}">Aa</span></div>
      <div class="strip">${swatches(b.tokens.colors)}</div>
      <div class="card-body"><small>${esc(CATS[b.category]?.label || 'อื่น ๆ')}</small><p>${esc(firstSentence(b.description, 110))}</p></div></a>`;
  }).join('');
  const indexHtml = `<section class="hero"><div class="wrap">
    <p class="eyebrow">แหล่งเรียนรู้ · ไม่แสวงหาผลกำไร</p>
    <h1>${esc(SITE.headline)}</h1>
    <p class="lead">${esc(SITE.description)}</p>
    <div class="stats"><div><b>${brands.length}</b><span>แบรนด์</span></div><div><b>${Object.keys(CATS).length}</b><span>หมวด</span></div><div><b>${brands.filter((b) => b.format === 'tokens').length}</b><span>มี design tokens</span></div></div>
  </div></section>
  <section class="wrap" id="brands">
    <div class="tools"><input id="q" type="search" placeholder="ค้นหาแบรนด์ เช่น stripe, dark, finance…" aria-label="ค้นหา"><div class="chips"><button class="chip on" data-cat="">ทั้งหมด <span>${brands.length}</span></button>${catChips}</div></div>
    <p id="empty" class="muted" hidden>ไม่พบแบรนด์ที่ตรงกับคำค้น</p>
    <div class="grid" id="grid">${cards}</div>
  </section>`;
  writeFileSync(join(OUT, 'index.html'), PAGE(SITE.title, indexHtml));

  // about
  mkdirSync(join(OUT, 'about'), { recursive: true });
  writeFileSync(join(OUT, 'about', 'index.html'), PAGE(`วิธีใช้ — ${SITE.title}`, `<section class="wrap content narrow"><h1>วิธีใช้</h1>
    <h2>DESIGN.md คืออะไร</h2><p>ไฟล์ markdown ธรรมดาที่บรรยายระบบดีไซน์ของเว็บ (สี ตัวอักษร ระยะห่าง คอมโพเนนต์ กฎการใช้งาน) เพื่อให้ AI ที่ช่วยเขียนโค้ดอ่านแล้วสร้าง UI ที่หน้าตาสอดคล้องกัน</p>
    <h2>ใช้งาน 3 ขั้น</h2><ol><li>เลือกแบรนด์จากหน้าแรกและดูตัวอย่าง</li><li>กด “ดาวน์โหลด DESIGN.md” แล้ววางไว้ที่รากโปรเจกต์ของคุณ</li><li>สั่ง AI เช่น “อ่าน DESIGN.md แล้วสร้างหน้า landing page ตามสไตล์นี้”</li></ol>
    <h2>ข้อควรรู้</h2><ul><li>ไฟล์เหล่านี้เป็นการ “วิเคราะห์เชิงแรงบันดาลใจ” จากเว็บไซต์จริง ใช้เพื่อการเรียนรู้ ไม่ใช่ไฟล์ทางการของแบรนด์</li><li>ไม่ควรใช้โลโก้ ชื่อ หรือทำให้ผลงานของคุณดูเหมือนเป็นเว็บของแบรนด์นั้น</li><li>ฟอนต์บางตัวเป็นของเสียเงิน หน้าตัวอย่างจึงใช้ Inter แทน</li></ul>
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
