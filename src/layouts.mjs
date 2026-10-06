// Page-layout library: 14 classic website structures rendered with CSS variables (colors, type, radii) taken from a brand's DESIGN.md.
// Isomorphic on purpose: used at build time (default layout) and in the browser (switching with ?layout=...). No imports, no DOM needed to render.
// The 14 structure names follow the classic layout taxonomy (columns, sidebars, split, hero, F/Z patterns, grid, sticky, masonry);
// the markup and visuals here are original. Inspired by https://html-layout-patterns.netlify.app/

export const LAYOUTS = [
  { key: 'single', n: 1, group: 'คอลัมน์', th: 'Single Column', thai: 'คอลัมน์เดียว', desc: 'เนื้อหาเรียงแนวตั้งเส้นเดียวจากบนลงล่าง อ่านง่ายและโฟกัสเนื้อหาหลัก เหมาะกับ landing page สั้นๆ และเว็บมือถือเป็นหลัก', tags: ['Mobile First', 'Landing Page', 'เริ่มต้นง่าย'] },
  { key: 'two', n: 2, group: 'คอลัมน์', th: 'Two Column', thai: 'สองคอลัมน์', desc: 'แบ่งเป็นเนื้อหาหลักกับข้อมูลเสริม (aside) อย่างสมดุล เหมาะกับบล็อกและเว็บข่าว', tags: ['Main + Aside', 'บล็อก', 'ฟีดบทความ'] },
  { key: 'three', n: 3, group: 'คอลัมน์', th: 'Three Column', thai: 'สามคอลัมน์', desc: 'เมนู เนื้อหา และวิดเจ็ตเรียงขนานกัน 3 ฝั่ง เหมาะกับพอร์ทัลข่าว ชุมชน หรือแดชบอร์ดข้อมูล', tags: ['พอร์ทัล', 'ข้อมูลหนาแน่น', 'วิดเจ็ต'] },
  { key: 'sidebar-left', n: 4, group: 'แถบข้าง', th: 'Sidebar Left', thai: 'แถบนำทางซ้าย', desc: 'เมนูหลักตรึงด้านซ้าย พับเก็บได้ เหมาะกับระบบหลังบ้านและแดชบอร์ด', tags: ['Admin', 'Dashboard', 'พับเมนูได้'] },
  { key: 'sidebar-right', n: 5, group: 'แถบข้าง', th: 'Sidebar Right', thai: 'แถบข้างด้านขวา', desc: 'เนื้อหาหลักอยู่ซ้าย แถบขวาไว้บทความยอดนิยม แท็ก และเครื่องมือปรับตัวอักษร', tags: ['บทความ', 'แท็ก', 'ปรับขนาดตัวอักษร'] },
  { key: 'split', n: 6, group: 'Hero & Split', th: 'Split Screen', thai: 'แบ่งครึ่งหน้าจอ', desc: 'แบ่งสองฝั่งเท่ากัน ฝั่งหนึ่งเล่าเรื่อง อีกฝั่งโชว์ของ ให้ความรู้สึกทันสมัยและเหมาะกับการเปรียบเทียบคู่', tags: ['50/50', 'นำเสนอสินค้า', 'ทันสมัย'] },
  { key: 'hero', n: 7, group: 'Hero & Split', th: 'Hero Header + CTA', thai: 'ส่วนหัวเด่นพร้อมปุ่ม CTA', desc: 'แบนเนอร์บนสุดเน้นสโลแกน ภาพผลิตภัณฑ์ และปุ่มกระตุ้นการตัดสินใจ ตามด้วยส่วนจุดเด่น ราคา และ FAQ', tags: ['Landing', 'CTA', 'ผลิตภัณฑ์'] },
  { key: 'f-pattern', n: 8, group: 'ลำดับสายตา', th: 'F-Pattern', thai: 'จัดตามสายตาตัว F', desc: 'จัดเนื้อหาตามการกวาดสายตาแบบตัว F: หัวข้อและย่อหน้านำกว้างเต็มบรรทัด ตามด้วยบรรทัดที่สั้นลงเรื่อยๆ เหมาะกับหน้าที่มีข้อความมาก', tags: ['ข้อความเยอะ', 'บทความ', 'การอ่าน'] },
  { key: 'z-pattern', n: 9, group: 'ลำดับสายตา', th: 'Z-Pattern', thai: 'จัดตามสายตาตัว Z', desc: 'สลับภาพและข้อความซ้ายขวาให้สายตาไหลเป็นซิกแซก เล่าเรื่องผลิตภัณฑ์ตามลำดับ', tags: ['Zig-Zag', 'เล่าเรื่อง', 'Landing'] },
  { key: 'card-grid', n: 10, group: 'กริด', th: 'Card Grid', thai: 'ตารางการ์ด', desc: 'การ์ดขนาดเท่ากันเรียงเป็นกริด พร้อมค้นหาและตัวกรอง เหมาะกับสินค้า คอร์สเรียน และพอร์ตโฟลิโอ', tags: ['แคตตาล็อก', 'ตัวกรอง', 'Responsive'] },
  { key: 'full-hero', n: 11, group: 'Hero & Split', th: 'Full Width Hero', thai: 'ฮีโร่เต็มจอ', desc: 'ภาพหรือพื้นหลังขยายเต็มหน้าจอ สร้างอารมณ์ร่วมสูงสุดตั้งแต่เห็นหน้าแรก เหมาะกับแบรนด์ที่ขายความรู้สึก', tags: ['Immersive', 'เต็มจอ', 'แบรนด์'] },
  { key: 'sticky-header', n: 12, group: 'Sticky', th: 'Sticky Header', thai: 'เมนูยึดด้านบน', desc: 'แถบนำทางติดบนสุดตลอดการเลื่อน หดขนาดลงเมื่อเลื่อน พร้อมแถบความคืบหน้าการอ่าน (ลองเลื่อนหน้าดู)', tags: ['Scroll Shrink', 'Reading Progress', 'หน้ายาว'] },
  { key: 'sticky-footer', n: 13, group: 'Sticky', th: 'Sticky Footer', thai: 'แถบท้ายยึดด้านล่าง', desc: 'แถบข้อเสนอหรือแจ้งเตือนติดล่างสุดตลอดเวลา พร้อมนาฬิกานับถอยหลัง', tags: ['โปรโมชัน', 'Countdown', 'CTA ถาวร'] },
  { key: 'masonry', n: 14, group: 'กริด', th: 'Masonry', thai: 'การ์ดสลับความสูง', desc: 'การ์ดหลายความสูงต่อกันแน่นแบบ Pinterest เหมาะกับแกลเลอรี ภาพ และงานครีเอทีฟ', tags: ['Pinterest', 'แกลเลอรี', 'หลายคอลัมน์'] }
];
export const LAYOUT_KEYS = LAYOUTS.map((l) => l.key);

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ACC = (i) => `a${(i % 6) + 1}`;
const cover = (i, h = 160, round = true) => `<div class="cv" style="height:${h}px;${round ? '' : 'border-radius:0;'}background:linear-gradient(${120 + (i % 4) * 25}deg,color-mix(in srgb,var(--${ACC(i)}) 78%,var(--bg)),color-mix(in srgb,var(--${ACC(i + 2)}) 38%,var(--sur)))"></div>`;
const btn = (t, k = 'pri', x = '') => `<a class="btn btn-${k}${x ? ' ' + x : ''}">${esc(t)}</a>`;

