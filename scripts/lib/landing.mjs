// Builds a full, self-contained landing page that wears a brand's design tokens.
// The copy is generic sample text; only colors / type / radii / spacing come from DESIGN.md.
import { esc } from './md.mjs';
import { parseColor, readableOn, resolveRef, luminance, contrast } from './theme.mjs';
import { renderLayout } from '../../src/layouts.mjs';

const SAFE = /^[#\w().,%\s/+*'"-]+$/;
const css = (v, fb = '') => (typeof v === 'string' && SAFE.test(v) ? v : fb);

const COPY = {
  ai: { eyebrow: 'New · Latest model', h1: 'AI that works the way you think', sub: 'Draft, reason and build with an assistant designed to be useful, honest and fast — from a quick question to a complex project.', cta: ['Start for free', 'Talk to sales'], nav: ['Product', 'Research', 'Pricing', 'Docs'] },
  dev: { eyebrow: 'Now generally available', h1: 'Ship faster on infrastructure that scales', sub: 'Everything you need to build, deploy and monitor modern applications — with a developer experience that stays out of your way.', cta: ['Start building', 'Read the docs'], nav: ['Platform', 'Solutions', 'Pricing', 'Docs'] },
  work: { eyebrow: 'Built for teams', h1: 'One place for all your team’s work', sub: 'Plan, track and collaborate without switching tools. Clear ownership, real-time updates and fewer meetings.', cta: ['Get started free', 'Book a demo'], nav: ['Product', 'Customers', 'Pricing', 'Resources'] },
  finance: { eyebrow: 'Move money, simply', h1: 'Financial tools for a borderless world', sub: 'Send, spend and grow money with transparent fees and security you can rely on — for people and businesses of any size.', cta: ['Open an account', 'Learn more'], nav: ['Personal', 'Business', 'Pricing', 'Help'] },
  auto: { eyebrow: 'The new collection', h1: 'Engineered for the extraordinary', sub: 'Precision, performance and presence in every detail. Discover the range and find the machine that moves you.', cta: ['Explore models', 'Book a test drive'], nav: ['Models', 'Experience', 'Heritage', 'Dealers'] },
  consumer: { eyebrow: 'Discover · Share · Enjoy', h1: 'Find something worth coming back to', sub: 'A curated place to explore ideas, products and stories — made for the moments you want to remember.', cta: ['Get started', 'Browse featured'], nav: ['Explore', 'Collections', 'Stories', 'Help'] },
  hardware: { eyebrow: 'Introducing', h1: 'Technology, refined', sub: 'Thoughtfully designed products that work together beautifully — built with the materials and performance you expect.', cta: ['Learn more', 'Buy now'], nav: ['Products', 'Support', 'Business', 'Store'] },
  other: { eyebrow: 'Welcome', h1: 'A better way to get things done', sub: 'A clear, focused experience designed around what matters most to you.', cta: ['Get started', 'Learn more'], nav: ['Product', 'About', 'Pricing', 'Contact'] }
};

const FINE = {
  auto: 'Configure yours in minutes · Official dealers worldwide',
  hardware: 'Free delivery · 14-day returns',
  consumer: 'Free to join · No credit card required'
};
const FEATURES_BY = {
  auto: [['Precision engineering', 'Every component is designed, tested and refined to the finest tolerance.'], ['Heritage craftsmanship', 'Decades of tradition in every stitch, surface and sound.'], ['Track-proven performance', 'Technology developed in competition and made ready for the road.'], ['Bespoke personalisation', 'Choose colors, materials and details to make it unmistakably yours.'], ['Sustainable innovation', 'Efficiency and responsibility built into the next generation.'], ['Worldwide service', 'Expert care from certified specialists wherever you drive.']],
  hardware: [['All-day battery', 'Power through the day and well into the night on a single charge.'], ['Stunning display', 'Bright, sharp and color-accurate, indoors or out.'], ['Built to last', 'Premium materials chosen for durability and a lasting finish.'], ['Private by design', 'Your information stays on your device and under your control.'], ['Works together', 'Pair devices instantly and pick up right where you left off.'], ['Free repairs', 'Expert support and genuine parts when you need them.']],
  consumer: [['Curated for you', 'Fresh picks based on what you love, updated every day.'], ['Save what you like', 'Keep everything in one place and come back anytime.'], ['Share with friends', 'Send ideas, build collections and plan together.'], ['Always something new', 'New stories and discoveries arrive all the time.'], ['Safe and respectful', 'Tools that keep the experience friendly for everyone.'], ['On every device', 'A smooth experience on phone, tablet and desktop.']]
};
const FEATURES = [
  ['Fast by default', 'Optimised from the first interaction so everything feels instant.'],
  ['Secure and private', 'Built-in protections keep your data yours, from day one.'],
  ['Works with your tools', 'Connect the apps you already use in a few clicks.'],
  ['Clear insights', 'See what is happening at a glance with simple, honest reporting.'],
  ['Made for teams', 'Share, comment and stay in sync without the busywork.'],
  ['Always improving', 'Regular updates shaped by feedback from real customers.']
];
const LOGOS = ['Northwind', 'Halcyon', 'Parallel', 'Oakridge', 'Lumen', 'Vertex'];
const FAQ = [
  ['Can I try it before paying?', 'Yes. Start with the free plan and upgrade only when you need more.'],
  ['Is my data secure?', 'Your data is encrypted in transit and at rest, and you stay in control of who can see it.'],
  ['Can I cancel at any time?', 'Absolutely. There are no long-term contracts and you can cancel whenever you like.']
];

function sat(c) { const mx = Math.max(c.r, c.g, c.b), mn = Math.min(c.r, c.g, c.b); return mx === 0 ? 0 : (mx - mn) / mx; }
function accents(colors, primary, n = 3) {
  const p = parseColor(primary);
  const out = [];
  for (const v of Object.values(colors)) {
    const c = parseColor(v);
    if (!c || c.a < 0.99 || sat(c) < 0.35 || luminance(c) < 0.05 || luminance(c) > 0.85) continue;
    if (p && Math.abs(c.r - p.r) + Math.abs(c.g - p.g) + Math.abs(c.b - p.b) < 90) continue;
    if (out.some((o) => { const q = parseColor(o); return Math.abs(c.r - q.r) + Math.abs(c.g - q.g) + Math.abs(c.b - q.b) < 90; })) continue;
    out.push(v);
    if (out.length >= n) break;
  }
  while (out.length < n) out.push(primary);
  return out;
}

export function fontFor(name) {
  const n = String(name || '').toLowerCase();
  if (/mono|courier|menlo|consolas/.test(n)) return "'JetBrains Mono', ui-monospace, monospace";
  if (/copernicus|tiempos|editorial|georgia|garamond|playfair|lyon|times|(^|[^a-z-])serif/.test(n) && !/sans/.test(n)) return "'Source Serif 4', Georgia, serif";
  if (/^dm sans/.test(n)) return "'DM Sans', Inter, sans-serif";
  if (/ibm plex sans/.test(n)) return "'IBM Plex Sans', Inter, sans-serif";
  return "Inter, 'Noto Sans Thai', system-ui, sans-serif";
}

const num = (v, d) => { const x = parseFloat(v); return Number.isFinite(x) ? x : d; };
function tvars(prefix, t, fb) {
  const size = num(t?.fontSize, fb.size), ls = num(t?.letterSpacing, 0);
  return `--${prefix}-size:${size}px;--${prefix}-weight:${css(String(t?.fontWeight ?? fb.weight), '400')};--${prefix}-lh:${css(String(t?.lineHeight ?? fb.lh), '1.3')};--${prefix}-ls:${(ls / size).toFixed(4)}em`;
}


const dist = (a, b) => Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b);
const chromaOf = (c) => Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b);
const BORDERISH = /border|hairline|divider|stroke|outline|(^|-)line($|-)/;
const NOT_FILL = /^(on-|text|body|ink|mute|muted|shadow|overlay|scrim|link|focus|form-focus|error|danger|negative|success|positive|warn|info|disabled|placeholder|slate)/;

