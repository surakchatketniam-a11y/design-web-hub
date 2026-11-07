// A sample web-app page (/a/<brand>/) built ONLY from the brand's downloadable tokens.css and its .ds-app-* classes,
// so what the visitor sees is exactly what the download gives them (not a re-skinned landing page).
import { fontRoles, downloadView } from './downloads.mjs';
import { fontsUrlFor } from './landing.mjs';
import { deriveRoles } from './roles.mjs';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function appSamplePage(b0, siteTitle = 'DESIGN.md Hub') {
  const b = downloadView(b0), f = b.fonts, roles = deriveRoles(b);
  const fontsHref = fontsUrlFor(fontRoles(b).map((r) => r.stack), [f.thaiDisplay, f.thaiBody]);
  const nChart = roles.filter((r) => r.key.startsWith('chart-')).length;
  const bars = [[62, 40, 24, 32], [48, 58, 30, 22], [86, 52, 36, 44], [70, 44, 28, 38]];
  const legend = ['เว็บไซต์', 'แอป', 'หน้าร้าน', 'พาร์ตเนอร์'];
  const chartBar = (h, i) => `<span style="height:${h}%;background:var(--app-chart-${Math.min(i + 1, nChart)})"></span>`;
  const check = (on) => `<span class="ds-app-check${on ? ' is-checked' : ''}" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" pathLength="1"/></svg></span>`;
  const habit = (t, d, on) => `<div class="ds-app-select-card${on ? ' is-selected' : ''}" role="checkbox" tabindex="0" aria-checked="${on ? 'true' : 'false'}"><div class="x-grow"><b>${t}</b><div class="ds-app-hint">${d}</div></div>${check(on)}</div>`;
  return `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ตัวอย่างเว็บแอป — ${esc(b.name)} — ${esc(siteTitle)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${esc(fontsHref)}" rel="stylesheet">
<link rel="stylesheet" href="../../d/${esc(b.slug)}/tokens.css">
<style>
  /* layout only: every color, radius and font comes from tokens.css */
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; }
  .x-note { padding: 8px 16px; font-size: 0.875rem; background: var(--app-info-soft); color: var(--app-info); border-bottom: 1px solid var(--app-info-border); display: flex; gap: 12px; flex-wrap: wrap; justify-content: space-between; }
  .x-note a { color: inherit; font-weight: 600; }
  .x-shell { display: flex; min-height: calc(100vh - 41px); }
  .x-side { width: 232px; flex-shrink: 0; padding: 16px; background: var(--app-surface-muted); border-right: 1px solid var(--app-border); }
  .x-brand { display: flex; align-items: center; gap: 8px; padding: 8px; margin-bottom: 12px; font-family: var(--font-display, inherit); font-weight: 600; }
  .x-logo { width: 32px; height: 32px; border-radius: 9999px; background: var(--app-accent-strong); color: var(--app-on-accent); display: grid; place-items: center; font-size: 0.875rem; }
  .x-main { flex: 1; min-width: 0; }
  .x-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 12px 24px; background: var(--app-surface); border-bottom: 1px solid var(--app-border); }
  .x-top h1 { margin: 0; font-family: var(--font-display, inherit); font-size: 1.25rem; font-weight: 600; }
  .x-body { padding: 24px; display: grid; gap: 24px; }
  .x-kpis { display: grid; gap: 16px; grid-template-columns: repeat(4, 1fr); }
  .x-two { display: grid; gap: 24px; grid-template-columns: 2fr 1fr; }
  .x-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  .x-h2 { margin: 0; font-family: var(--font-display, inherit); font-size: 1rem; font-weight: 600; }
  .x-chart { display: flex; align-items: flex-end; gap: 28px; height: 160px; margin-top: 16px; padding: 0 8px; border-bottom: 1px solid var(--app-border-subtle); }
  .x-chart > div { flex: 1; display: flex; align-items: flex-end; justify-content: center; gap: 4px; height: 100%; }
  .x-chart span { width: 14px; border-radius: 3px 3px 0 0; }
  .x-legend { display: flex; gap: 16px; font-size: 0.875rem; color: var(--app-text-muted); }
  .x-legend i { display: inline-block; width: 10px; height: 10px; border-radius: 9999px; margin-right: 6px; }
  .x-grow { flex: 1; }
  .x-stack { display: grid; gap: 12px; }
  .x-tablewrap { overflow-x: auto; }
  /* narrow screens: the sidebar becomes a scrollable strip of tabs under the top bar */
  @media (max-width: 900px) {
    .x-shell { flex-direction: column; }
    .x-side { width: auto; padding: 8px 16px; border-right: 0; border-bottom: 1px solid var(--app-border); order: 1; }
    .x-brand, .x-side .ds-app-callout { display: none; }
    .x-side .ds-app-nav { display: flex; gap: 4px; overflow-x: auto; }
    .x-side .ds-app-nav-item { white-space: nowrap; }
    .x-main { order: 2; }
    .x-kpis { grid-template-columns: repeat(2, 1fr); } .x-two { grid-template-columns: 1fr !important; } .x-body { padding: 16px; } .x-top { padding: 12px 16px; }
  }
</style>
</head>
<body class="ds-app-page">
<div class="x-note"><span>ตัวอย่างเว็บแอปที่สร้างจากไฟล์ <code>tokens.css</code> ของ ${esc(b.name)} ที่ดาวน์โหลดได้จริง (คลาส <code>.ds-app-*</code>)</span><a href="../../b/${esc(b.slug)}/">← กลับไปหน้า ${esc(b.name)}</a></div>
<div class="x-shell">
  <aside class="x-side">
    <div class="x-brand"><span class="x-logo">O</span>Orders Pro</div>
    <nav class="ds-app-nav" id="nav">
      <a class="ds-app-nav-item is-active" href="#">ภาพรวม</a><a class="ds-app-nav-item" href="#">คำสั่งซื้อ</a><a class="ds-app-nav-item" href="#">ลูกค้า</a><a class="ds-app-nav-item" href="#">สินค้าคงคลัง</a><a class="ds-app-nav-item" href="#">ตั้งค่า</a>
    </nav>
    <div class="ds-app-callout ds-app-callout-info" style="margin-top:24px">มีอัปเดตใหม่ v2.4 พร้อมใช้งาน</div>
  </aside>
  <div class="x-main">
    <header class="x-top">
      <h1>ภาพรวมคำสั่งซื้อ</h1>
      <div class="x-row"><input class="ds-app-input" style="width:220px" placeholder="ค้นหาคำสั่งซื้อ…" aria-label="ค้นหา"><button class="ds-app-btn ds-app-btn-primary" type="button">+ สร้างคำสั่งซื้อ</button></div>
    </header>
    <main class="x-body">
      <div class="x-two" style="grid-template-columns:1fr 1fr">
        <div class="ds-app-callout ds-app-callout-warning">สินค้า 3 รายการใกล้หมดสต็อก</div>
        <div class="ds-app-callout ds-app-callout-danger">การชำระเงิน 2 รายการล้มเหลว ต้องตรวจสอบ</div>
      </div>
      <section class="x-kpis">
        <div class="ds-app-card"><div class="ds-app-stat-label">ยอดขายวันนี้</div><div class="ds-app-stat-value">฿48,320</div><div class="ds-app-stat-delta is-up">▲ 12.4% จากเมื่อวาน</div></div>
        <div class="ds-app-card"><div class="ds-app-stat-label">คำสั่งซื้อใหม่</div><div class="ds-app-stat-value">126</div><div class="ds-app-stat-delta is-up">▲ 8 รายการ</div></div>
        <div class="ds-app-card"><div class="ds-app-stat-label">รอจัดส่ง</div><div class="ds-app-stat-value">37</div><div class="ds-app-stat-delta">5 รายการเกินกำหนด</div></div>
        <div class="ds-app-card"><div class="ds-app-stat-label">อัตราคืนสินค้า</div><div class="ds-app-stat-value">2.1%</div><div class="ds-app-stat-delta is-down">▼ สูงกว่าเป้า 0.4%</div></div>
      </section>
      <div class="x-two">
        <section class="ds-app-card">
          <div class="x-row"><h2 class="x-h2">ยอดขายรายสัปดาห์ แยกช่องทาง</h2><div class="x-legend">${legend.map((l, i) => `<span><i style="background:var(--app-chart-${Math.min(i + 1, nChart)})"></i>${l}</span>`).join('')}</div></div>
          <div class="x-chart" role="img" aria-label="กราฟแท่งยอดขาย">${bars.map((g) => `<div>${g.map(chartBar).join('')}</div>`).join('')}</div>
        </section>
        <section class="ds-app-card">
          <h2 class="x-h2">ตัวกรอง</h2>
          <div class="x-stack" style="margin-top:12px">
            <div class="ds-app-segmented" id="seg"><button class="ds-app-segmented-item is-active" type="button">ทั้งหมด</button><button class="ds-app-segmented-item" type="button">รอชำระ</button><button class="ds-app-segmented-item" type="button">จัดส่งแล้ว</button></div>
            <div><label class="ds-app-label" for="f1">ช่วงวันที่</label><input id="f1" class="ds-app-input" placeholder="01/11/2569 – 07/11/2569"></div>
            <div><label class="ds-app-label" for="f2">หมายเลขคำสั่งซื้อ</label><input id="f2" class="ds-app-input" value="ORD-00" aria-invalid="true"><div class="ds-app-error">รูปแบบไม่ถูกต้อง</div></div>
            <div class="x-row"><button class="ds-app-btn ds-app-btn-primary" type="button">ใช้ตัวกรอง</button><button class="ds-app-btn ds-app-btn-secondary" type="button">ล้างค่า</button><button class="ds-app-btn ds-app-btn-ghost" type="button" disabled>บันทึก</button></div>
          </div>
        </section>
      </div>
      <section class="ds-app-card" style="padding:0;overflow:hidden">
        <div class="x-row" style="padding:12px 16px;border-bottom:1px solid var(--app-border)"><h2 class="x-h2">คำสั่งซื้อล่าสุด</h2><a class="ds-app-link" href="#">ดูทั้งหมด</a></div>
        <div class="x-tablewrap"><table class="ds-app-table"><thead><tr><th>เลขที่</th><th>ลูกค้า</th><th>ยอดรวม</th><th>สถานะ</th></tr></thead><tbody>
          <tr><td>ORD-1042</td><td>สมชาย ใจดี</td><td>฿1,290</td><td><span class="ds-app-badge ds-app-badge-success">ชำระแล้ว</span></td></tr>
          <tr class="is-selected"><td>ORD-1043</td><td>วิภา สุขสันต์</td><td>฿4,850</td><td><span class="ds-app-badge ds-app-badge-warning">รอชำระ</span></td></tr>
          <tr><td>ORD-1044</td><td>ธนากร มั่นคง</td><td>฿920</td><td><span class="ds-app-badge ds-app-badge-danger">ล้มเหลว</span></td></tr>
          <tr><td>ORD-1045</td><td>ปราณี รักษา</td><td>฿2,310</td><td><span class="ds-app-badge ds-app-badge-info">กำลังจัดส่ง</span></td></tr>
        </tbody></table></div>
      </section>
      <div class="x-two" style="grid-template-columns:1fr 1fr">
        <section class="ds-app-card x-stack">
          <h2 class="x-h2">เลือกงานที่ทำวันนี้ <span class="ds-app-badge ds-app-badge-accent">แตะเพื่อเลือก</span></h2>
          ${habit('แพ็กสินค้า', 'อย่างน้อย 20 ออเดอร์', true)}${habit('ตอบแชตลูกค้า', 'ภายใน 10 นาที', false)}${habit('ตรวจสต็อก', 'สินค้าใกล้หมด 3 รายการ', false)}
          <div class="ds-app-progress" aria-label="ความคืบหน้า 33%"><span style="width:33%"></span></div>
        </section>
        <section class="ds-app-empty"><div class="ds-app-empty-title">ยังไม่มีคำสั่งซื้อที่ถูกคืนเงิน</div><div class="ds-app-empty-hint">เมื่อมีการคืนเงิน รายการจะแสดงที่นี่</div><button class="ds-app-btn ds-app-btn-secondary" style="margin-top:16px" type="button">เรียนรู้เพิ่มเติม</button></section>
      </div>
    </main>
  </div>
</div>
<script>
  // tiny demo behaviour: the classes only need is-active / is-selected / is-checked toggled by your own code
  document.querySelectorAll('#nav .ds-app-nav-item').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); document.querySelectorAll('#nav .is-active').forEach(function (x) { x.classList.remove('is-active'); }); a.classList.add('is-active'); }); });
  document.querySelectorAll('#seg .ds-app-segmented-item').forEach(function (s) { s.addEventListener('click', function () { document.querySelectorAll('#seg .is-active').forEach(function (x) { x.classList.remove('is-active'); }); s.classList.add('is-active'); }); });
  document.querySelectorAll('.ds-app-select-card').forEach(function (c) {
    var toggle = function () { var on = !c.classList.contains('is-selected'); c.classList.toggle('is-selected', on); c.setAttribute('aria-checked', on); var k = c.querySelector('.ds-app-check'); k.classList.remove('is-checked'); if (on) { void k.offsetWidth; k.classList.add('is-checked'); } };
    c.addEventListener('click', toggle); c.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); } });
  });
</script>
</body></html>
`;
}