const ARTICLES = [
  ['Designing with a clear point of view', 'Why consistency beats novelty when you are building something people use every day.'],
  ['Five habits of teams that ship', 'Small routines that keep projects moving without adding more meetings.'],
  ['What changed this quarter', 'A short tour of the improvements we made, and what we learned along the way.'],
  ['A closer look at the new release', 'New capabilities, sensible defaults and a few details you may have missed.'],
  ['Behind the scenes: how we build', 'From first sketch to production, the decisions that shaped the product.'],
  ['Customer story: from idea to launch', 'How one small team went live in weeks and what they would do differently.'],
  ['Getting more from the basics', 'Simple techniques that make everyday work faster and calmer.'],
  ['The case for slowing down', 'Taking time at the start can save months later. Here is how to decide.']
];
const PRODUCTS = {
  auto: [['Coupé', '$189,000', 'Models'], ['Spider', '$214,000', 'Models'], ['Grand Tourer', '$249,000', 'Models'], ['Sport Sedan', '$162,000', 'Models'], ['Track Edition', '$420,000', 'Limited'], ['Heritage Series', '$330,000', 'Limited'], ['Accessories Kit', '$1,900', 'Parts'], ['Driver Gear', '$340', 'Apparel']],
  hardware: [['Phone Pro', '$999', 'Phone'], ['Phone', '$799', 'Phone'], ['Watch', '$399', 'Watch'], ['Buds', '$179', 'Audio'], ['Laptop Air', '$1,099', 'Laptop'], ['Tablet', '$599', 'Tablet'], ['Charger', '$39', 'Accessory'], ['Case', '$49', 'Accessory']],
  consumer: [['Weekend Edit', 'Collection', 'Style'], ['Home Studio', 'Collection', 'Home'], ['Trail Notes', 'Guide', 'Outdoors'], ['Slow Kitchen', 'Collection', 'Food'], ['City Weekends', 'Guide', 'Travel'], ['Pocket Gifts', 'Collection', 'Gifts'], ['Quiet Corners', 'Collection', 'Home'], ['Fresh Finds', 'Daily', 'New']],
  _: [['Starter template', 'Free', 'Templates'], ['Dashboard kit', '$29', 'Templates'], ['Launch checklist', 'Free', 'Guides'], ['Team workspace', '$12/mo', 'Plans'], ['Analytics pack', '$19/mo', 'Add-ons'], ['Security review', '$99', 'Services'], ['Migration help', '$149', 'Services'], ['Pro support', '$49/mo', 'Plans']]
};
const products = (M) => PRODUCTS[M.category] || PRODUCTS._;
const CATS = (M) => [...new Set(products(M).map((p) => p[2]))];

/* ---------- shared blocks ---------- */
const announce = (M) => `<div class="announce"><span class="pill">${esc(M.copy.eyebrow)}</span> See what’s new in ${esc(M.name)} →</div>`;
const NAV = (M, cls = '', extra = '') => `<header class="nav ${cls}" ${extra}><div class="in"><b class="logo">${esc(M.name)}</b><nav>${M.copy.nav.map((n) => `<a>${esc(n)}</a>`).join('')}</nav><div class="nav-cta"><a class="btn btn-sec">Sign in</a>${btn(M.copy.cta[0])}</div></div></header>`;
const FOOT = (M) => `<footer class="foot"><div class="in"><div class="fcols"><div><b class="logo">${esc(M.name)}</b><p>Sample footer for a page built from the ${esc(M.name)} design tokens.</p></div>${[['Product', ['Overview', 'Pricing', 'Changelog']], ['Company', ['About', 'Careers', 'Press']], ['Resources', ['Docs', 'Help center', 'Contact']]].map(([h, l]) => `<div><h5>${h}</h5>${l.map((x) => `<a>${x}</a>`).join('')}</div>`).join('')}</div><p class="legal">© 2026 ${esc(M.name)} (sample). Not affiliated with, or endorsed by, the brand shown. A generic sample page that applies this brand's colors, type and radii from its DESIGN.md — it is not a copy of the real site.</p></div></footer>`;
const ctaBand = (M) => `<section class="band" style="background:var(--cta);color:var(--oncta);--pri:var(--cta);--onpri:var(--oncta)"><div class="in"><h2>Ready to get started with ${esc(M.name)}?</h2><p>Join thousands of people already using it every day.</p><div class="cta">${btn(M.copy.cta[0], 'inv', 'btn-lg')}${btn(M.copy.cta[1], 'ghost', 'btn-lg')}</div></div></section>`;
const featureCards = (M, n = 6) => M.feats.slice(0, n).map(([h, p], i) => `<article class="card tint${(i % 3) + 1}${M.tileCount ? ' tile' + ((i % M.tileCount) + 1) : ''}"><div class="ico" style="background:var(--${i % 6 === 0 ? 'pri' : 'a' + (i % 6)})"></div><h3>${esc(h)}</h3><p>${esc(p)}</p><a class="lnk">Learn more →</a></article>`).join('');
const quote = () => `<figure class="quote"><blockquote>“It changed how our whole team works. We shipped in weeks what used to take months.”</blockquote><figcaption><span class="av"></span><div><b>Alex Morgan</b><small>Head of Product, Northwind</small></div></figcaption></figure>`;
const heading = (eb, h, lede, c = '') => `<p class="eyebrow ${c}">${esc(eb)}</p><h2 class="${c}">${esc(h)}</h2>${lede ? `<p class="lede ${c}">${esc(lede)}</p>` : ''}`;
const newsletter = () => `<form class="sub-form stack" onsubmit="return false"><input type="email" placeholder="you@company.com" aria-label="Email">${btn('Subscribe')}</form>`;
const barChart = (cls = '') => `<div class="chart ${cls}">${[38, 52, 44, 68, 58, 80, 72, 94, 84].map((h, i) => `<span style="height:${h}%;background:var(--${i % 3 === 0 ? 'a1' : i % 3 === 1 ? 'pri' : 'a2'})"></span>`).join('')}</div>`;

/* ---------- existing default (Hero + CTA) pieces ---------- */
const appMock = () => `<div class="mock" aria-hidden="true"><div class="mock-bar"><i></i><i></i><i></i><span></span></div><div class="mock-body"><div class="mock-side">${['Overview', 'Projects', 'Activity', 'Reports', 'Settings'].map((x, i) => `<div class="${i === 0 ? 'on' : ''}">${x}</div>`).join('')}</div><div class="mock-main"><div class="kpis"><div><small>Revenue</small><b>$48.2k</b></div><div><small>Active users</small><b>12,480</b></div><div><small>Conversion</small><b>3.8%</b></div></div>${barChart()}<div class="rows">${[['Acme Inc.', 'Paid', '$2,400'], ['Globex', 'Pending', '$1,150'], ['Initech', 'Failed', '$880'], ['Umbrella', 'Paid', '$640']].map(([a, s, v]) => `<div><span>${a}</span><em class="pill ${s === 'Paid' ? 'ok' : s === 'Failed' ? 'err' : 'soft'}">${s}</em><b>${v}</b></div>`).join('')}</div></div></div></div>`;
const editorialHero = (M) => `<div class="ed${M.lightPriOnDark ? ' soft' : ''}" aria-hidden="true"><div class="ed-hero"><span>${esc(M.copy.eyebrow)}</span><b>${esc(M.name)}</b></div><div class="ed-cards">${['Signature', 'Sport', 'Classic'].map((n, i) => `<div class="ed-card"><div class="ed-img" style="background:linear-gradient(${135 + i * 25}deg,color-mix(in srgb,var(--pri) ${[80, 55, 32][i]}%,var(--bg)),color-mix(in srgb,var(--pri) ${[30, 18, 8][i]}%,var(--sur)))"></div><h4>${n}</h4><p>From $${49 + i * 20},900</p><a class="lnk">Discover →</a></div>`).join('')}</div></div>`;
const tier = (title, price, items, featured, cta = 'Choose plan', per = '/mo') => `<div class="tier${featured ? ' feat' : ''}">${featured ? '<em class="pill">Most popular</em>' : ''}<h3>${title}</h3><div class="price">${price}${per ? `<small>${per}</small>` : ''}</div><ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul><a class="btn ${featured ? 'btn-inv' : 'btn-pri'}">${cta}</a></div>`;
const pricing = (M) => `<section class="sec alt alt2"><div class="in"><p class="eyebrow center">${M.oneTime ? 'Configurations' : 'Pricing'}</p><h2 class="center">${M.oneTime ? 'Choose the one that fits you' : 'Simple plans that grow with you'}</h2><div class="grid3 tiers">${M.oneTime
  ? tier('Essential', M.category === 'auto' ? '$189k' : '$799', ['Core specification', 'Standard finish', '2-year warranty'], false, 'Configure', '') + tier('Performance', M.category === 'auto' ? '$249k' : '$1,099', ['Upgraded performance', 'Premium materials', 'Extended warranty', 'Priority service'], true, 'Configure', '') + tier('Collector', M.category === 'auto' ? '$420k' : '$1,499', ['Limited edition', 'Bespoke options', 'Concierge support'], false, 'Configure', '')
  : tier('Starter', '$0', ['Up to 3 projects', 'Community support', 'Basic reports'], false) + tier('Pro', '$24', ['Unlimited projects', 'Priority support', 'Advanced reports', 'Team permissions'], true) + tier('Business', '$79', ['Single sign-on', 'Audit log', 'Dedicated manager'], false)}</div></div></section>`;