/** Spread a brand's whole palette across page roles (bands, tinted sections, accents, status, links) and record where each color is used. */
function buildPalette(colors, theme, o) {
  const solid = Object.entries(colors).map(([name, value]) => ({ name, value, c: parseColor(value) })).filter((x) => x.c && x.c.a >= 0.99).map((x) => ({ ...x, lum: luminance(x.c), chroma: chromaOf(x.c) }));
  const bgC = parseColor(theme.bg), inkC = parseColor(theme.ink), priC = parseColor(o.priBg) || parseColor(theme.primary);
  const near = (x, c, d = 40) => c && dist(x.c, c) < d;
  const fillable = (x) => !NOT_FILL.test(x.name) && !BORDERISH.test(x.name);
  const uniq = (list, n, d) => { const out = []; for (const x of list) { if (out.every((y) => dist(x.c, y.c) > d)) out.push(x); if (out.length >= n) break; } return out; };
  const hint = /(dark|night|band|deep|surface|navy|forest|midnight)/;

  // dark bands (stats strip, closing CTA, featured plan)
  let bands;
  if (!theme.dark) {
    bands = uniq(solid.filter((x) => fillable(x) && x.lum < 0.14 && !near(x, bgC) && !near(x, inkC, 25) && (x.chroma > 30 || hint.test(x.name)))
      .sort((a, b) => (b.chroma > 30) - (a.chroma > 30) || hint.test(b.name) - hint.test(a.name) || b.chroma - a.chroma), 2, 30);
  } else {
    bands = uniq(solid.filter((x) => fillable(x) && x.chroma > 45 && x.lum < 0.25 && !near(x, bgC, 30)).sort((a, b) => b.chroma - a.chroma), 2, 30);
  }
  // softly tinted surfaces used to alternate section backgrounds
  let softs;
  if (!theme.dark) {
    softs = uniq(solid.filter((x) => fillable(x) && x.lum > 0.7 && !near(x, bgC, 12)).sort((a, b) => b.chroma - a.chroma), 3, 14);
  } else {
    const bl = luminance(bgC);
    softs = uniq(solid.filter((x) => fillable(x) && x.lum > bl + 0.004 && x.lum < 0.12 && x.chroma < 60).sort((a, b) => a.lum - b.lum), 3, 10);
  }
  const taken = [...bands, ...softs];
  const accPool = uniq(solid.filter((x) => fillable(x) && sat(x.c) > 0.35 && x.lum > 0.04 && x.lum < 0.85 && !near(x, priC, 60) && !taken.some((t) => dist(t.c, x.c) < 20)), 6, 70);
  const accents = [];
  for (let i = 0; i < 6; i++) accents.push(accPool.length ? accPool[i % accPool.length].value : o.priBg);
  const byName = (re) => solid.find((x) => re.test(x.name));
  const err = byName(/(error|danger|negative|critical|destructive)/), okc = byName(/(success|positive)/), warn = byName(/warn/);
  const link = byName(/^(link|text-link|action-link|link-blue|action-blue)$/);
  const ink2 = solid.find((x) => /(body-muted|ink-secondary|text-secondary|body-secondary|slate|ink-muted)$/.test(x.name) && contrast(x.c, bgC) >= 4.5);
  const bd2 = byName(/(card-border|border-light|hairline-soft|border-soft|border-subtle)/);
  const focus = byName(/focus/);

  const soft = [0, 1, 2].map((i) => softs[i]?.value || theme.surface);
  const band1 = bands[0]?.value || null, band2 = bands[1]?.value || band1;
  const cta = band2 || band1 || o.priBg;
  const vars = {
    soft1: soft[0], soft2: soft[1], soft3: soft[2],
    band1: band1 || o.priBg, onband1: readableOn(parseColor(band1 || o.priBg) || priC),
    cta, oncta: readableOn(parseColor(cta) || priC),
    a1: accents[0], a2: accents[1], a3: accents[2], a4: accents[3], a5: accents[4], a6: accents[5],
    err: err?.value || accents[1], okc: okc?.value || accents[0], warnc: warn?.value || accents[2],
    linkc: link?.value || o.priBg, focusc: focus?.value || o.priBg, ink2: ink2?.value || theme.mute, bd2: bd2?.value || theme.border
  };
  const usage = [
    ['พื้นหลังหน้า', theme.bg], ['ตัวอักษรหลัก/หัวข้อ', theme.ink], ['ตัวอักษรรอง/คำอธิบาย', vars.ink2], ['ตัวอักษรเล็ก/ป้ายกำกับ', theme.mute],
    ['ปุ่มหลัก', o.priBg], ['ตัวอักษรบนปุ่มหลัก', o.priFg], ['ปุ่มรอง/ตัวอักษรปุ่มรอง', o.secFg], ['พื้นการ์ดและช่องกรอก', theme.surface],
    ['เส้นขอบและเส้นแบ่ง', theme.border], ['เส้นขอบการ์ด', vars.bd2], ['ลิงก์', vars.linkc]
  ];
  if (band1) usage.push(['แถบเข้ม: แถบตัวเลขสถิติ และแผนราคาเด่น', band1]);
  if (band2 || band1) usage.push(['แถบเข้ม: แบนเนอร์ปิดท้าย (CTA)', cta]);
  softs.forEach((x, i) => usage.push([`พื้นส่วนสลับ/การ์ดโทนอ่อน ${i + 1}`, x.value]));
  accPool.forEach((x) => usage.push(['สีเน้น: ไอคอน กราฟ ภาพประกอบ', x.value]));
  if (err) usage.push(['ป้ายสถานะ: ผิดพลาด', err.value]);
  if (okc) usage.push(['ป้ายสถานะ: สำเร็จ', okc.value]);
  if (warn) usage.push(['ป้ายสถานะ: เตือน', warn.value]);
  if (focus) usage.push(['สถานะโฟกัสของช่องกรอก (ลองกดช่องอีเมลท้ายหน้า)', focus.value]);
  return { vars, usage, hasBand: !!band1 };
}

