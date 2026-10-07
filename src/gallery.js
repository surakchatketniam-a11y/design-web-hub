/* Before/after gallery: pick a problem set, a "after" page, device and view; the "before" and "after" screenshots swap together. No server, no storage. */
(function () {
  'use strict';
  var dataEl = document.getElementById('galData');
  if (!dataEl) return;
  var G = JSON.parse(dataEl.textContent);
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var p = new URLSearchParams(location.search);
  var st = { set: 0, a: 0, dev: p.get('d') === 'mobile' ? 'mobile' : 'desktop', view: p.get('v') === 'full' ? 'full' : 'fold' };
  G.sets.forEach(function (s, i) { if (s.id === p.get('set')) st.set = i; });
  G.sets[st.set].afters.forEach(function (it, i) { if (it.slug === p.get('s')) st.a = i; });

  function setImg(id, shot, alt) {
    var img = $(id);
    if (!shot) { img.removeAttribute('src'); return; }
    img.setAttribute('src', shot.src); img.setAttribute('width', shot.w); img.setAttribute('height', shot.h); img.setAttribute('alt', alt);
  }
  function actions(it) {
    var acts = '';
    if (it.style) acts += '<a class="btn sm" href="../b/' + encodeURIComponent(it.style) + '/">เปิดสไตล์นี้</a>';
    if (it.mix) acts += '<a class="btn sm" href="' + esc(it.mix) + '">✨ ผสมต่อจากนี้</a>';
    (it.files || []).forEach(function (f) { acts += '<a class="btn sm" href="' + esc(f.href) + '" download>⬇ ' + esc(f.label) + '</a>'; });
    if (it.html) acts += '<a class="btn sm" href="' + esc(it.html) + '" target="_blank" rel="noopener">เปิดหน้า HTML จริง ↗</a>';
    return acts;
  }
  function chips(el, labels, on, attr) {
    el.innerHTML = labels.map(function (l, i) { return '<button type="button" class="chip' + (i === on ? ' on' : '') + '" data-' + attr + '="' + i + '" aria-pressed="' + (i === on) + '">' + esc(l) + '</button>'; }).join('');
  }
  function render() {
    var S = G.sets[st.set];
    if (st.a >= S.afters.length) st.a = 0;
    var key = st.dev + '_' + st.view, a = S.afters[st.a], b = S.before;
    if ($('galSets')) chips($('galSets'), G.sets.map(function (s) { return s.title; }), st.set, 'gset');
    chips($('galStyles'), S.afters.map(function (x) { return x.name; }), st.a, 'gs');
    setImg('galBeforeImg', b.shots[key], 'หน้าเว็บที่ AI สร้างโดยไม่มี DESIGN.md (' + S.title + ')');
    setImg('galAfterImg', a.shots[key], 'หน้าเว็บที่ AI สร้างโดยแนบ DESIGN.md สไตล์ ' + a.name + ' (' + S.title + ')');
    ['galBeforeBox', 'galAfterBox'].forEach(function (id) { var x = $(id); x.className = 'gal-shot ' + st.dev + ' ' + st.view; x.scrollTop = 0; });
    $('galBeforeLabel').textContent = b.label; $('galBeforeNotes').textContent = b.notes || '';
    $('galAfterLabel').textContent = a.label; $('galAfterNotes').textContent = a.notes || '';
    $('galBeforeActs').innerHTML = actions(b); $('galAfterActs').innerHTML = actions(a);
    Array.prototype.forEach.call(document.querySelectorAll('.gal-panel'), function (el) { el.hidden = el.getAttribute('data-panel') !== S.id; });
    Array.prototype.forEach.call(document.querySelectorAll('[data-gd]'), function (c) { var on = c.getAttribute('data-gd') === st.dev; c.classList.toggle('on', on); c.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-gv]'), function (c) { var on = c.getAttribute('data-gv') === st.view; c.classList.toggle('on', on); c.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    var u = new URLSearchParams();
    if (st.set) u.set('set', S.id); if (st.a) u.set('s', a.slug); if (st.dev !== 'desktop') u.set('d', st.dev); if (st.view !== 'fold') u.set('v', st.view);
    history.replaceState(null, '', location.pathname + (u.toString() ? '?' + u.toString() : ''));
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-gset],[data-gs],[data-gd],[data-gv]');
    if (!t) return;
    if (t.hasAttribute('data-gset')) { st.set = +t.getAttribute('data-gset'); st.a = 0; }
    else if (t.hasAttribute('data-gs')) st.a = +t.getAttribute('data-gs');
    else if (t.hasAttribute('data-gd')) st.dev = t.getAttribute('data-gd');
    else if (t.hasAttribute('data-gv')) st.view = t.getAttribute('data-gv');
    render();
  });
  render();
})();