const faq = () => `<section class="sec"><div class="in narrow"><h2 class="center">Frequently asked questions</h2><div class="faq">${[['Can I try it before paying?', 'Yes. Start with the free plan and upgrade only when you need more.'], ['Is my data secure?', 'Your data is encrypted in transit and at rest, and you stay in control of who can see it.'], ['Can I cancel at any time?', 'Absolutely. There are no long-term contracts and you can cancel whenever you like.']].map(([q, a], i) => `<details${i === 0 ? ' open' : ''}><summary>${q}</summary><p>${a}</p></details>`).join('')}</div>${newsletter()}</div></section>`;
const stats = (M) => `<section class="stats${M.hasBand ? ' band' : ''}"><div class="in">${M.specs.map(([n, l]) => `<div><b>${n}</b><span>${l}</span></div>`).join('')}</div></section>`;

function heroLayout(M) {
  const c = M.copy;
  return `${announce(M)}${NAV(M)}
<section class="hero"><div class="in"><p class="eyebrow">${esc(c.eyebrow)}</p><h1>${esc(c.h1)}</h1><p class="sub">${esc(c.sub)}</p><div class="cta">${btn(c.cta[0], 'pri', 'btn-lg')}${btn(c.cta[1], 'sec', 'btn-lg')}</div><p class="fine">${esc(c.fine)}</p>${M.editorial ? editorialHero(M) : appMock()}</div></section>
<section class="logos"><div class="in"><p>Trusted by teams everywhere</p><div>${['Northwind', 'Halcyon', 'Parallel', 'Oakridge', 'Lumen', 'Vertex'].map((l) => `<span>${l}</span>`).join('')}</div></div></section>
<section class="sec"><div class="in">${heading('Features', 'Everything you need, nothing you don’t', 'A focused set of capabilities designed to help you get to the result faster.')}<div class="grid3">${featureCards(M)}</div></div></section>
<section class="sec alt"><div class="in split"><div>${heading('How it works', 'Start simple, scale when you’re ready', 'Set up in minutes, invite your team and grow without rebuilding from scratch.')}<ul class="checks"><li>Guided setup and sensible defaults</li><li>Clear permissions for every role</li><li>Reports you can share in one click</li></ul>${btn(c.cta[0])}</div><div class="panel" aria-hidden="true">${barChart('tall')}<div class="legend"><span><i style="background:var(--pri)"></i>This year</span><span><i style="background:var(--a1)"></i>Last year</span></div></div></div></section>
${stats(M)}
<section class="sec"><div class="in">${quote()}</div></section>
${pricing(M)}${faq()}${ctaBand(M)}${FOOT(M)}`;
}

/* ---------- the other 13 layouts ---------- */
function singleLayout(M) {
  const c = M.copy;
  return `${announce(M)}${NAV(M)}
<main class="lay-single">
<section class="s-hero in narrow"><p class="eyebrow">${esc(c.eyebrow)}</p><h1>${esc(c.h1)}</h1><p class="sub">${esc(c.sub)}</p><div class="cta">${btn(c.cta[0], 'pri', 'btn-lg')}${btn(c.cta[1], 'sec', 'btn-lg')}</div></section>
<section class="in narrow s-block"><h2>Why people choose ${esc(M.name)}</h2><div class="s-list">${M.feats.slice(0, 4).map(([h, p], i) => `<div class="s-row"><div class="ico" style="background:var(--${i % 6 === 0 ? 'pri' : 'a' + (i % 6)})"></div><div><h3>${esc(h)}</h3><p>${esc(p)}</p></div></div>`).join('')}</div></section>
<section class="in narrow s-block">${quote()}</section>
<section class="in narrow s-block"><h2>How it works</h2><ol class="steps">${['Create your account in a minute', 'Connect the tools you already use', 'Invite your team and start working'].map((s, i) => `<li><b>${i + 1}</b><span>${s}</span></li>`).join('')}</ol></section>
</main>${ctaBand(M)}${FOOT(M)}`;
}

function twoLayout(M) {
  return `${NAV(M)}
<main class="in two-col"><div class="tc-main"><p class="eyebrow">The journal</p><h1 class="page-h">Latest stories</h1>
${ARTICLES.slice(0, 5).map(([t, e], i) => `<article class="post">${cover(i, 190)}<div><small class="meta">Product · ${3 + i} min read</small><h3>${esc(t)}</h3><p>${esc(e)}</p><a class="lnk">Read more →</a></div></article>`).join('')}</div>
<aside class="tc-aside"><div class="widget"><h4>About</h4><p>${esc(M.name)} is a sample publication that uses this brand's colors and type.</p></div><div class="widget"><h4>Categories</h4><ul class="plain">${['Product', 'Design', 'Engineering', 'Customers', 'Company'].map((x, i) => `<li>${x}<span>${12 - i * 2}</span></li>`).join('')}</ul></div><div class="widget"><h4>Popular</h4><ol class="pop">${ARTICLES.slice(5).map(([t]) => `<li>${esc(t)}</li>`).join('')}</ol></div><div class="widget"><h4>Newsletter</h4>${newsletter()}</div></aside></main>${FOOT(M)}`;
}

function threeLayout(M) {
  return `${NAV(M)}<div class="ticker"><div class="in"><b>Live</b> <span>New release is rolling out</span> · <span>Status: all systems operational</span> · <span>Join the community call on Friday</span></div></div>
<div class="in three-col">
<nav class="col-l" aria-label="Sections">${[['Browse', ['Top stories', 'Latest', 'Guides', 'Videos']], ['Topics', M.copy.nav.concat(['Community'])], ['Account', ['Saved', 'Settings']]].map(([h, l]) => `<h5>${h}</h5><ul class="plain">${l.map((x, i) => `<li class="${h === 'Browse' && i === 0 ? 'on' : ''}">${esc(x)}</li>`).join('')}</ul>`).join('')}</nav>
<main class="col-c"><article class="lead-story">${cover(0, 230)}<small class="meta">Featured</small><h2>${esc(ARTICLES[0][0])}</h2><p>${esc(ARTICLES[0][1])}</p></article>${ARTICLES.slice(1, 6).map(([t, e], i) => `<article class="item"><div class="thumb">${cover(i + 1, 64)}</div><div><h4>${esc(t)}</h4><small class="meta">${i + 2}h ago · ${3 + i} min</small></div></article>`).join('')}</main>
<aside class="col-r"><div class="widget"><h4>Trending</h4><ol class="pop">${ARTICLES.slice(2, 6).map(([t]) => `<li>${esc(t)}</li>`).join('')}</ol></div><div class="widget stat"><h4>This week</h4><b>12,480</b><small>active readers</small></div><div class="widget"><h4>Join us</h4><p>Get the weekly digest.</p>${btn(M.copy.cta[0])}</div></aside>
</div>${FOOT(M)}`;
}