/** Read the "feel" signals a DESIGN.md states in words/tokens (not just colors): casing, gradients, flatness, color-block cards, mono labels, photo-led hero, spacing. */
function detectFeel(b, theme, o) {
  const t = b.tokens;
  const doc = (b.description + ' ' + b.body.slice(0, 6000)).toLowerCase();
  const tyList = Object.entries(t.typography).filter(([, v]) => v && typeof v === 'object');
  const disp = [...tyList].sort((a, c) => num(c[1].fontSize, 0) - num(a[1].fontSize, 0))[0]?.[1];
  const kcRaw = (b.body.match(/key characteristics:?\*{0,2}\s*\n([\s\S]{0,2400})/i) || [])[1] || doc.slice(0, 2400);
  const kc = kcRaw.toLowerCase();

  // sentence-level: a sentence must tie UPPERCASE to headings, and not be about labels/buttons or be negated
  const upperSentence = doc.split(/[.\n;]/).some((x) => /(uppercase|all-caps|all caps)/.test(x) && /(display|headline|heading|hero|title)/.test(x) && !/(mono|eyebrow|caption|label|button|nav|tab|badge|tag|chip|sub-head|sentence-case)/.test(x) && !/\b(no|never|not|without|avoid)\b|rather than/.test(x));
  const upper = disp?.textTransform === 'uppercase' || upperSentence;
  const gradient = /(gradient[- ]mesh|mesh gradient|atmospheric (gradient|wash|orbs)|sunset gradient|aurora|gradient (wash|hero|backdrop|orbs?|spotlight)|(hero|backdrop|atmospher\w*)[^.\n]{0,40}gradient)/.test(doc) && !/(no|zero|never|without)[^.\n]{0,20}gradient/.test(doc);
  const flat = /(no shadows?|zero shadows?|flat|never.{0,20}shadow|resists drop shadows?|without shadows?|no drop shadows?|shadow-free)/.test(doc) || theme.dark;

  const solid = Object.entries(t.colors).map(([name, value]) => ({ name, value, c: parseColor(value) })).filter((x) => x.c && x.c.a >= 0.99);
  const tileNames = solid.filter((x) => /^(signature|block|card-tint|tile|brand-(pink|teal|lavender|peach|ochre|mint|yellow|coral|orange|green|blue|red|purple)|pastel|product-)/.test(x.name));
  const bgC = parseColor(theme.bg);
  const tilePick = [];
  for (const x of tileNames) { if (dist(x.c, bgC) < 60) continue; if (tilePick.every((y) => dist(x.c, y.c) > 70)) tilePick.push(x); if (tilePick.length >= 3) break; }
  const tiles = tileNames.length >= 3 && tilePick.length >= 2 ? tilePick : [];

  const monoTok = tyList.find(([k, v]) => /mono/.test(k + ' ' + (v.fontFamily || '')) && /eyebrow|caps|label|caption/.test(k));
  const photoLed = /(photograph(y|ic)|cinematic|full-bleed (photo|video|imagery)|campaign imagery)/.test(kc);
  const productUi = /(product (ui|screenshot|mockup)|dashboard|terminal|code (editor|window|well)|screenshots?|mockups?)/.test(kc);
  const catEditorial = ['auto', 'consumer', 'hardware'].includes(b.category);
  const editorial = photoLed && !productUi ? true : productUi && !photoLed ? false : catEditorial;

  const sp = Object.entries(t.spacing).find(([k]) => k === 'section')?.[1];
  const secPad = Number.isFinite(parseFloat(sp)) ? Math.max(56, Math.min(128, parseFloat(sp))) : 88;

  const traits = [];
  if (upper) traits.push('หัวข้อตัวพิมพ์ใหญ่');
  if (gradient) traits.push('พื้นหลัง gradient บรรยากาศ');
  traits.push(flat ? 'แบนราบ ไม่เน้นเงา' : 'เงานุ่มบางๆ ใต้การ์ด');
  if (tiles.length) traits.push('การ์ดสีบล็อกประจำแบรนด์');
  if (monoTok) traits.push('ป้ายกำกับฟอนต์ monospace');
  if (editorial) traits.push(photoLed ? 'ภาพนำแบบภาพถ่าย/แคมเปญ' : 'ภาพนำแบบ editorial');
  if (secPad >= 96) traits.push('จังหวะโปร่ง ระยะห่างกว้าง');
  const classes = [upper && 'tone-upper', gradient && 'tone-grad', flat ? 'tone-flat' : 'tone-soft', tiles.length && 'tone-tiles', monoTok && 'tone-mono'].filter(Boolean).join(' ');
  return { upper, gradient, flat, tiles, monoTok: monoTok ? monoTok[1] : null, editorial, secPad, traits, classes };
}

