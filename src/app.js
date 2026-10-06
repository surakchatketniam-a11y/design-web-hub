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


  // brand page: switch the preview layout (14 structures) without reloading the brand page
  var lbtns = document.querySelectorAll('.layout-bar [data-layout]');
  if (pv && lbtns.length) {
    var base = pv.getAttribute('src').split('?')[0], open = document.getElementById('pvOpen'), ld = document.getElementById('layoutDesc');
    Array.prototype.forEach.call(lbtns, function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-layout'), url = base + (k === 'hero' ? '' : '?layout=' + k);
        pv.setAttribute('src', url); if (open) open.setAttribute('href', url);
        if (ld) ld.firstChild.textContent = b.getAttribute('data-desc') + ' ';
        Array.prototype.forEach.call(lbtns, function (x) { var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
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
      c.hidden = !ok; if (ok) n++;
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