function sidebarLeftLayout(M) {
  const items = ['Overview', 'Analytics', 'Customers', 'Orders', 'Settings'];
  return `<div class="dash" data-collapse-root><aside class="d-side"><div class="d-brand"><b class="logo">${esc(M.name)}</b><button class="d-toggle" data-collapse aria-label="Toggle menu">☰</button></div>
<nav>${items.map((x, i) => `<a class="${i === 0 ? 'on' : ''}"><i>${x[0]}</i><span>${x}</span></a>`).join('')}</nav></aside>
<main class="d-main"><header class="d-top"><input type="search" placeholder="Search…" aria-label="Search"><div class="d-user"><span class="av"></span><b>Alex</b></div></header>
<div class="d-body"><h1 class="page-h">Overview</h1><div class="d-kpis">${[['Revenue', '$48.2k', '+12%'], ['Active users', '12,480', '+4%'], ['Conversion', '3.8%', '−0.3%'], ['Open tickets', '23', '−8']].map(([l, v, d], i) => `<div class="kpi"><small>${l}</small><b>${v}</b><em style="color:var(--${i === 2 ? 'err' : 'okc'})">${d}</em></div>`).join('')}</div>
<div class="d-grid"><div class="panel"><h4>Revenue</h4>${barChart('tall')}</div><div class="panel"><h4>Recent activity</h4><div class="rows">${[['Acme Inc.', 'Paid', '$2,400'], ['Globex', 'Pending', '$1,150'], ['Initech', 'Failed', '$880'], ['Umbrella', 'Paid', '$640'], ['Hooli', 'Paid', '$520']].map(([a, s, v]) => `<div><span>${a}</span><em class="pill ${s === 'Paid' ? 'ok' : s === 'Failed' ? 'err' : 'soft'}">${s}</em><b>${v}</b></div>`).join('')}</div></div></div></div></main></div>`;
}

function sidebarRightLayout(M) {
  return `${NAV(M)}<main class="in side-right"><article class="art" data-article><p class="eyebrow">Productivity</p><h1 class="page-h">${esc(ARTICLES[1][0])}</h1><div class="byline"><span class="av"></span><div><b>Alex Morgan</b><small>6 min read</small></div></div>${cover(1, 260)}
<p>${esc(ARTICLES[1][1])} The best teams treat their routines like products: they test them, measure them and remove whatever does not help.</p><p>Start small. Pick one habit, run it for two weeks and write down what changed. If nothing improved, drop it without guilt.</p><blockquote class="pull">Good habits are boring on purpose.</blockquote><h3>1. Decide what “done” means</h3><p>Clear finish lines make hand-offs easy and reduce the back-and-forth that eats most of the week.</p><h3>2. Keep meetings for decisions</h3><p>Share updates in writing, and save live time for questions that need a conversation.</p></article>
<aside class="sr-aside"><div class="widget"><h4>Text size</h4><div class="fs"><button class="btn btn-sec" data-fs="-1">A−</button><button class="btn btn-sec" data-fs="0">A</button><button class="btn btn-sec" data-fs="1">A+</button></div></div><div class="widget"><h4>Popular posts</h4><ol class="pop">${ARTICLES.slice(2, 6).map(([t]) => `<li>${esc(t)}</li>`).join('')}</ol></div><div class="widget"><h4>Tags</h4><div class="tags">${['Habits', 'Teams', 'Focus', 'Tools', 'Writing', 'Remote'].map((x) => `<span class="tag">${x}</span>`).join('')}</div></div><div class="widget"><h4>Newsletter</h4>${newsletter()}</div></aside></main>${FOOT(M)}`;
}

function splitLayout(M) {
  const c = M.copy;
  return `<div class="split-screen"><section class="ss-left"><b class="logo">${esc(M.name)}</b><div><p class="eyebrow">${esc(c.eyebrow)}</p><h1>${esc(c.h1)}</h1><p class="sub">${esc(c.sub)}</p><div class="cta left">${btn(c.cta[0], 'inv', 'btn-lg')}${btn(c.cta[1], 'ghost', 'btn-lg')}</div></div><small>${esc(c.fine)}</small></section>
<section class="ss-right"><div class="ss-stack">${M.feats.slice(0, 3).map(([h, p], i) => `<article class="card tint${i + 1}${M.tileCount ? ' tile' + ((i % M.tileCount) + 1) : ''}"><div class="ico" style="background:var(--${i === 0 ? 'pri' : 'a' + (i + 1)})"></div><h3>${esc(h)}</h3><p>${esc(p)}</p></article>`).join('')}<div class="ss-stats">${M.specs.slice(0, 3).map(([n, l]) => `<div><b>${n}</b><span>${l}</span></div>`).join('')}</div></div></section></div>`;
}

function fPatternLayout(M) {
  return `${NAV(M)}<main class="in f-pat"><header class="f-head"><p class="eyebrow">Guide</p><h1 class="page-h">${esc(ARTICLES[0][0])}</h1><p class="f-lead">${esc(ARTICLES[0][1])} This guide covers the essentials in the order most readers need them, so you can stop whenever you have what you came for.</p></header>
<div class="f-body"><div class="f-main"><h2>The short version</h2><p class="f-bar1">Start with the outcome you want, then work backwards to the smallest set of steps that gets you there.</p><p class="f-bar2">Keep each step measurable so you can tell quickly if it is working.</p><h2>Key points</h2><ul class="f-list"><li><b>Clarity first.</b> Say what it is in one sentence.</li><li><b>One action.</b> Give people a single obvious next step.</li><li><b>Proof.</b> Show evidence instead of adjectives.</li></ul><h2>Going deeper</h2><p class="f-bar3">Details live here for readers who want them.</p></div>
<aside class="f-aside"><div class="widget"><h4>On this page</h4><ul class="plain toc"><li class="on">The short version</li><li>Key points</li><li>Going deeper</li></ul></div><div class="widget"><h4>At a glance</h4><dl class="facts"><dt>Time</dt><dd>5 min</dd><dt>Level</dt><dd>Beginner</dd><dt>Updated</dt><dd>This week</dd></dl></div></aside></div></main>${FOOT(M)}`;
}

function zPatternLayout(M) {
  const rows = M.feats.slice(0, 4);
  const vis = (i) => `<div class="z-vis">${i % 2 ? `<div class="panel" aria-hidden="true">${barChart('tall')}</div>` : cover(i, 260)}</div>`;
  return `${NAV(M)}<main>${rows.map(([h, p], i) => `<section class="z-row${i % 2 ? ' rev' : ''}${i % 2 ? ' alt' : ''}"><div class="in z-in"><div class="z-text">${i === 0 ? `<p class="eyebrow">${esc(M.copy.eyebrow)}</p><h1>${esc(M.copy.h1)}</h1><p class="sub">${esc(M.copy.sub)}</p>` : `<p class="eyebrow">0${i + 1} — ${esc(h)}</p><h2>${esc(h)}</h2><p class="lede">${esc(p)}</p>`}<div class="cta left">${btn(i === 0 ? M.copy.cta[0] : 'Learn more', i % 2 ? 'sec' : 'pri', 'btn-lg')}</div></div>${vis(i)}</div></section>`).join('')}</main>${ctaBand(M)}${FOOT(M)}`;
}

function cardGridLayout(M) {
  const cats = CATS(M), list = products(M);
  return `${NAV(M)}<main class="in"><div class="cg-head"><div><p class="eyebrow">Catalog</p><h1 class="page-h">${M.oneTime ? 'Explore the range' : 'Browse everything'}</h1></div><input type="search" placeholder="Search…" aria-label="Search" data-search></div>
<div class="chips-row"><button class="chip on" data-filter="">All</button>${cats.map((c) => `<button class="chip" data-filter="${esc(c)}">${esc(c)}</button>`).join('')}</div>
<div class="cg-grid" data-grid>${list.map(([n, pr, c], i) => `<article class="pcard" data-cat="${esc(c)}" data-name="${esc(n.toLowerCase())}">${cover(i, 150)}<div class="pc-body"><small class="meta">${esc(c)}</small><h3>${esc(n)}</h3><div class="pc-foot"><b>${esc(pr)}</b>${btn('View', 'sec', 'sm')}</div></div></article>`).join('')}</div>
<nav class="pager" aria-label="Pagination"><a class="btn btn-sec sm">←</a><span class="on">1</span><span>2</span><span>3</span><a class="btn btn-sec sm">→</a></nav></main>${FOOT(M)}`;
}

