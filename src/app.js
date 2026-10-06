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

  // index: search + category filter (works without JS as a plain list)
  var grid = document.getElementById('grid');
  if (!grid) return;
  var q = document.getElementById('q'), empty = document.getElementById('empty');
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.card'));
  var chips = Array.prototype.slice.call(document.querySelectorAll('.chip'));
  var cat = '';
  function apply() {
    var term = (q.value || '').trim().toLowerCase(), shown = 0;
    cards.forEach(function (c) {
      var ok = (!cat || c.dataset.cat === cat) && (!term || c.dataset.q.indexOf(term) !== -1);
      c.hidden = !ok; if (ok) shown++;
    });
    empty.hidden = shown !== 0;
  }
  q.addEventListener('input', apply);
  chips.forEach(function (ch) {
    ch.addEventListener('click', function () {
      cat = ch.dataset.cat; chips.forEach(function (x) { x.classList.toggle('on', x === ch); }); apply();
    });
  });
})();
