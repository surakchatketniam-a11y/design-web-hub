/* Before/after gallery: pick a style, device and view; the "before" and "after" screenshots swap together. No server, no storage. */
(function () {
  'use strict';
  var dataEl = document.getElementById('galData');
  if (!dataEl) return;
  var G = JSON.parse(dataEl.textContent);
  var $ = function (id) { return document.getElementById(id); };
  var p = new URLSearchParams(location.search);
  var st = { a: 0, dev: p.get('d') === 'mobile' ? 'mobile' : 'desktop', view: p.get('v') === 'full' ? 'full' : 'fold' };
  G.afters.forEach(function (it, i) { if (it.slug === p.get('s')) st.a = i; });

  function setImg(id, shot, alt) {
    var img = $(id);
    if (!shot) { img.removeAttribute('src'); return; }
    img.setAttribute('src', shot.src); img.setAttribute('width', shot.w); img.setAttribute('height', shot.h); img.setAttribute('alt', alt);
  }
  function render() {
    var key = st.dev + '_' + st.view, a = G.afters[st.a];
    setImg('galBeforeImg', G.before.shots[key], 'หน้าเว็บที่ AI สร้างโดยไม่มี DESIGN.md');
    setImg('galAfterImg', a.shots[key], 'หน้าเว็บที่ AI สร้างโดยแนบ DESIGN.md สไตล์ ' + a.name);
    ['galBeforeBox', 'galAfterBox'].forEach(function (id) { var b = $(id); b.className = 'gal-shot ' + st.dev + ' ' + st.view; b.scrollTop = 0; });
    $('galAfterLabel').textContent = a.label; $('galAfterNotes').textContent = a.notes || '';
    var acts = '';
    if (a.style) acts += '<a class="btn sm" href="../b/' + encodeURIComponent(a.style) + '/">เปิดสไตล์นี้</a>';
    if (a.mix) acts += '<a class="btn sm" href="' + a.mix + '">✨ ผสมต่อจากนี้</a>';
    if (a.html) acts += '<a class="btn sm" href="' + a.html + '" target="_blank" rel="noopener">เปิดหน้า HTML จริง ↗</a>';
    $('galAfterActs').innerHTML = acts;
    Array.prototype.forEach.call(document.querySelectorAll('[data-gs]'), function (c, i) { var on = i === st.a; c.classList.toggle('on', on); c.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-gd]'), function (c) { var on = c.getAttribute('data-gd') === st.dev; c.classList.toggle('on', on); c.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-gv]'), function (c) { var on = c.getAttribute('data-gv') === st.view; c.classList.toggle('on', on); c.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    var u = new URLSearchParams();
    if (st.a) u.set('s', a.slug); if (st.dev !== 'desktop') u.set('d', st.dev); if (st.view !== 'fold') u.set('v', st.view);
    history.replaceState(null, '', location.pathname + (u.toString() ? '?' + u.toString() : ''));
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-gs]'), function (c, i) { c.addEventListener('click', function () { st.a = i; render(); }); });
  Array.prototype.forEach.call(document.querySelectorAll('[data-gd]'), function (c) { c.addEventListener('click', function () { st.dev = c.getAttribute('data-gd'); render(); }); });
  Array.prototype.forEach.call(document.querySelectorAll('[data-gv]'), function (c) { c.addEventListener('click', function () { st.view = c.getAttribute('data-gv'); render(); }); });
  render();
})();