function fullHeroLayout(M) {
  const c = M.copy;
  return `<section class="fh"><div class="fh-bg" aria-hidden="true"></div><header class="nav fh-nav"><div class="in"><b class="logo">${esc(M.name)}</b><nav>${c.nav.map((n) => `<a>${esc(n)}</a>`).join('')}</nav><div class="nav-cta">${btn(c.cta[0], 'inv')}</div></div></header>
<div class="in fh-copy"><p class="eyebrow">${esc(c.eyebrow)}</p><h1>${esc(c.h1)}</h1><p class="sub">${esc(c.sub)}</p><div class="cta left">${btn(c.cta[0], 'inv', 'btn-lg')}${btn(c.cta[1], 'ghost', 'btn-lg')}</div></div><div class="fh-scroll" aria-hidden="true">Scroll ↓</div></section>
<section class="sec"><div class="in">${heading('Highlights', 'Made to be experienced', '')}<div class="grid3">${featureCards(M, 3)}</div></div></section>${stats(M)}<section class="sec"><div class="in">${quote()}</div></section>${ctaBand(M)}${FOOT(M)}`;
}

function stickyHeaderLayout(M) {
  const secs = M.feats.concat(M.feats).slice(0, 7);
  return `${NAV(M, 'sticky', 'data-shrink')}<div class="progress" aria-hidden="true"><i data-progress></i></div>
<main class="in narrow long"><p class="eyebrow">Long read</p><h1 class="page-h">${esc(ARTICLES[4][0])}</h1><p class="sub">${esc(ARTICLES[4][1])} Scroll down: the header shrinks and the bar above tracks how far you have read.</p>${cover(4, 260)}
${secs.map(([h, p], i) => `<h3>${i + 1}. ${esc(h)}</h3><p>${esc(p)} The details matter: small decisions, repeated every day, are what people end up remembering about a product.</p><p>${esc(ARTICLES[(i + 2) % 8][1])}</p>`).join('')}</main>${ctaBand(M)}${FOOT(M)}`;
}

function stickyFooterLayout(M) {
  const c = M.copy;
  return `${NAV(M)}<section class="hero"><div class="in"><p class="eyebrow">${esc(c.eyebrow)}</p><h1>${esc(c.h1)}</h1><p class="sub">${esc(c.sub)}</p><div class="cta">${btn(c.cta[0], 'pri', 'btn-lg')}${btn(c.cta[1], 'sec', 'btn-lg')}</div></div></section>
<section class="sec"><div class="in">${heading('Features', 'Everything in one place', '')}<div class="grid3">${featureCards(M)}</div></div></section>${pricing(M)}${faq()}${FOOT(M)}
<div class="sticky-bar" role="region" aria-label="Special offer"><div class="in"><span><b>Limited offer:</b> save 20% on your first year</span><span class="cd" data-countdown><i data-h>02</i>:<i data-m>13</i>:<i data-s>45</i></span>${btn(c.cta[0], 'inv', 'sm')}</div></div>`;
}

function masonryLayout(M) {
  const hs = [220, 160, 280, 190, 240, 150, 300, 200, 170, 260, 210, 180];
  const items = ARTICLES.concat(ARTICLES.slice(0, 4));
  return `${NAV(M)}<main class="in"><div class="cg-head"><div><p class="eyebrow">Gallery</p><h1 class="page-h">Inspiration wall</h1></div></div>
<div class="chips-row">${['All', 'Design', 'Product', 'People', 'Places'].map((c, i) => `<button class="chip${i === 0 ? ' on' : ''}" data-filter="${i === 0 ? '' : c}">${c}</button>`).join('')}</div>
<div class="masonry" data-grid>${items.map(([t], i) => `<article class="mitem" data-cat="${['Design', 'Product', 'People', 'Places'][i % 4]}" style="--mh:${hs[i % hs.length]}px">${cover(i, hs[i % hs.length], true)}<div class="m-cap"><b>${esc(t)}</b><small>${['Design', 'Product', 'People', 'Places'][i % 4]}</small></div></article>`).join('')}</div></main>${FOOT(M)}`;
}

