(function () {
  var toastEl;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(function () { toastEl.classList.remove('show'); }, 1800);
  }
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (res, rej) {
      var ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy') ? res() : rej(); } catch (e) { rej(e); } ta.remove();
    });
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-copy]');
    if (el) { copy(el.getAttribute('data-copy')).then(function () { toast('คัดลอกแล้ว: ' + el.getAttribute('data-copy').slice(0, 40)); }, function () { toast('คัดลอกไม่สำเร็จ'); }); return; }
    var f = e.target.closest('[data-fetchcopy]');
    if (f) {
      fetch(f.getAttribute('data-fetchcopy')).then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
        .then(copy).then(function () { toast('คัดลอกเนื้อหา DESIGN.md แล้ว'); }, function () { toast('คัดลอกไม่สำเร็จ'); });
    }
  });


  // brand page: device-size toggle for the landing preview iframe
  var pv = document.getElementById('pv');
  if (pv) {
    var btns = document.querySelectorAll('.device-bar .chip');
    Array.prototype.forEach.call(btns, function (b) {
      b.addEventListener('click', function () {
        pv.style.width = b.getAttribute('data-w');
        Array.prototype.forEach.call(btns, function (x) { x.classList.toggle('on', x === b); });
      });
    });
  }


  // brand page: switch the preview layout (14 structures) and sample language (Thai/English) without reloading the brand page
  var lbtns = document.querySelectorAll('.layout-bar [data-layout]');
  var gbtns = document.querySelectorAll('.lang-bar [data-lang]');
  if (pv && lbtns.length) {
    var base = pv.getAttribute('src').split('?')[0], open = document.getElementById('pvOpen'), ld = document.getElementById('layoutDesc');
    var cur = { layout: 'hero', lang: 'th' };
    var go = function () {
      var q = []; if (cur.layout !== 'hero') q.push('layout=' + cur.layout); if (cur.lang !== 'th') q.push('lang=' + cur.lang);
      var url = base + (q.length ? '?' + q.join('&') : '');
      pv.setAttribute('src', url); if (open) open.setAttribute('href', url);
    };
    Array.prototype.forEach.call(lbtns, function (b) {
      b.addEventListener('click', function () {
        cur.layout = b.getAttribute('data-layout'); go();
        if (ld) ld.firstChild.textContent = b.getAttribute('data-desc') + ' ';
        Array.prototype.forEach.call(lbtns, function (x) { var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
      });
    });
    Array.prototype.forEach.call(gbtns, function (b) {
      b.addEventListener('click', function () {
        cur.lang = b.getAttribute('data-lang'); go();
        Array.prototype.forEach.call(gbtns, function (x) { var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
      });
    });
  }
  // patterns gallery: choose which brand the 14 preview links use
  var pb = document.getElementById('patBrand');
  if (pb) {
    var links = document.querySelectorAll('[data-pat]');
    var upd = function () { Array.prototype.forEach.call(links, function (a) { var k = a.getAttribute('data-pat'); a.setAttribute('href', '../p/' + pb.value + '/' + (k === 'hero' ? '' : '?layout=' + k)); }); };
    pb.addEventListener('change', upd); upd();
  }

  // brand page: tabs (without JS every panel stays visible)
  var tabs = document.getElementById('tabs');
  if (tabs) {
    var tbtns = Array.prototype.slice.call(tabs.querySelectorAll('[role=tab]'));
    var panels = Array.prototype.slice.call(tabs.querySelectorAll('[role=tabpanel]'));
    tabs.classList.add('on');
    var select = function (i, focus) {
      tbtns.forEach(function (b, j) { b.setAttribute('aria-selected', j === i); b.tabIndex = j === i ? 0 : -1; panels[j].hidden = j !== i; });
      if (focus) tbtns[i].focus();
    };
    tbtns.forEach(function (b, i) {
      b.addEventListener('click', function () { select(i); history.replaceState(null, '', '#' + b.id.replace('tab-', '')); });
      b.addEventListener('keydown', function (e) {
        var n = e.key === 'ArrowRight' ? (i + 1) % tbtns.length : e.key === 'ArrowLeft' ? (i - 1 + tbtns.length) % tbtns.length : e.key === 'Home' ? 0 : e.key === 'End' ? tbtns.length - 1 : -1;
        if (n >= 0) { e.preventDefault(); select(n, true); }
      });
    });
    var start = tbtns.findIndex(function (b) { return '#' + b.id.replace('tab-', '') === location.hash; });
    select(start >= 0 ? start : 0);
  }

  // home: 3-question style finder. Scores the cards' own data-* labels, shows the top 3 and a ready-made mix recipe link.
  var wiz = document.getElementById('wizard');
  if (wiz) {
    var wgrid = document.getElementById('grid'), wcards = Array.prototype.slice.call(wgrid.querySelectorAll('.card')), wout = document.getElementById('wizOut');
    var ans = {}, wchips = wiz.querySelectorAll('.chip[data-wq]');
    var labelOf = function (key, v) { var c = wiz.querySelector('.chip[data-wq="' + key + '"][data-v="' + v + '"]'); return c ? c.textContent.trim() : v; };
    var has = function (card, key, v) { return (card.getAttribute('data-' + key) || '').split(' ').indexOf(v) !== -1; };
    var slugOf = function (card) { return card.getAttribute('href').replace(/^b\//, '').replace(/\/$/, ''); };
    var score = function (card) {
      var s = 0, why = [];
      if (has(card, 'uses', ans.uses)) { s += 4; why.push('เหมาะกับ ' + labelOf('uses', ans.uses)); }
      if (ans.vibes && has(card, 'vibes', ans.vibes)) { s += 3; why.push('ความรู้สึก' + labelOf('vibes', ans.vibes)); }
      if (ans.tone) { var t = card.getAttribute('data-tone'); if (t === ans.tone) { s += 2; why.push(ans.tone === 'dark' ? 'โทนมืด' : 'โทนสว่าง'); } else if (t === 'mixed') s += 1; else if (t === 'mid') s += 0.5; else s -= 2; }
      return { card: card, s: s, why: why };
    };
    var render = function () {
      if (!ans.uses) { wout.hidden = true; wout.innerHTML = ''; return; }
      var ranked = wcards.map(score).filter(function (x) { return has(x.card, 'uses', ans.uses) || x.s > 2; }).sort(function (a, b) { return b.s - a.s; });
      var top = ranked.slice(0, 3);
      if (!top.length) { wout.hidden = false; wout.innerHTML = '<p class="muted">ยังไม่มีสไตล์ที่ตรงกับคำตอบนี้ ลองเปลี่ยนความรู้สึกหรือโทน</p>'; return; }
      var base = wiz.querySelector('.chip[data-wq="uses"][data-v="' + ans.uses + '"]');
      var s1 = slugOf(top[0].card), s2 = slugOf((top[1] || top[0]).card), s3 = slugOf((top[2] || top[0]).card);
      var mixUrl = 'mix/?c=' + encodeURIComponent(s1) + '&t=' + encodeURIComponent(s2) + '&s=' + encodeURIComponent(s3) + '&f=' + encodeURIComponent(s1) + '&cat=' + base.getAttribute('data-cat') + '&l=' + base.getAttribute('data-l');
      var nm = function (c) { return c.querySelector('.card-name').textContent; };
      wout.hidden = false;
      wout.innerHTML = '<h3>สไตล์ที่แนะนำสำหรับ “' + labelOf('uses', ans.uses) + '”</h3><div class="grid wiz-grid"></div>' +
        '<div class="wiz-mix"><div><b>สูตรผสมสำเร็จรูป</b><p class="muted">สี + ความรู้สึกจาก ' + nm(top[0].card) + ' · ตัวอักษรจาก ' + nm((top[1] || top[0]).card) + ' · รูปทรงจาก ' + nm((top[2] || top[0]).card) + ' <br>เปิดแล้วปรับต่อได้ในหน้าผสมสไตล์ และดาวน์โหลด DESIGN.md ที่มีฟอนต์ไทยได้เลย</p></div><a class="btn primary" href="' + mixUrl + '">✨ เปิดสูตรนี้ในหน้าผสมสไตล์</a></div>' +
        '<p class="muted wiz-note">คำแนะนำคำนวณจากป้ายความรู้สึก/การใช้งาน/โทนที่ผู้จัดทำให้ไว้แต่ละสไตล์ ไม่ใช่การรับประกันว่าเหมาะกับธุรกิจของคุณ ลองเปิดดู 2–3 แบบเทียบกัน</p>';
      var g = wout.querySelector('.wiz-grid');
      top.forEach(function (x) {
        var wrap = document.createElement('div'); wrap.className = 'wiz-item';
        var c = x.card.cloneNode(true); c.hidden = false; c.removeAttribute('data-q');
        wrap.appendChild(c);
        var w = document.createElement('p'); w.className = 'wiz-why'; w.textContent = x.why.length ? 'ตรงเพราะ: ' + x.why.join(' · ') : 'ใกล้เคียงกับคำตอบของคุณ';
        wrap.appendChild(w); g.appendChild(wrap);
      });
    };
    Array.prototype.forEach.call(wchips, function (ch) {
      ch.addEventListener('click', function () {
        var key = ch.getAttribute('data-wq'), v = ch.getAttribute('data-v'), on = ans[key] !== v;
        ans[key] = on ? v : undefined;
        Array.prototype.forEach.call(wiz.querySelectorAll('.chip[data-wq="' + key + '"]'), function (x) { var p = on && x === ch; x.classList.toggle('on', p); x.setAttribute('aria-pressed', p ? 'true' : 'false'); });
        render();
      });
    });
  }

  // home: pick 2-3 cards to compare side by side (kept in memory only)
  var cmpBtns = document.querySelectorAll('.cmp-btn');
  if (cmpBtns.length) {
    var picked = [], tray = null;
    var clean = function (t) { return String(t).replace(/[&<>"]/g, ''); };
    var renderTray = function () {
      if (!picked.length) { if (tray) { tray.remove(); tray = null; } return; }
      if (!tray) { tray = document.createElement('div'); tray.className = 'cmp-tray'; tray.setAttribute('role', 'region'); tray.setAttribute('aria-label', 'เปรียบเทียบสไตล์'); document.body.appendChild(tray); }
      tray.innerHTML = '<b>เปรียบเทียบ</b>' + picked.map(function (p) { return '<span class="cmp-chip">' + clean(p.name) + '<button type="button" data-rm="' + clean(p.slug) + '" aria-label="เอา ' + clean(p.name) + ' ออก">✕</button></span>'; }).join('') +
        '<a class="btn primary sm" ' + (picked.length < 2 ? 'aria-disabled="true"' : 'href="compare/?b=' + picked.map(function (p) { return encodeURIComponent(p.slug); }).join(',') + '"') + '>' + (picked.length < 2 ? 'เลือกอีก 1 สไตล์' : 'เทียบ ' + picked.length + ' สไตล์ →') + '</a><button type="button" class="btn sm" data-rmall>ล้าง</button>';
    };
    var setPressed = function () { Array.prototype.forEach.call(cmpBtns, function (b) { var on = picked.some(function (p) { return p.slug === b.getAttribute('data-cmp'); }); b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.textContent = on ? '✓ เลือกแล้ว' : '+ เทียบ'; }); renderTray(); };
    Array.prototype.forEach.call(cmpBtns, function (b) {
      b.addEventListener('click', function () {
        var slug = b.getAttribute('data-cmp'), i = picked.findIndex(function (p) { return p.slug === slug; });
        if (i >= 0) picked.splice(i, 1);
        else if (picked.length >= 3) { toast('เลือกเปรียบเทียบได้สูงสุด 3 สไตล์'); return; }
        else picked.push({ slug: slug, name: b.getAttribute('data-name') });
        setPressed();
      });
    });
    document.addEventListener('click', function (e) {
      var r = e.target.closest('[data-rm]'), all = e.target.closest('[data-rmall]');
      if (r) { picked = picked.filter(function (p) { return p.slug !== r.getAttribute('data-rm'); }); setPressed(); }
      if (all) { picked = []; setPressed(); }
    });
  }

  // brand page, "AI prompt" tab: pick the tool and type your own content, every prompt card updates live
  var pctl = document.getElementById('pctl');
  if (pctl) {
    var AP = null, pcards = Array.prototype.slice.call(document.querySelectorAll('.pcard'));
    var pv = function (id) { return document.getElementById(id).value; };
    var refresh = function () {
      if (!AP) return;
      pcards.forEach(function (c) {
        var txt = AP.buildPrompt({ title: c.getAttribute('data-title'), extra: c.getAttribute('data-extra') }, { avoid: c.getAttribute('data-avoid'), tool: pv('pTool'), content: { name: pv('pName'), offer: pv('pOffer'), audience: pv('pAud') } });
        c.querySelector('pre').textContent = txt; c.querySelector('[data-copy]').setAttribute('data-copy', txt);
      });
    };
    ['pTool'].forEach(function (id) { document.getElementById(id).addEventListener('change', refresh); });
    ['pName', 'pOffer', 'pAud'].forEach(function (id) { document.getElementById(id).addEventListener('input', refresh); });
    try { import('./prompt.js?v=' + (pctl.getAttribute('data-pv') || '')).then(function (m) { AP = m; refresh(); }, function () {}); } catch (e) {}
  }

  // index: search + multi-group filters (OR within a group, AND across groups). Works as a plain list without JS.
  var grid = document.getElementById('grid');
  if (!grid) return;
  var q = document.getElementById('q'), empty = document.getElementById('empty');
  var shown = document.getElementById('shown'), clearBtn = document.getElementById('clear');
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.card'));
  var groups = Array.prototype.slice.call(document.querySelectorAll('.fgroup'));
  var sel = {}; groups.forEach(function (g) { sel[g.getAttribute('data-key')] = {}; });
  var params = new URLSearchParams(location.search);

  function matchGroup(card, key) {
    var chosen = Object.keys(sel[key]);
    if (!chosen.length) return true;
    var have = (card.getAttribute('data-' + key) || '').split(' ');
    return chosen.some(function (v) { return have.indexOf(v) !== -1; });
  }
  function apply() {
    var term = (q.value || '').trim().toLowerCase(), n = 0, active = !!term;
    groups.forEach(function (g) { if (Object.keys(sel[g.getAttribute('data-key')]).length) active = true; });
    cards.forEach(function (c) {
      var ok = (!term || c.getAttribute('data-q').indexOf(term) !== -1) && groups.every(function (g) { return matchGroup(c, g.getAttribute('data-key')); });
      (c.closest('.card-wrap') || c).hidden = !ok; if (ok) n++;
    });
    empty.hidden = n !== 0;
    shown.textContent = 'แสดง ' + n + ' จาก ' + cards.length + ' สไตล์';
    clearBtn.hidden = !active;
    var out = new URLSearchParams();
    if (term) out.set('q', term);
    groups.forEach(function (g) { var k = g.getAttribute('data-key'); var v = Object.keys(sel[k]); if (v.length) out.set(k, v.join(',')); });
    history.replaceState(null, '', location.pathname + (out.toString() ? '?' + out.toString() : '') + location.hash);
  }
  groups.forEach(function (g) {
    var key = g.getAttribute('data-key');
    Array.prototype.forEach.call(g.querySelectorAll('.chip'), function (ch) {
      var v = ch.getAttribute('data-v');
      if ((params.get(key) || '').split(',').indexOf(v) !== -1) { sel[key][v] = 1; ch.classList.add('on'); ch.setAttribute('aria-pressed', 'true'); }
      ch.addEventListener('click', function () {
        var on = !sel[key][v];
        if (on) sel[key][v] = 1; else delete sel[key][v];
        ch.classList.toggle('on', on); ch.setAttribute('aria-pressed', on ? 'true' : 'false'); apply();
      });
    });
  });
  q.value = params.get('q') || '';
  q.addEventListener('input', apply);
  clearBtn.addEventListener('click', function () {
    q.value = '';
    groups.forEach(function (g) { sel[g.getAttribute('data-key')] = {}; Array.prototype.forEach.call(g.querySelectorAll('.chip'), function (c) { c.classList.remove('on'); c.setAttribute('aria-pressed', 'false'); }); });
    apply();
  });
  apply();
})();
