// Builds a full, self-contained landing page that wears a brand's design tokens.
// The copy is generic sample text; only colors / type / radii / spacing come from DESIGN.md.
import { esc } from './md.mjs';
import { parseColor, readableOn, resolveRef, luminance } from './theme.mjs';

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

function fontFor(name) {
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
  const priFg = parseColor(get(P.textColor)) ? css(get(P.textColor)) : readableOn(parseColor(priBg) || parseColor(theme.primary));
  const secBg = parseColor(get(S.backgroundColor)) && parseColor(get(S.backgroundColor)).a > 0.05 ? css(get(S.backgroundColor)) : 'transparent';
  const secFg = parseColor(get(S.textColor)) ? css(get(S.textColor)) : theme.ink;
  const padBtn = css(String(P.padding ?? '11px 20px').replace(/(\d+(?:\.\d+)?)px/g, (_, n) => `${Math.min(parseFloat(n), 28)}px`), '11px 20px');

  const acc = accents(t.colors, theme.primary);
  const inv = theme.dark ? theme.ink : theme.ink; // inverse block = ink on bg
  const onInv = theme.bg;
  const fd = fontFor(display?.fontFamily), fb = fontFor(body?.fontFamily || display?.fontFamily);
  const vars = [
    `--bg:${css(theme.bg, '#fff')}`, `--ink:${css(theme.ink, '#111')}`, `--mute:${css(theme.mute, '#666')}`, `--pri:${css(priBg, '#333')}`, `--onpri:${css(priFg, '#fff')}`,
    `--sur:${css(theme.surface, '#f5f5f5')}`, `--bd:${css(theme.border, '#ddd')}`, `--inv:${css(inv, '#111')}`, `--oninv:${css(onInv, '#fff')}`,
    `--a1:${css(acc[0], '#999')}`, `--a2:${css(acc[1], '#999')}`, `--a3:${css(acc[2], '#999')}`,
    `--r-btn:${radBtn}`, `--r-card:${radCard}`, `--r-in:${radIn}`, `--pad-btn:${padBtn}`,
    `--sec-bg:${secBg}`, `--sec-fg:${secFg}`, `--fd:${fd}`, `--fb:${fb}`,
    tvars('h1', display, { size: 56, weight: 600, lh: 1.1 }),
    tvars('h2', heading || display, { size: 32, weight: 600, lh: 1.2 }),
    tvars('body', body, { size: 16, weight: 400, lh: 1.5 }),
    tvars('btn', btnTy || body, { size: 15, weight: 500, lh: 1.2 })
  ].join(';');

  const editorial = ['auto', 'consumer', 'hardware'].includes(b.category);
  const oneTime = b.category === 'auto' || b.category === 'hardware';
  const feats = FEATURES_BY[b.category] || FEATURES;
  const fine = FINE[b.category] || 'No credit card required · Free plan available';
  const name = esc(b.name);

  const appMock = `<div class="mock" aria-hidden="true">
    <div class="mock-bar"><i></i><i></i><i></i><span></span></div>
    <div class="mock-body">
      <div class="mock-side">${['Overview', 'Projects', 'Activity', 'Reports', 'Settings'].map((x, i) => `<div class="${i === 0 ? 'on' : ''}">${x}</div>`).join('')}</div>
      <div class="mock-main">
        <div class="kpis"><div><small>Revenue</small><b>$48.2k</b></div><div><small>Active users</small><b>12,480</b></div><div><small>Conversion</small><b>3.8%</b></div></div>
        <div class="chart">${[38, 52, 44, 68, 58, 80, 72, 94].map((h, i) => `<span style="height:${h}%;background:${i % 3 === 0 ? 'var(--a1)' : i % 3 === 1 ? 'var(--pri)' : 'var(--a2)'}"></span>`).join('')}</div>
        <div class="rows">${[['Acme Inc.', 'Paid', '$2,400'], ['Globex', 'Pending', '$1,150'], ['Initech', 'Paid', '$880']].map(([a, s, v]) => `<div><span>${a}</span><em class="pill ${s === 'Paid' ? 'ok' : 'soft'}">${s}</em><b>${v}</b></div>`).join('')}</div>
      </div>
    </div></div>`;

  const specs = b.category === 'auto'
    ? [['3.2s', '0–100 km/h'], ['800 hp', 'Peak power'], ['340 km/h', 'Top speed'], ['1,380 kg', 'Dry weight']]
    : [['4.9★', 'Average rating'], ['2M+', 'Happy customers'], ['120+', 'Countries'], ['24/7', 'Support']];
  const editorialHero = `<div class="ed" aria-hidden="true"><div class="ed-hero"><span>${esc(copy.eyebrow)}</span><b>${name}</b></div>
    <div class="ed-cards">${['Signature', 'Sport', 'Classic'].map((n, i) => `<div class="ed-card"><div class="ed-img" style="background:linear-gradient(${135 + i * 25}deg,color-mix(in srgb,var(--pri) ${[80, 55, 32][i]}%,var(--bg)),color-mix(in srgb,var(--pri) ${[30, 18, 8][i]}%,var(--sur)))"></div><h4>${n}</h4><p>From $${(49 + i * 20)},900</p><a class="lnk">Discover →</a></div>`).join('')}</div></div>`;

  const priceTier = (title, price, items, featured, cta = 'Choose plan', per = '/mo') => `<div class="tier${featured ? ' feat' : ''}">${featured ? '<em class="pill">Most popular</em>' : ''}<h3>${title}</h3><div class="price">${price}${per ? `<small>${per}</small>` : ''}</div><ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul><a class="btn ${featured ? 'btn-inv' : 'btn-pri'}">${cta}</a></div>`;

  return `<!doctype html>
<html lang="en" style="${vars}">
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
<div class="announce"><span class="pill">${esc(copy.eyebrow)}</span> See what’s new in ${name} →</div>
<header class="nav"><div class="in">
  <b class="logo">${name}</b>
  <nav>${copy.nav.map((n) => `<a>${n}</a>`).join('')}</nav>
  <div class="nav-cta"><a class="btn btn-sec">Sign in</a><a class="btn btn-pri">${esc(copy.cta[0])}</a></div>
</div></header>

<section class="hero"><div class="in">
  <p class="eyebrow">${esc(copy.eyebrow)}</p>
  <h1>${esc(copy.h1)}</h1>
  <p class="sub">${esc(copy.sub)}</p>
  <div class="cta"><a class="btn btn-pri btn-lg">${esc(copy.cta[0])}</a><a class="btn btn-sec btn-lg">${esc(copy.cta[1])}</a></div>
  <p class="fine">${esc(fine)}</p>
  ${editorial ? editorialHero : appMock}
</div></section>

<section class="logos"><div class="in"><p>Trusted by teams everywhere</p><div>${LOGOS.map((l) => `<span>${l}</span>`).join('')}</div></div></section>

<section class="sec"><div class="in">
  <p class="eyebrow">Features</p><h2>Everything you need, nothing you don’t</h2><p class="lede">A focused set of capabilities designed to help you get to the result faster.</p>
  <div class="grid3">${feats.map(([h, p], i) => `<article class="card"><div class="ico" style="background:var(--${['pri', 'a1', 'a2'][i % 3]})"></div><h3>${h}</h3><p>${p}</p><a class="lnk">Learn more →</a></article>`).join('')}</div>
</div></section>

<section class="sec alt"><div class="in split">
  <div><p class="eyebrow">How it works</p><h2>Start simple, scale when you’re ready</h2><p class="lede">Set up in minutes, invite your team and grow without rebuilding from scratch.</p>
    <ul class="checks"><li>Guided setup and sensible defaults</li><li>Clear permissions for every role</li><li>Reports you can share in one click</li></ul><a class="btn btn-pri">${esc(copy.cta[0])}</a></div>
  <div class="panel" aria-hidden="true"><div class="chart tall">${[30, 46, 40, 62, 55, 74, 68, 90, 82, 100].map((h, i) => `<span style="height:${h}%;background:${i % 2 ? 'var(--pri)' : 'var(--a1)'}"></span>`).join('')}</div><div class="legend"><span><i style="background:var(--pri)"></i>This year</span><span><i style="background:var(--a1)"></i>Last year</span></div></div>
</div></section>

<section class="stats"><div class="in">${specs.map(([n, l]) => `<div><b>${n}</b><span>${l}</span></div>`).join('')}</div></section>

<section class="sec"><div class="in"><figure class="quote"><blockquote>“It changed how our whole team works. We shipped in weeks what used to take months.”</blockquote><figcaption><span class="av"></span><div><b>Alex Morgan</b><small>Head of Product, Northwind</small></div></figcaption></figure></div></section>

<section class="sec alt"><div class="in"><p class="eyebrow center">${oneTime ? 'Configurations' : 'Pricing'}</p><h2 class="center">${oneTime ? 'Choose the one that fits you' : 'Simple plans that grow with you'}</h2>
  <div class="grid3 tiers">${oneTime
    ? priceTier('Essential', b.category === 'auto' ? '$189k' : '$799', ['Core specification', 'Standard finish', '2-year warranty'], false, 'Configure', '') + priceTier('Performance', b.category === 'auto' ? '$249k' : '$1,099', ['Upgraded performance', 'Premium materials', 'Extended warranty', 'Priority service'], true, 'Configure', '') + priceTier('Collector', b.category === 'auto' ? '$420k' : '$1,499', ['Limited edition', 'Bespoke options', 'Concierge support'], false, 'Configure', '')
    : priceTier('Starter', '$0', ['Up to 3 projects', 'Community support', 'Basic reports'], false) + priceTier('Pro', '$24', ['Unlimited projects', 'Priority support', 'Advanced reports', 'Team permissions'], true) + priceTier('Business', '$79', ['Single sign-on', 'Audit log', 'Dedicated manager'], false)}</div>
</div></section>

<section class="sec"><div class="in narrow"><h2 class="center">Frequently asked questions</h2>
  <div class="faq">${FAQ.map(([q, a], i) => `<details${i === 0 ? ' open' : ''}><summary>${q}</summary><p>${a}</p></details>`).join('')}</div>
  <form class="sub-form" onsubmit="return false"><input type="email" placeholder="you@company.com" aria-label="Email"><a class="btn btn-pri">Subscribe</a></form>
</div></section>

<section class="band"><div class="in"><h2>Ready to get started with ${name}?</h2><p>Join thousands of people already using it every day.</p><div class="cta"><a class="btn btn-inv btn-lg">${esc(copy.cta[0])}</a><a class="btn btn-ghost btn-lg">${esc(copy.cta[1])}</a></div></div></section>

<footer class="foot"><div class="in">
  <div class="fcols"><div><b class="logo">${name}</b><p>Sample footer for a page built from the ${name} design tokens.</p></div>
  ${[['Product', ['Overview', 'Pricing', 'Changelog']], ['Company', ['About', 'Careers', 'Press']], ['Resources', ['Docs', 'Help center', 'Contact']]].map(([h, l]) => `<div><h5>${h}</h5>${l.map((x) => `<a>${x}</a>`).join('')}</div>`).join('')}</div>
  <p class="legal">© 2026 ${name} (sample). Not affiliated with, or endorsed by, the brand shown. A generic sample page that applies this brand's colors, type and radii from its DESIGN.md — it is not a copy of the real site.</p>
</div></footer>
</body></html>`;
}