/* ---------- Thai preview: model copy comes from M.th, the fixed UI strings are translated here ---------- */
const TH = {
  'Sign in': 'เข้าสู่ระบบ', 'Learn more': 'ดูเพิ่มเติม', 'Learn more →': 'ดูเพิ่มเติม →', 'Most popular': 'ยอดนิยม', 'Choose plan': 'เลือกแผนนี้', 'Configure': 'กำหนดรุ่น', 'Configurations': 'รุ่นให้เลือก', 'Pricing': 'ราคา',
  'Choose the one that fits you': 'เลือกแบบที่เหมาะกับคุณ', 'Simple plans that grow with you': 'แผนเรียบง่ายที่โตไปพร้อมคุณ',
  'Essential': 'พื้นฐาน', 'Performance': 'สมรรถนะ', 'Collector': 'สะสม', 'Starter': 'เริ่มต้น', 'Pro': 'โปร', 'Business': 'ธุรกิจ',
  'Core specification': 'สเปกหลัก', 'Standard finish': 'การตกแต่งมาตรฐาน', '2-year warranty': 'รับประกัน 2 ปี', 'Upgraded performance': 'สมรรถนะที่อัปเกรด', 'Premium materials': 'วัสดุพรีเมียม', 'Extended warranty': 'รับประกันขยายเวลา', 'Priority service': 'บริการแบบเร่งด่วน', 'Limited edition': 'รุ่นจำนวนจำกัด', 'Bespoke options': 'ตัวเลือกสั่งทำพิเศษ', 'Concierge support': 'ดูแลแบบส่วนตัว',
  'Up to 3 projects': 'สูงสุด 3 โปรเจกต์', 'Community support': 'ซัพพอร์ตจากชุมชน', 'Basic reports': 'รายงานพื้นฐาน', 'Unlimited projects': 'โปรเจกต์ไม่จำกัด', 'Priority support': 'ซัพพอร์ตก่อนใคร', 'Advanced reports': 'รายงานขั้นสูง', 'Team permissions': 'กำหนดสิทธิ์ทีม', 'Single sign-on': 'ล็อกอินครั้งเดียว (SSO)', 'Audit log': 'บันทึกการใช้งาน', 'Dedicated manager': 'ผู้ดูแลเฉพาะ',
  '/mo': '/เดือน', 'Frequently asked questions': 'คำถามที่พบบ่อย', 'Subscribe': 'สมัครรับข่าว',
  'Can I try it before paying?': 'ลองใช้ก่อนจ่ายได้ไหม', 'Yes. Start with the free plan and upgrade only when you need more.': 'ได้ เริ่มจากแผนฟรี แล้วอัปเกรดเมื่อต้องการเท่านั้น',
  'Is my data secure?': 'ข้อมูลของฉันปลอดภัยไหม', 'Your data is encrypted in transit and at rest, and you stay in control of who can see it.': 'ข้อมูลถูกเข้ารหัสทั้งตอนส่งและตอนจัดเก็บ และคุณควบคุมได้ว่าใครเห็นอะไร',
  'Can I cancel at any time?': 'ยกเลิกได้ทุกเมื่อไหม', 'Absolutely. There are no long-term contracts and you can cancel whenever you like.': 'ได้แน่นอน ไม่มีสัญญาระยะยาว ยกเลิกเมื่อไรก็ได้',
  'Trusted by teams everywhere': 'ทีมทั่วโลกไว้วางใจ', 'Features': 'จุดเด่น', 'Everything you need, nothing you don’t': 'มีทุกอย่างที่จำเป็น ไม่มีส่วนเกิน', 'A focused set of capabilities designed to help you get to the result faster.': 'ชุดความสามารถที่คัดมาแล้ว เพื่อให้คุณถึงผลลัพธ์ได้เร็วขึ้น',
  'How it works': 'ทำงานอย่างไร', 'Start simple, scale when you’re ready': 'เริ่มง่ายๆ แล้วขยายเมื่อพร้อม', 'Set up in minutes, invite your team and grow without rebuilding from scratch.': 'ตั้งค่าในไม่กี่นาที ชวนทีมมาร่วมงาน แล้วเติบโตได้โดยไม่ต้องเริ่มใหม่',
  'Guided setup and sensible defaults': 'มีตัวช่วยตั้งค่าและค่าเริ่มต้นที่เหมาะสม', 'Clear permissions for every role': 'สิทธิ์ที่ชัดเจนสำหรับทุกบทบาท', 'Reports you can share in one click': 'แชร์รายงานได้ในคลิกเดียว',
  'This year': 'ปีนี้', 'Last year': 'ปีที่แล้ว',
  '“It changed how our whole team works. We shipped in weeks what used to take months.”': '“มันเปลี่ยนวิธีทำงานของทั้งทีม งานที่เคยใช้เป็นเดือน ตอนนี้เสร็จในไม่กี่สัปดาห์”', 'Alex Morgan': 'อเล็กซ์ มอร์แกน', 'Head of Product, Northwind': 'หัวหน้าผลิตภัณฑ์ บริษัทตัวอย่าง',
  'Join thousands of people already using it every day.': 'ร่วมกับผู้คนนับพันที่ใช้งานทุกวัน',
  'Product': 'ผลิตภัณฑ์', 'Company': 'บริษัท', 'Resources': 'แหล่งความรู้', 'Overview': 'ภาพรวม', 'Changelog': 'บันทึกการอัปเดต', 'About': 'เกี่ยวกับ', 'Careers': 'ร่วมงานกับเรา', 'Press': 'ข่าวสาร', 'Docs': 'เอกสาร', 'Help center': 'ศูนย์ช่วยเหลือ', 'Contact': 'ติดต่อ',
  'Why people choose': 'ทำไมคนถึงเลือก', 'Create your account in a minute': 'สร้างบัญชีในหนึ่งนาที', 'Connect the tools you already use': 'เชื่อมต่อเครื่องมือที่คุณใช้อยู่', 'Invite your team and start working': 'ชวนทีมแล้วเริ่มทำงานได้เลย',
  'The journal': 'บันทึก', 'Latest stories': 'เรื่องล่าสุด', 'Read more →': 'อ่านต่อ →', 'Categories': 'หมวดหมู่', 'Popular': 'ยอดนิยม', 'Newsletter': 'จดหมายข่าว', 'Design': 'ดีไซน์', 'Engineering': 'วิศวกรรม', 'Customers': 'ลูกค้า',
  'Live': 'สด', 'New release is rolling out': 'กำลังทยอยปล่อยเวอร์ชันใหม่', 'Status: all systems operational': 'สถานะ: ระบบทำงานปกติ', 'Join the community call on Friday': 'ร่วมคุยกับชุมชนวันศุกร์', 'Browse': 'เรียกดู', 'Top stories': 'เรื่องเด่น', 'Latest': 'ล่าสุด', 'Guides': 'คู่มือ', 'Videos': 'วิดีโอ', 'Topics': 'หัวข้อ', 'Community': 'ชุมชน', 'Account': 'บัญชี', 'Saved': 'ที่บันทึกไว้', 'Settings': 'ตั้งค่า', 'Featured': 'แนะนำ', 'Trending': 'กำลังมาแรง', 'This week': 'สัปดาห์นี้', 'active readers': 'ผู้อ่านที่ใช้งานอยู่', 'Join us': 'ร่วมกับเรา', 'Get the weekly digest.': 'รับสรุปรายสัปดาห์',
  'Analytics': 'วิเคราะห์ข้อมูล', 'Orders': 'คำสั่งซื้อ', 'Revenue': 'รายได้', 'Active users': 'ผู้ใช้งาน', 'Conversion': 'อัตราแปลง', 'Open tickets': 'เรื่องที่เปิดอยู่', 'Recent activity': 'กิจกรรมล่าสุด', 'Projects': 'โปรเจกต์', 'Activity': 'กิจกรรม', 'Reports': 'รายงาน', 'Paid': 'ชำระแล้ว', 'Pending': 'รอดำเนินการ', 'Failed': 'ล้มเหลว',
  'Productivity': 'ประสิทธิภาพการทำงาน', 'Text size': 'ขนาดตัวอักษร', 'Popular posts': 'บทความยอดนิยม', 'Tags': 'แท็ก', 'Habits': 'นิสัย', 'Teams': 'ทีม', 'Focus': 'สมาธิ', 'Tools': 'เครื่องมือ', 'Writing': 'การเขียน', 'Remote': 'ทำงานทางไกล',
  'Good habits are boring on purpose.': 'นิสัยที่ดีน่าเบื่อโดยตั้งใจ', '1. Decide what “done” means': '1. กำหนดให้ชัดว่า “เสร็จ” คืออะไร', '2. Keep meetings for decisions': '2. เก็บการประชุมไว้ตัดสินใจ',
  'Clear finish lines make hand-offs easy and reduce the back-and-forth that eats most of the week.': 'เส้นชัยที่ชัดเจนทำให้ส่งต่องานง่ายและลดการถามไปตอบมาที่กินเวลาเกือบทั้งสัปดาห์', 'Share updates in writing, and save live time for questions that need a conversation.': 'แจ้งความคืบหน้าเป็นลายลักษณ์อักษร และเก็บเวลาคุยสดไว้สำหรับเรื่องที่ต้องคุยจริงๆ',
  'Start small. Pick one habit, run it for two weeks and write down what changed. If nothing improved, drop it without guilt.': 'เริ่มจากเล็กๆ เลือกนิสัยเดียว ลองสองสัปดาห์แล้วจดว่าอะไรเปลี่ยนไป ถ้าไม่ดีขึ้นก็เลิกได้ไม่ต้องรู้สึกผิด',
  'Guide': 'คู่มือ', 'The short version': 'ฉบับสั้น', 'Key points': 'ประเด็นสำคัญ', 'Going deeper': 'เจาะลึก', 'On this page': 'ในหน้านี้', 'At a glance': 'ดูแบบรวดเร็ว', 'Time': 'เวลา', 'Level': 'ระดับ', 'Updated': 'อัปเดต', '5 min': '5 นาที', 'Beginner': 'เริ่มต้น', 'This week ': 'สัปดาห์นี้',
  'Start with the outcome you want, then work backwards to the smallest set of steps that gets you there.': 'เริ่มจากผลลัพธ์ที่ต้องการ แล้วย้อนกลับไปหาขั้นตอนที่น้อยที่สุดที่พาไปถึงได้', 'Keep each step measurable so you can tell quickly if it is working.': 'ทำให้ทุกขั้นตอนวัดผลได้ จะได้รู้เร็วว่าใช้ได้ผลหรือไม่', 'Details live here for readers who want them.': 'รายละเอียดอยู่ตรงนี้สำหรับผู้ที่อยากอ่านต่อ',
  'Clarity first.': 'ชัดเจนก่อน', 'One action.': 'หนึ่งการกระทำ', 'Proof.': 'หลักฐาน', 'Say what it is in one sentence.': 'บอกว่ามันคืออะไรในหนึ่งประโยค', 'Give people a single obvious next step.': 'ให้คนเห็นก้าวถัดไปที่ชัดเจนเพียงอย่างเดียว', 'Show evidence instead of adjectives.': 'แสดงหลักฐานแทนคำคุณศัพท์',
  'Catalog': 'แคตตาล็อก', 'Explore the range': 'สำรวจทุกรุ่น', 'Browse everything': 'ดูทั้งหมด', 'All': 'ทั้งหมด', 'View': 'ดู', 'Gallery': 'แกลเลอรี', 'Inspiration wall': 'กำแพงแรงบันดาลใจ', 'People': 'ผู้คน', 'Places': 'สถานที่',
  'Highlights': 'ไฮไลต์', 'Made to be experienced': 'สร้างมาให้สัมผัส', 'Scroll ↓': 'เลื่อนลง ↓', 'Long read': 'อ่านยาว', 'Everything in one place': 'ทุกอย่างอยู่ในที่เดียว', 'Limited offer:': 'ข้อเสนอจำกัด:', 'Special offer': 'ข้อเสนอพิเศษ',
  'Models': 'รุ่นรถ', 'Limited': 'จำนวนจำกัด', 'Parts': 'อะไหล่', 'Apparel': 'เครื่องแต่งกาย',
  'Starter template': 'เทมเพลตเริ่มต้น', 'Free': 'ฟรี', 'Templates': 'เทมเพลต', 'Dashboard kit': 'ชุดแดชบอร์ด', 'Launch checklist': 'เช็กลิสต์ก่อนเปิดตัว', 'Team workspace': 'พื้นที่ทำงานทีม', 'Plans': 'แผน', 'Analytics pack': 'ชุดวิเคราะห์ข้อมูล', 'Add-ons': 'ส่วนเสริม', 'Security review': 'ตรวจสอบความปลอดภัย', 'Services': 'บริการ', 'Migration help': 'ช่วยย้ายระบบ', 'Pro support': 'ซัพพอร์ตแบบโปร',
  'Search…': 'ค้นหา…', 'Toggle menu': 'สลับเมนู', 'Pagination': 'เลขหน้า', 'Sections': 'หมวด', 'Email': 'อีเมล',
  'save 20% on your first year': 'ลด 20% สำหรับปีแรก', 'Discover →': 'ดูเพิ่มเติม →', 'Signature': 'ซิกเนเจอร์', 'Sport': 'สปอร์ต', 'Classic': 'คลาสสิก', 'Search': 'ค้นหา',
  'Coupé': 'คูเป้', 'Spider': 'สไปเดอร์', 'Grand Tourer': 'แกรนด์ทัวเรอร์', 'Sport Sedan': 'สปอร์ตซีดาน', 'Track Edition': 'รุ่นแทร็ก', 'Heritage Series': 'ซีรีส์เฮอริเทจ', 'Accessories Kit': 'ชุดอุปกรณ์เสริม', 'Driver Gear': 'ชุดนักขับ',
  'Phone Pro': 'โฟน โปร', 'Buds': 'หูฟังบัด', 'Laptop Air': 'แล็ปท็อป แอร์', 'Charger': 'ที่ชาร์จ', 'Case': 'เคส',
  'Weekend Edit': 'คัดเด็ดวันหยุด', 'Home Studio': 'โฮมสตูดิโอ', 'Trail Notes': 'บันทึกเส้นทาง', 'Slow Kitchen': 'ครัวสโลว์', 'City Weekends': 'สุดสัปดาห์ในเมือง', 'Pocket Gifts': 'ของขวัญชิ้นเล็ก', 'Quiet Corners': 'มุมสงบ', 'Fresh Finds': 'ของใหม่น่าลอง',
  'Phone': 'โทรศัพท์', 'Watch': 'นาฬิกา', 'Audio': 'เสียง', 'Laptop': 'แล็ปท็อป', 'Tablet': 'แท็บเล็ต', 'Accessory': 'อุปกรณ์เสริม', 'Style': 'สไตล์', 'Home': 'บ้าน', 'Outdoors': 'กลางแจ้ง', 'Food': 'อาหาร', 'Travel': 'ท่องเที่ยว', 'Gifts': 'ของขวัญ', 'New': 'ใหม่', 'Collection': 'คอลเลกชัน', 'Daily': 'รายวัน'
};
const TH_ARTICLES = [
  ['การออกแบบที่มีจุดยืนชัดเจน', 'ทำไมความสม่ำเสมอจึงชนะความแปลกใหม่ เมื่อคุณสร้างสิ่งที่คนใช้ทุกวัน'],
  ['นิสัย 5 อย่างของทีมที่ส่งงานได้จริง', 'กิจวัตรเล็กๆ ที่ทำให้โปรเจกต์เดินหน้าโดยไม่ต้องเพิ่มการประชุม'],
  ['ไตรมาสนี้มีอะไรเปลี่ยนไป', 'พาชมการปรับปรุงที่เราทำ และสิ่งที่เรียนรู้ระหว่างทาง'],
  ['ส่องรุ่นใหม่ให้ละเอียดขึ้น', 'ความสามารถใหม่ ค่าเริ่มต้นที่เหมาะสม และรายละเอียดเล็กๆ ที่คุณอาจพลาดไป'],
  ['เบื้องหลัง: เราสร้างอย่างไร', 'จากภาพร่างแรกถึงของจริง การตัดสินใจที่หล่อหลอมผลิตภัณฑ์'],
  ['เรื่องของลูกค้า: จากไอเดียสู่การเปิดตัว', 'ทีมเล็กๆ ขึ้นระบบได้ในไม่กี่สัปดาห์ และสิ่งที่พวกเขาจะทำต่างออกไป'],
  ['ได้มากขึ้นจากพื้นฐาน', 'เทคนิคง่ายๆ ที่ทำให้งานประจำวันเร็วและสบายขึ้น'],
  ['เหตุผลที่ควรช้าลงสักนิด', 'ใช้เวลาตอนเริ่มต้นช่วยประหยัดได้หลายเดือน และนี่คือวิธีตัดสินใจ']
];
const TH_PATTERNS = [
  [/^See what’s new in (.+) →$/, (m) => `ดูว่ามีอะไรใหม่ใน ${m[1]} →`],
  [/^Ready to get started with (.+)\?$/, (m) => `พร้อมเริ่มต้นกับ ${m[1]} แล้วหรือยัง`],
  [/^Why people choose (.+)$/, (m) => `ทำไมคนถึงเลือก ${m[1]}`],
  [/^Sample footer for a page built from the (.+) design tokens\.$/, (m) => `ส่วนท้ายตัวอย่างของหน้าที่สร้างจาก design tokens ของ ${m[1]}`],
  [/^© 2026 (.+) \(sample\)\..*$/, (m) => `© 2026 ${m[1]} (ตัวอย่าง) ไม่เกี่ยวข้องหรือได้รับการรับรองจากแบรนด์ที่แสดง เป็นหน้าทั่วไปที่ใช้สี ตัวอักษร และมุมโค้งจาก DESIGN.md ไม่ใช่สำเนาของเว็บจริง`],
  [/^(.+) is a sample publication that uses this brand's colors and type\.$/, (m) => `${m[1]} เป็นสิ่งพิมพ์ตัวอย่างที่ใช้สีและตัวอักษรของแบรนด์นี้`],
  [/^Product · (\d+) min read$/, (m) => `ผลิตภัณฑ์ · อ่าน ${m[1]} นาที`],
  [/^(\d+)h ago · (\d+) min$/, (m) => `${m[1]} ชม.ที่แล้ว · ${m[2]} นาที`],
  [/^(\d+) min read$/, (m) => `อ่าน ${m[1]} นาที`], [/^(\d+) min$/, (m) => `${m[1]} นาที`], [/^6 min read$/, () => 'อ่าน 6 นาที'],
  [/^0(\d) — (.+)$/, (m) => `0${m[1]} — ${m[2]}`],
  [/^(\d)\. (.+)$/, (m) => `${m[1]}. ${m[2]}`],
  [/^From \$(.+)$/, (m) => `เริ่มต้น $${m[1]}`],
  [/^Scroll down: .*$/, () => ''],
  [/^ Scroll down: the header shrinks.*$/, () => ' ลองเลื่อนลง: แถบเมนูจะหดลงและแถบด้านบนจะแสดงว่าอ่านไปถึงไหนแล้ว']
];
const TH_BODY_EN = new Map(ARTICLES.map(([t, e], i) => [t, TH_ARTICLES[i][0]]).concat(ARTICLES.map(([t, e], i) => [e, TH_ARTICLES[i][1]])));
const TH_TAILS = [
  ['The best teams treat their routines like products: they test them, measure them and remove whatever does not help.', 'ทีมที่ดีที่สุดมองกิจวัตรเหมือนผลิตภัณฑ์ คือทดสอบ วัดผล และตัดสิ่งที่ไม่ช่วยออก'],
  ['This guide covers the essentials in the order most readers need them, so you can stop whenever you have what you came for.', 'คู่มือนี้เรียงสิ่งจำเป็นตามลำดับที่ผู้อ่านส่วนใหญ่ต้องการ คุณจึงหยุดอ่านเมื่อได้สิ่งที่ต้องการแล้วได้ทุกเมื่อ'],
  ['The details matter: small decisions, repeated every day, are what people end up remembering about a product.', 'รายละเอียดสำคัญ: การตัดสินใจเล็กๆ ที่ทำซ้ำทุกวัน คือสิ่งที่คนจดจำเกี่ยวกับผลิตภัณฑ์']
];
const unesc = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
function trText(raw) {
  const k = unesc(raw.trim());
  if (TH[k] !== undefined) return TH[k];
  if (TH_BODY_EN.has(k)) return TH_BODY_EN.get(k);
  for (const [re, fn] of TH_PATTERNS) { const m = k.match(re); if (m) return fn(m); }
  // article lede followed by an extra English sentence: translate the known first part
  for (const [en, th] of TH_BODY_EN) if (k.startsWith(en + ' ')) return th + ' ' + trText(k.slice(en.length + 1));
  let out = k; for (const [en, th] of TH_TAILS) out = out.replace(en, th);
  return out;
}
function toThai(html) {
  return html
    .replace(/>([^<>]+)</g, (m, t) => { if (!t.trim()) return m; const k = t.trim(), tr = trText(k); return tr === unesc(k) ? m : '>' + t.replace(k, esc(tr)) + '<'; })
    .replace(/(placeholder|aria-label)="([^"]*)"/g, (m, a, v) => { const tr = trText(v); return tr === unesc(v) ? m : `${a}="${esc(tr)}"`; });
}