/** Box-shadow values the brand documents in its Elevation section. */
function extractShadows(body) {
  const sec = (body.match(/##\s*Elevation[\s\S]*?(?=\n##\s|$)/i) || [''])[0];
  const out = [];
  for (const m of sec.matchAll(/`([^`\n]*\d+px[^`\n]*)`/g)) {
    const v = m[1].replace(/^box-shadow:\s*/i, '').trim();
    if (/(rgba?\(|#[0-9a-f]{3,8})/i.test(v) && /^[#\w().,%\s/+*-]+$/.test(v) && !/^none$/i.test(v)) out.push(v);
  }
  return out.slice(0, 3);
}

/** Category presets used by the Mix page (copy, features, defaults) — same data the brand previews use. */
export function categoryModel(cat) {
  const copy = COPY[cat] || COPY.other;
  const oneTime = cat === 'auto' || cat === 'hardware';
  return {
    category: cat, copy: { ...copy, fine: FINE[cat] || 'No credit card required · Free plan available' },
    feats: FEATURES_BY[cat] || FEATURES, editorial: ['auto', 'consumer', 'hardware'].includes(cat), oneTime,
    specs: cat === 'auto' ? [['3.2s', '0–100 km/h'], ['800 hp', 'Peak power'], ['340 km/h', 'Top speed'], ['1,380 kg', 'Dry weight']] : [['4.9★', 'Average rating'], ['2M+', 'Happy customers'], ['120+', 'Countries'], ['24/7', 'Support']]
  };
}

export function renderLanding(b, theme, ctx) {
  const t = b.tokens, get = (v) => resolveRef(v, t);
  const copy = COPY[b.category] || COPY.other;
  const tyList = Object.entries(t.typography).filter(([, v]) => v && typeof v === 'object');
  const bySize = [...tyList].sort((a, c) => num(c[1].fontSize, 0) - num(a[1].fontSize, 0));
  const display = (bySize.find(([k]) => /display|hero/.test(k)) || bySize[0] || [])[1];
  const heading = (tyList.find(([k]) => /^(heading|title|headline|section)/.test(k) && num(tyList.find(([kk]) => kk === k)[1].fontSize, 0) >= 20) || tyList.find(([k]) => /heading|title|headline/.test(k)) || [])[1];
  const body = (tyList.find(([k]) => /^body(-md)?$/.test(k)) || tyList.find(([k]) => /^body/.test(k)) || [])[1];
  const btnTy = (tyList.find(([k]) => /^button/.test(k)) || [])[1];

  const compKeys = Object.keys(t.components);
  const comp = (re, avoid = /pressed|hover|focus|disabled|active|dark|on-dark/) => compKeys.find((k) => re.test(k) && !avoid.test(k));
  const pk = comp(/^button-primary|^btn-primary|^cta-primary/) || comp(/button|cta/);
  const sk = comp(/button-(secondary|outline|ghost)|^btn-(secondary|outline)/);
  const ck = comp(/card/);
  const ik = comp(/input|field/);
  const P = pk ? t.components[pk] : {}, S = sk ? t.components[sk] : {}, C = ck ? t.components[ck] : {}, I = ik ? t.components[ik] : {};
  const radBtn = css(get(P.rounded), '8px'), radCard = css(get(C.rounded), '12px'), radIn = css(get(I.rounded), radBtn);
  const priBg = parseColor(get(P.backgroundColor)) ? css(get(P.backgroundColor)) : theme.primary;
  const priFgRaw = parseColor(get(P.textColor)) ? css(get(P.textColor)) : null;
  const priBgC = parseColor(priBg) || parseColor(theme.primary);
  const priFg = priFgRaw && contrast(parseColor(priFgRaw), priBgC) >= 3 ? priFgRaw : readableOn(priBgC);
  const secBg = parseColor(get(S.backgroundColor)) && parseColor(get(S.backgroundColor)).a > 0.05 ? css(get(S.backgroundColor)) : 'transparent';
  const secFg = parseColor(get(S.textColor)) ? css(get(S.textColor)) : theme.ink;
  const padBtn = css(String(P.padding ?? '11px 20px').replace(/(\d+(?:\.\d+)?)px/g, (_, n) => `${Math.min(parseFloat(n), 28)}px`), '11px 20px');

  const colorOf = (v) => (parseColor(get(v)) ? css(get(v)) : null);
  const navC = t.components[comp(/^nav|top-nav|nav-bar|header-bar/)] || {};
  const pillC = t.components[comp(/(^|-)(tag|pill|chip|badge)(-|$)/, /pressed|hover|focus|disabled|active|button|nav/)] || {};
  const footC = t.components[comp(/footer/)] || {};
  const navBg = colorOf(navC.backgroundColor), navFg = colorOf(navC.textColor);
  const pillBg = colorOf(pillC.backgroundColor), pillFgRaw = colorOf(pillC.textColor);
  const pillFg = pillBg ? (pillFgRaw && contrast(parseColor(pillFgRaw), parseColor(pillBg)) >= 3 ? pillFgRaw : readableOn(parseColor(pillBg))) : null;
  const footBg = colorOf(footC.backgroundColor), footFgRaw = colorOf(footC.textColor);
  const footFg = footBg ? (footFgRaw && contrast(parseColor(footFgRaw), parseColor(footBg)) >= 4.5 ? footFgRaw : readableOn(parseColor(footBg))) : null;
  const cardPad = C.padding ? css(String(C.padding).replace(/(\d+(?:\.\d+)?)px/g, (_, n) => `${Math.min(parseFloat(n), 40)}px`), '') : '';
  const shadows = extractShadows(b.body);
  const tyBy = (re) => (tyList.find(([k]) => re.test(k)) || [])[1];
  const h3Ty = tyBy(/^(heading-(sm|md)|title-(sm|md)|card-title|subhead)/) || tyBy(/heading|title/);
  const capTy = tyBy(/^(caption|micro|small|fine)/), ebTy = tyBy(/eyebrow|micro-cap|overline/), navTy = tyBy(/^(nav|link)/) || tyBy(/^body-sm|^body-md/);
  const R = buildPalette(t.colors, theme, { priBg, priFg, secFg });
  if (ctx) ctx.usage = R.usage;
  const P2 = R.vars;
  const T = detectFeel(b, theme, { priBg });
  if (ctx) ctx.traits = T.traits;
  if (ctx) T.tiles.forEach((x) => ctx.usage.push(['การ์ดสีบล็อกประจำแบรนด์', x.value]));
  const inv = theme.dark ? theme.ink : theme.ink; // inverse block = ink on bg
  const onInv = theme.bg;
  const fd = fontFor(display?.fontFamily), fb = fontFor(body?.fontFamily || display?.fontFamily);
  const vars = [
    `--bg:${css(theme.bg, '#fff')}`, `--ink:${css(theme.ink, '#111')}`, `--mute:${css(theme.mute, '#666')}`, `--pri:${css(priBg, '#333')}`, `--onpri:${css(priFg, '#fff')}`,
    `--sur:${css(theme.surface, '#f5f5f5')}`, `--bd:${css(theme.border, '#ddd')}`, `--inv:${css(inv, '#111')}`, `--oninv:${css(onInv, '#fff')}`,
    ...Object.entries(P2).map(([k, v]) => `--${k}:${css(v, '#999')}`),
    ...T.tiles.flatMap((x, i) => [`--tile${i + 1}:${css(x.value, '#ccc')}`, `--ontile${i + 1}:${readableOn(x.c)}`]), `--sec-pad:${T.secPad}px`, `--fe:${fontFor(T.monoTok?.fontFamily || display?.fontFamily)}`,
    `--feat-bg:${css(R.hasBand ? P2.band1 : inv, '#111')}`, `--feat-fg:${css(R.hasBand ? P2.onband1 : onInv, '#fff')}`,
    `--r-btn:${radBtn}`, `--r-card:${radCard}`, `--r-in:${radIn}`, `--pad-btn:${padBtn}`,
    ...(navBg ? [`--nav-bg:${navBg}`, `--nav-fg:${navFg || readableOn(parseColor(navBg))}`] : []),
    ...(pillBg ? [`--pill-bg:${pillBg}`, `--pill-fg:${pillFg}`, `--pill-r:${css(get(pillC.rounded), '9999px')}`] : []),
    ...(footBg ? [`--foot-bg:${footBg}`, `--foot-fg:${footFg}`] : []),
    ...(cardPad ? [`--card-pad:${cardPad}`] : []), ...(shadows[0] ? [`--sh1:${shadows[0]}`, `--sh2:${shadows[Math.min(1, shadows.length - 1)]}`] : []),
    `--sec-bg:${secBg}`, `--sec-fg:${secFg}`, `--fd:${fd}`, `--fb:${fb}`,
    tvars('h1', display, { size: 56, weight: 600, lh: 1.1 }),
    tvars('h2', heading || display, { size: 32, weight: 600, lh: 1.2 }),
    tvars('body', body, { size: 16, weight: 400, lh: 1.5 }),
    tvars('btn', btnTy || body, { size: 15, weight: 500, lh: 1.2 }),
    tvars('h3', h3Ty, { size: 19, weight: 600, lh: 1.3 }), tvars('cap', capTy, { size: 13, weight: 400, lh: 1.4 }),
    tvars('eb', ebTy, { size: 13, weight: 600, lh: 1.3 }), tvars('nv', navTy, { size: 14, weight: 400, lh: 1.4 })
  ].join(';');

  const oneTime = b.category === 'auto' || b.category === 'hardware';
  const specs = b.category === 'auto'
    ? [['3.2s', '0–100 km/h'], ['800 hp', 'Peak power'], ['340 km/h', 'Top speed'], ['1,380 kg', 'Dry weight']]
    : [['4.9★', 'Average rating'], ['2M+', 'Happy customers'], ['120+', 'Countries'], ['24/7', 'Support']];
  if (ctx) { ctx.vars = vars; ctx.classes = T.classes; ctx.hasBand = R.hasBand; ctx.tileCount = T.tiles.length; ctx.dark = !!theme.dark; ctx.fonts = { display: display?.fontFamily || '', body: body?.fontFamily || display?.fontFamily || '' }; }
  const M = {
    name: b.name, slug: b.slug, category: b.category,
    copy: { ...copy, fine: FINE[b.category] || 'No credit card required · Free plan available' },
    feats: FEATURES_BY[b.category] || FEATURES, editorial: T.editorial, oneTime, hasBand: R.hasBand, tileCount: T.tiles.length, specs,
    lightPriOnDark: theme.dark && luminance(parseColor(priBg) || parseColor(theme.primary)) > 0.6
  };
  const name = esc(b.name);
  const modelJson = JSON.stringify(M).replace(/</g, '\\u003c');
  const lv = esc(ctx?.vLayouts || '');
  return `<!doctype html>
<html lang="en" class="${T.classes}" style="${vars}">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${name} — generic sample using its design tokens</title>
<meta name="robots" content="noindex">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=DM+Sans:wght@400;500;700&family=IBM+Plex+Sans:wght@400;500;600&family=Source+Serif+4:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Noto+Sans+Thai:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../../assets/preview.css?v=${esc(ctx?.v || '')}">
<script>if (top !== self) document.documentElement.classList.add('framed');</script>
</head>
<body class="${theme.dark ? 'is-dark' : ''}">
<div class="ribbon"><a href="../../b/${esc(b.slug)}/">← กลับไปหน้า ${name}</a><span>หน้าทั่วไปที่ใส่สี/ฟอนต์/มุมโค้งจาก DESIGN.md · ไม่ใช่หน้าจริงของแบรนด์</span></div>
<div id="app">${renderLayout('hero', M)}</div>
<script type="application/json" id="model">${modelJson}</script>
<script type="module">
import { renderLayout, activate, LAYOUT_KEYS } from '../../assets/layouts.js?v=${lv}';
const M = JSON.parse(document.getElementById('model').textContent);
const app = document.getElementById('app');
const k = new URLSearchParams(location.search).get('layout');
if (k && k !== 'hero' && LAYOUT_KEYS.includes(k)) app.innerHTML = renderLayout(k, M);
activate(app);
</script>
</body></html>`;
}
