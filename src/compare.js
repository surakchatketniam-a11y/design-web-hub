/* Compare page: put 2-3 styles side by side (same layout, same language) so a non-designer can choose. No server, no storage. */
(function () {
  'use strict';
  var root = document.getElementById('cmp');
  if (!root) return;
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var toastEl;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(function () { toastEl.classList.remove('show'); }, 1800);
  }

  fetch('../data/compare.json?v=' + (root.getAttribute('data-v') || '')).then(function (r) { return r.json(); }).then(init, function () { $('cmpCols').innerHTML = '<p class="muted">โหลดข้อมูลไม่สำเร็จ ลองรีเฟรชหน้า</p>'; });

  function init(data) {
    var by = data.brands, slugs = Object.keys(by).sort(function (a, b) { return by[a].name.localeCompare(by[b].name); });
    var layoutKeys = data.layouts.map(function (l) { return l.key; });
    var p = new URLSearchParams(location.search);
    var st = {
      b: (p.get('b') || '').split(',').filter(function (s, i, a) { return by[s] && a.indexOf(s) === i; }).slice(0, 3),
      l: layoutKeys.indexOf(p.get('layout')) >= 0 ? p.get('layout') : 'hero',
      lg: p.get('lg') === 'en' ? 'en' : 'th'
    };
    ['claude', 'linear.app', 'airbnb'].forEach(function (s) { if (st.b.length < 2 && st.b.indexOf(s) < 0) st.b.push(s); });

    var opts = slugs.map(function (s) { return '<option value="' + esc(s) + '">' + esc(by[s].name) + '</option>'; }).join('');
    [0, 1, 2].forEach(function (i) { $('cmpS' + i).innerHTML = (i === 2 ? '<option value="">— ไม่เลือก —</option>' : '') + opts; });
    $('cmpLayout').innerHTML = data.layouts.map(function (l) { return '<option value="' + l.key + '">' + l.n + '. ' + esc(l.thai) + '</option>'; }).join('');

    function sync() {
      [0, 1, 2].forEach(function (i) { $('cmpS' + i).value = st.b[i] || ''; });
      $('cmpLayout').value = st.l;
      Array.prototype.forEach.call(document.querySelectorAll('[data-lg]'), function (c) { var on = c.getAttribute('data-lg') === st.lg; c.classList.toggle('on', on); c.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    }
    function column(s) {
      var b = by[s], q = '?layout=' + st.l + '&lang=' + st.lg;
      return '<article class="cmp-col"><header><h2>' + esc(b.name) + '</h2><div class="tagrow">' + b.tags.map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('') + '</div><p class="muted cmp-th">' + esc(b.th) + '</p>' +
        '<div class="cmp-sw" aria-label="สีหลักของสไตล์">' + b.colors.map(function (c) { return '<i title="' + esc(c) + '" style="background:' + esc(c) + '"></i>'; }).join('') + '</div>' +
        '<p class="cmp-font"><b>ฟอนต์:</b> ' + esc(b.font) + ' · ไทย: ' + esc(b.thai) + '</p>' +
        '<div class="actions"><a class="btn sm" href="../b/' + encodeURIComponent(s) + '/">ดูรายละเอียด</a><a class="btn sm" href="../d/' + encodeURIComponent(s) + '/DESIGN.md" download="DESIGN.md">⬇ DESIGN.md</a><a class="btn sm" href="../mix/?c=' + encodeURIComponent(s) + '&t=' + encodeURIComponent(s) + '&s=' + encodeURIComponent(s) + '&f=' + encodeURIComponent(s) + '">ใช้เป็นฐานผสม</a></div></header>' +
        '<iframe class="device cmp-frame" loading="lazy" src="../p/' + encodeURIComponent(s) + '/' + q + '" title="ตัวอย่างหน้าเว็บที่ใช้ tokens ของ ' + esc(b.name) + '"></iframe></article>';
    }
    function render() {
      sync();
      $('cmpCols').className = 'cmp-cols n' + st.b.length;
      $('cmpCols').innerHTML = st.b.map(column).join('');
      var u = new URLSearchParams(); u.set('b', st.b.join(',')); if (st.l !== 'hero') u.set('layout', st.l); if (st.lg !== 'th') u.set('lg', st.lg);
      history.replaceState(null, '', location.pathname + '?' + u.toString());
    }
    [0, 1, 2].forEach(function (i) {
      $('cmpS' + i).addEventListener('change', function (e) {
        var v = e.target.value, next = st.b.slice();
        if (v && next.indexOf(v) >= 0 && next[i] !== v) { toast('สไตล์นี้ถูกเลือกไว้แล้ว'); sync(); return; }
        if (v) next[i] = v; else next.splice(i, 1);
        next = next.filter(Boolean);
        if (next.length < 2) { toast('ต้องเลือกอย่างน้อย 2 สไตล์'); sync(); return; }
        st.b = next; render();
      });
    });
    $('cmpLayout').addEventListener('change', function (e) { st.l = e.target.value; render(); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-lg]'), function (c) { c.addEventListener('click', function () { st.lg = c.getAttribute('data-lg'); render(); }); });
    $('cmpShare').addEventListener('click', function () {
      var done = function () { toast('คัดลอกลิงก์การเปรียบเทียบแล้ว'); };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(location.href).then(done, function () { toast('คัดลอกไม่สำเร็จ'); }); else toast('คัดลอกไม่สำเร็จ');
    });
    render();
  }
})();