const RENDER = { hero: heroLayout, single: singleLayout, two: twoLayout, three: threeLayout, 'sidebar-left': sidebarLeftLayout, 'sidebar-right': sidebarRightLayout, split: splitLayout, 'f-pattern': fPatternLayout, 'z-pattern': zPatternLayout, 'card-grid': cardGridLayout, 'full-hero': fullHeroLayout, 'sticky-header': stickyHeaderLayout, 'sticky-footer': stickyFooterLayout, masonry: masonryLayout };
export function renderLayout(key, M) {
  const fn = RENDER[key] || heroLayout;
  return M.lang === 'th' && M.th ? toThai(fn({ ...M, ...M.th })) : fn(M);
}

/** Small behaviours (all optional): collapse sidebar, font size, filters, sticky shrink + progress, countdown. */
export function activate(root) {
  const cleanups = [];
  const $ = (s) => [...root.querySelectorAll(s)];
  $('[data-collapse]').forEach((b) => b.addEventListener('click', () => root.querySelector('[data-collapse-root]').classList.toggle('collapsed')));
  const art = root.querySelector('[data-article]');
  if (art) { let size = 100; $('[data-fs]').forEach((b) => b.addEventListener('click', () => { const d = Number(b.dataset.fs); size = d === 0 ? 100 : Math.max(85, Math.min(140, size + d * 12)); art.style.fontSize = size + '%'; })); }
  const grid = root.querySelector('[data-grid]');
  if (grid) {
    let cat = '', q = '';
    const apply = () => grid.querySelectorAll('[data-cat]').forEach((el) => { el.hidden = !!((cat && el.dataset.cat !== cat) || (q && !(el.dataset.name || '').includes(q))); });
    $('[data-filter]').forEach((c) => c.addEventListener('click', () => { cat = c.dataset.filter; $('[data-filter]').forEach((x) => x.classList.toggle('on', x === c)); apply(); }));
    const s = root.querySelector('[data-search]'); if (s) s.addEventListener('input', () => { q = s.value.trim().toLowerCase(); apply(); });
  }
  const nav = root.querySelector('[data-shrink]');
  if (nav) {
    const bar = root.querySelector('[data-progress]');
    const on = () => { nav.classList.toggle('shrunk', window.scrollY > 40); if (bar) { const h = document.documentElement.scrollHeight - window.innerHeight; bar.style.width = (h > 0 ? Math.min(100, (window.scrollY / h) * 100) : 0) + '%'; } };
    window.addEventListener('scroll', on, { passive: true }); on(); cleanups.push(() => window.removeEventListener('scroll', on));
  }
  const cd = root.querySelector('[data-countdown]');
  if (cd) {
    const end = Date.now() + (2 * 3600 + 13 * 60 + 45) * 1000, p = (n) => String(n).padStart(2, '0');
    const tick = () => { const t = Math.max(0, Math.floor((end - Date.now()) / 1000)); cd.querySelector('[data-h]').textContent = p(Math.floor(t / 3600)); cd.querySelector('[data-m]').textContent = p(Math.floor((t % 3600) / 60)); cd.querySelector('[data-s]').textContent = p(t % 60); };
    tick(); const iv = setInterval(tick, 1000); cleanups.push(() => clearInterval(iv));
  }
  return () => cleanups.forEach((f) => f());
}

/** Tiny wireframes for the /patterns/ gallery. */
export const WIRE = {
  single: '<div class="w-col"><i class="w h"></i><i class="w"></i><i class="w"></i><i class="w"></i></div>',
  two: '<div class="w-row"><div class="w-c" style="flex:2"><i class="w"></i><i class="w"></i><i class="w"></i></div><div class="w-c"><i class="w"></i><i class="w"></i></div></div>',
  three: '<div class="w-row"><div class="w-c"><i class="w"></i><i class="w"></i></div><div class="w-c" style="flex:2"><i class="w"></i><i class="w"></i><i class="w"></i></div><div class="w-c"><i class="w"></i><i class="w"></i></div></div>',
  'sidebar-left': '<div class="w-row"><div class="w-c side"><i class="w"></i><i class="w"></i><i class="w"></i></div><div class="w-c" style="flex:3"><i class="w"></i><i class="w"></i></div></div>',
  'sidebar-right': '<div class="w-row"><div class="w-c" style="flex:3"><i class="w"></i><i class="w"></i><i class="w"></i></div><div class="w-c side"><i class="w"></i><i class="w"></i></div></div>',
  split: '<div class="w-row"><div class="w-c solid"></div><div class="w-c"><i class="w"></i><i class="w"></i></div></div>',
  hero: '<div class="w-col"><i class="w nav"></i><i class="w h solid"></i><i class="w"></i><i class="w btnw"></i></div>',
  'f-pattern': '<div class="w-col"><i class="w"></i><i class="w" style="width:80%"></i><i class="w" style="width:50%"></i><i class="w" style="width:30%"></i></div>',
  'z-pattern': '<div class="w-col"><div class="w-row"><i class="w"></i><i class="w solid"></i></div><div class="w-row"><i class="w solid"></i><i class="w"></i></div></div>',
  'card-grid': '<div class="w-grid"><i class="w"></i><i class="w"></i><i class="w"></i><i class="w"></i><i class="w"></i><i class="w"></i></div>',
  'full-hero': '<div class="w-col"><i class="w h solid full"></i></div>',
  'sticky-header': '<div class="w-col"><i class="w nav solid"></i><i class="w"></i><i class="w"></i><i class="w"></i></div>',
  'sticky-footer': '<div class="w-col"><i class="w"></i><i class="w"></i><i class="w"></i><i class="w nav solid"></i></div>',
  masonry: '<div class="w-mas"><div><i class="w"></i><i class="w s"></i></div><div><i class="w s"></i><i class="w"></i></div><div><i class="w"></i><i class="w s"></i></div></div>'
};
