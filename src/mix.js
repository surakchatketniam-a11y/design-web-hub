/* Mix page: pick colors / type / shape / feel from different brands, preview live, export your own DESIGN.md + tokens. No server, no storage. */
(function () {
  'use strict';
  var root = document.getElementById('mix');
  if (!root) return;
  var $ = function (id) { return document.getElementById(id); };

  // Handshake with the preview frame must survive any load order: listen from the start, and keep re-sending until the frame confirms it drew.
  var acked = false, resend = null;
  window.addEventListener('message', function (e) {
    if (e.origin !== location.origin || !e.data) return;
    if (e.data.type === 'applied') acked = true;
    else if (e.data.type === 'ready' && resend) resend();
  });

  /* ---------- small color helpers ---------- */
  function parseColor(v) {
    v = String(v || '').trim();
    var m = v.match(/^#([0-9a-f]{3})$/i);
    if (m) return [parseInt(m[1][0] + m[1][0], 16), parseInt(m[1][1] + m[1][1], 16), parseInt(m[1][2] + m[1][2], 16)];
    m = v.match(/^#([0-9a-f]{6})/i);
    if (m) return [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16)];
    m = v.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i);
    return m ? [+m[1], +m[2], +m[3]] : null;
  }
  function lin(c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function lum(c) { return 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]); }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function readableOn(hex) { var c = parseColor(hex) || [255, 255, 255]; return contrast(c, [255, 255, 255]) >= contrast(c, [0, 0, 0]) ? '#ffffff' : '#000000'; }
  function download(name, text, type) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: type || 'text/plain;charset=utf-8' }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }
  var toastEl;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(function () { toastEl.classList.remove('show'); }, 1800);
  }
  function copyText(t) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t);
    return new Promise(function (res, rej) { var ta = document.createElement('textarea'); ta.value = t; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy') ? res() : rej(); } catch (e) { rej(e); } ta.remove(); });
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ---------- groups of CSS variables ---------- */
  var G = {
    colors: /^(bg|ink|mute|pri|onpri|sur|bd|inv|oninv|soft[123]|band1|onband1|cta|oncta|a[1-6]|err|okc|warnc|linkc|focusc|ink2|bd2|feat-bg|feat-fg|tile[123]|ontile[123]|nav-bg|nav-fg|pill-bg|pill-fg|foot-bg|foot-fg|sec-bg|sec-fg)$/,
    type: /^(fd|fb|fe|fdth|fbth|(h1|h2|h3|body|btn|cap|eb|nv)-(size|weight|lh|ls))$/,
    shape: /^(r-btn|r-card|r-in|pad-btn|card-pad|pill-r)$/,
    feel: /^(sh1|sh2|sec-pad)$/
  };
  var LABEL = { colors: 'สี', type: 'ตัวอักษร', shape: 'รูปทรง (มุมโค้ง/ปุ่ม/ระยะ)', feel: 'ความรู้สึก (เงา/gradient/ตัวพิมพ์ใหญ่)' };
  var FEEL_TH = { 'tone-upper': 'หัวข้อตัวพิมพ์ใหญ่', 'tone-grad': 'พื้นหลัง gradient', 'tone-flat': 'แบนราบไม่มีเงา', 'tone-soft': 'เงานุ่ม', 'tone-tiles': 'การ์ดสีบล็อก', 'tone-mono': 'ป้ายกำกับ mono' };
  var CATS = [['dev', 'เครื่องมือนักพัฒนา'], ['ai', 'AI'], ['work', 'แอปทำงานและทีม'], ['finance', 'การเงิน'], ['consumer', 'ผู้บริโภค/สื่อ'], ['auto', 'ยานยนต์'], ['hardware', 'ฮาร์ดแวร์'], ['other', 'ทั่วไป']];

  fetch('../data/mix.json?v=' + (root.getAttribute('data-v') || '')).then(function (r) { return r.json(); }).then(init, function () { root.querySelector('.mix-ctrl').insertAdjacentHTML('afterbegin', '<p class="muted">โหลดข้อมูลไม่สำเร็จ ลองรีเฟรชหน้า</p>'); });

  function init(data) {
    var brands = data.brands.slice().sort(function (a, b) { return a.name.localeCompare(b.name); });
    var by = {}; brands.forEach(function (b) { by[b.slug] = b; });
    var params = new URLSearchParams(location.search);
    var DEF = { c: 'airtable', t: 'claude', s: 'stripe', f: 'stripe', cat: 'dev', l: 'hero', lg: 'th', n: 'Your Brand', p: '' };
    var st = {};
    Object.keys(DEF).forEach(function (k) { st[k] = params.get(k) || DEF[k]; });
    ['c', 't', 's', 'f'].forEach(function (k) { if (!by[st[k]]) st[k] = DEF[k]; });
    if (!data.models[st.cat]) st.cat = DEF.cat;
    if (!/^#[0-9a-f]{6}$/i.test(st.p)) st.p = '';

    /* ----- build the controls ----- */
    var opts = brands.map(function (b) { return '<option value="' + esc(b.slug) + '">' + esc(b.name) + '</option>'; }).join('');
    ['colors', 'type', 'shape', 'feel'].forEach(function (g) { $('mx-' + g).innerHTML = opts; });
    $('mxCat').innerHTML = CATS.map(function (c) { return '<option value="' + c[0] + '">' + c[1] + '</option>'; }).join('');
    $('mxLang').innerHTML = '<option value="th">ภาษาไทย</option><option value="en">English</option>';
    $('mxLayout').innerHTML = data.layouts.map(function (l) { return '<option value="' + l.key + '">' + l.n + '. ' + esc(l.thai) + '</option>'; }).join('');
    $('mxAll').innerHTML = '<option value="">ตั้งทุกกลุ่มเป็นแบรนด์เดียว…</option>' + opts;
    $('mxPrompt').innerHTML = data.prompts.map(function (p) { return '<option value="' + p.key + '">' + esc(p.title) + '</option>'; }).join('');

    function B(g) { return by[st[{ colors: 'c', type: 't', shape: 's', feel: 'f' }[g]]]; }
    function pick(vars, re, into) { Object.keys(vars).forEach(function (k) { if (re.test(k)) into[k] = vars[k]; }); }

    /* ----- compute the mixed variables ----- */
    function effective() {
      var c = B('colors'), t = B('type'), s = B('shape'), f = B('feel'), v = {};
      pick(c.vars, G.colors, v); pick(t.vars, G.type, v); pick(s.vars, G.shape, v); pick(f.vars, G.feel, v);
      var classes = f.classes.filter(function (k) { return k !== 'tone-tiles' || c.vars.tile1; });
      if (st.p) {
        var orig = c.vars.pri, on = readableOn(st.p);
        v.pri = st.p; v.onpri = on;
        [['cta', 'oncta'], ['band1', 'onband1'], ['feat-bg', 'feat-fg']].forEach(function (p) { if (v[p[0]] && v[p[0]] === orig) { v[p[0]] = st.p; v[p[1]] = on; } });
      }
      return { v: v, classes: classes, c: c, t: t, s: s, f: f };
    }

    /* ----- preview iframe ----- */
    var frame = $('mxFrame'), raf = 0;
    function model(E) {
      var m = Object.assign({}, data.models[st.cat]);
      m.name = st.n || 'Your Brand'; m.slug = 'mix'; m.hasBand = !!E.c.hasBand; m.tileCount = E.classes.indexOf('tone-tiles') >= 0 ? E.c.tileCount : 0; m.lightPriOnDark = false; m.lang = st.lg === 'en' ? 'en' : 'th';
      return m;
    }
    function send(E) {
      if (!frame.contentWindow) return;
      var style = Object.keys(E.v).map(function (k) { return '--' + k + ':' + E.v[k]; }).join(';');
      frame.contentWindow.postMessage({ type: 'mix', style: style, classes: E.classes.join(' '), dark: E.c.dark, layout: st.l, model: model(E) }, location.origin);
    }

    /* ----- little previews under each select ----- */
    function swatches(b) { return ['bg', 'pri', 'band1', 'soft1', 'a1', 'a2'].map(function (k) { return '<i style="background:' + esc(b.vars[k] || '#ddd') + '"></i>'; }).join(''); }
    function groupPreview(g) {
      var b = B(g), el = $('pv-' + g);
      if (g === 'colors') el.innerHTML = '<span class="sw6">' + swatches(b) + '</span>';
      if (g === 'type') el.innerHTML = '<span class="tsamp" style="font-family:' + esc(b.vars.fd) + ';font-weight:' + esc(b.vars['h1-weight'] || 600) + '">Aa The quick</span><small>' + esc((b.fonts.display || 'ฟอนต์ระบบ').split(',')[0].replace(/["']/g, '')) + '</small>';
      if (g === 'shape') el.innerHTML = '<span class="bsamp" style="border-radius:' + esc(b.vars['r-btn']) + '">ปุ่ม</span><span class="csamp" style="border-radius:' + esc(b.vars['r-card']) + '"></span>';
      if (g === 'feel') el.innerHTML = b.classes.map(function (k) { return FEEL_TH[k] ? '<em>' + FEEL_TH[k] + '</em>' : ''; }).join('');
    }

    /* ----- export: DESIGN.md / tokens ----- */
    function num(x, d) { var n = parseFloat(x); return isFinite(n) ? n : d; }
    function uniqColors(E) {
      var v = E.v, out = {}, seen = {};
      function add(name, val) { if (!val || !parseColor(val)) return; out[name] = val; }
      add('canvas', v.bg); add('ink', v.ink); add('ink-secondary', v.ink2 || v.mute); add('ink-mute', v.mute);
      add('primary', v.pri); add('on-primary', v.onpri); add('surface', v.sur); add('hairline', v.bd); add('hairline-card', v.bd2);
      [1, 2, 3].forEach(function (i) { if (v['soft' + i] && v['soft' + i] !== v.bg && v['soft' + i] !== v.sur) add('surface-tint-' + i, v['soft' + i]); });
      if (E.c.hasBand) { add('band-dark', v.band1); add('on-band', v.onband1); }
      if (v.cta && v.cta !== v.pri && v.cta !== v.band1) { add('band-cta', v.cta); add('on-band-cta', v.oncta); }
      [1, 2, 3, 4, 5, 6].forEach(function (i) { var a = v['a' + i]; if (a && !seen[a] && a !== v.pri) { seen[a] = 1; add('accent-' + (Object.keys(seen).length), a); } });
      add('status-error', v.err); add('status-success', v.okc); add('status-warning', v.warnc); add('link', v.linkc); add('focus', v.focusc);
      if (E.classes.indexOf('tone-tiles') >= 0) [1, 2, 3].forEach(function (i) { if (v['tile' + i]) { add('block-' + i, v['tile' + i]); add('on-block-' + i, v['ontile' + i]); } });
      return out;
    }
    function typeTokens(E) {
      var v = E.v, map = [['display-xl', 'h1'], ['heading-lg', 'h2'], ['heading-md', 'h3'], ['body-md', 'body'], ['button', 'btn'], ['caption', 'cap'], ['eyebrow', 'eb'], ['nav-link', 'nv']];
      var out = {};
      map.forEach(function (m) {
        var p = m[1], size = num(v[p + '-size'], 16), em = num(v[p + '-ls'], 0);
        out[m[0]] = { fontFamily: m[0] === 'eyebrow' && E.classes.indexOf('tone-mono') >= 0 ? v.fe : (m[0].indexOf('display') === 0 || m[0].indexOf('heading') === 0 ? v.fd : v.fb), fontSize: Math.round(size * 100) / 100 + 'px', fontWeight: String(v[p + '-weight'] || 400), lineHeight: String(v[p + '-lh'] || 1.4), letterSpacing: Math.round(em * size * 100) / 100 + 'px' };
        if (m[0] === 'eyebrow' && E.classes.indexOf('tone-upper') >= 0) out[m[0]].textTransform = 'uppercase';
      });
      if (E.classes.indexOf('tone-upper') >= 0) out['display-xl'].textTransform = 'uppercase';
      return out;
    }
    function shapeTokens(E) { var v = E.v; return { rounded: { button: v['r-btn'] || '8px', card: v['r-card'] || '12px', input: v['r-in'] || v['r-btn'] || '8px' }, spacing: { 'section': (num(v['sec-pad'], 88)) + 'px', 'card-padding': v['card-pad'] || '28px', 'button-padding': v['pad-btn'] || '11px 20px' } }; }
    function thName(x) { return String(x || 'Anuphan').replace(/["']/g, ''); }
    function thStack(x) { var n = thName(x); return "'" + n + "', 'Noto Sans Thai', " + (n === 'Noto Serif Thai' ? 'serif' : 'sans-serif'); }
    function q(s) { return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"'; }
    function sources(E) { return { colors: E.c, type: E.t, shape: E.s, feel: E.f }; }

    function buildDesignMd(E) {
      var colors = uniqColors(E), ty = typeTokens(E), sh = shapeTokens(E), src = sources(E), v = E.v;
      var flat = E.classes.indexOf('tone-flat') >= 0, upper = E.classes.indexOf('tone-upper') >= 0, grad = E.classes.indexOf('tone-grad') >= 0, tiles = E.classes.indexOf('tone-tiles') >= 0, mono = E.classes.indexOf('tone-mono') >= 0;
      var name = st.n || 'Your Brand';
      var L = ['---', 'version: alpha', 'name: ' + name.replace(/[^A-Za-z0-9ก-๙ _-]/g, '').replace(/\s+/g, '-') + '-mixed-design', 'description: ' + q('A mixed design language for ' + name + ': colors from ' + src.colors.name + ', typography from ' + src.type.name + ', shapes from ' + src.shape.name + ', and feel (' + (flat ? 'flat surfaces' : 'soft elevation') + (upper ? ', uppercase headlines' : '') + (grad ? ', gradient washes' : '') + (tiles ? ', color-block cards' : '') + ') from ' + src.feel.name + '. Created with DESIGN.md Hub for learning and inspiration.'), '', 'colors:'];
      Object.keys(colors).forEach(function (k) { L.push('  ' + k + ': ' + q(colors[k])); });
      L.push('', 'typography:');
      Object.keys(ty).forEach(function (k) { L.push('  ' + k + ':'); Object.keys(ty[k]).forEach(function (p) { L.push('    ' + p + ': ' + (p === 'fontFamily' || p === 'fontWeight' || p === 'lineHeight' ? q(ty[k][p]) : ty[k][p])); }); });
      L.push('', 'rounded:'); Object.keys(sh.rounded).forEach(function (k) { L.push('  ' + k + ': ' + sh.rounded[k]); });
      L.push('', 'spacing:'); Object.keys(sh.spacing).forEach(function (k) { L.push('  ' + k + ': ' + q(sh.spacing[k])); });
      var secFg = v['sec-fg'] === v.ink ? '"{colors.ink}"' : q(v['sec-fg'] || v.ink);
      L.push('', 'components:',
        '  button-primary:', '    backgroundColor: "{colors.primary}"', '    textColor: "{colors.on-primary}"', '    typography: "{typography.button}"', '    rounded: "{rounded.button}"', '    padding: ' + q(sh.spacing['button-padding']),
        '  button-secondary:', '    backgroundColor: ' + q(v['sec-bg'] && v['sec-bg'] !== 'transparent' ? v['sec-bg'] : 'transparent'), '    textColor: ' + secFg, '    typography: "{typography.button}"', '    rounded: "{rounded.button}"', '    padding: ' + q(sh.spacing['button-padding']),
        '  card-feature:', '    backgroundColor: "{colors.surface}"', '    textColor: "{colors.ink}"', '    rounded: "{rounded.card}"', '    padding: ' + q(sh.spacing['card-padding']),
        '  text-input:', '    backgroundColor: "{colors.canvas}"', '    textColor: "{colors.ink}"', '    typography: "{typography.body-md}"', '    rounded: "{rounded.input}"', '    padding: "10px 14px"');
      if (E.c.hasBand) L.push('  band-section:', '    backgroundColor: "{colors.band-dark}"', '    textColor: "{colors.on-band}"', '    rounded: "{rounded.card}"', '    padding: ' + q(sh.spacing.section + ' 24px'));
      if (tiles) L.push('  card-block:', '    backgroundColor: "{colors.block-1}"', '    textColor: "{colors.on-block-1}"', '    rounded: "{rounded.card}"', '    padding: ' + q(sh.spacing['card-padding']));
      L.push('---', '');
      var shadows = [v.sh1, v.sh2].filter(Boolean).filter(function (x, i, a) { return a.indexOf(x) === i; });
      L.push('## Overview', '',
        name + ' uses a **mixed** design language assembled from four sources. It is meant as a starting point for building a distinctive site, not as a copy of any existing brand.', '',
        '- **Colors** follow ' + src.colors.name + ': ' + (E.c.dark ? 'a dark canvas' : 'a light canvas') + ' with `{colors.primary}` (`' + v.pri + '`) reserved for primary actions.',
        '- **Typography** follows ' + src.type.name + ': display `' + (src.type.fonts.display || 'system sans').split(',')[0].replace(/["\']/g, '') + '` (fallback stack `' + v.fd + '`), body `' + v.fb + '`.',
        '- **Shapes** follow ' + src.shape.name + ': buttons `' + sh.rounded.button + '`, cards `' + sh.rounded.card + '`, inputs `' + sh.rounded.input + '`.',
        '- **Feel** follows ' + src.feel.name + ': ' + (flat ? 'flat surfaces without drop shadows' : 'soft, restrained elevation') + (upper ? '; uppercase display headlines' : '') + (grad ? '; soft gradient washes behind hero areas' : '') + (tiles ? '; color-block feature cards' : '') + (mono ? '; monospace uppercase labels' : '') + '.', '',
        '## Colors', '');
      Object.keys(colors).forEach(function (k) { L.push('- **' + k + '** (`' + colors[k] + '`)'); });
      L.push('', '## Typography', '', '| Token | Size | Weight | Line height | Letter spacing |', '|---|---|---|---|---|');
      Object.keys(ty).forEach(function (k) { L.push('| `' + k + '` | ' + ty[k].fontSize + ' | ' + ty[k].fontWeight + ' | ' + ty[k].lineHeight + ' | ' + ty[k].letterSpacing + ' |'); });
      L.push('', 'Proprietary fonts are replaced by freely available fallbacks (for example Inter). Keep the documented weights and tracking so the voice stays the same.', '',
        '## Thai Typography', '', 'The Latin fonts above have no Thai glyphs. For Thai content pair them with free Thai fonts so the browser does not fall back to a system font:', '',
        '- Thai display / headings: **' + thName(v.fdth) + '**', '- Thai body text: **' + thName(v.fbth) + '**',
        '- CSS stacks: `--font-thai-display: ' + thStack(v.fdth) + '`, `--font-thai-body: ' + thStack(v.fbth) + '` (see tokens.css). Keep the Thai font right after the Latin font in every `font-family`.',
        '- Load from Google Fonts: `https://fonts.googleapis.com/css2?family=' + [thName(v.fdth), thName(v.fbth)].filter(function (x, i, a) { return a.indexOf(x) === i; }).map(function (n) { return n.replace(/ /g, '+') + ':wght@400;500;600;700'; }).join('&family=') + '&display=swap`',
        '- Set `<html lang="th">`. Body line-height 1.7 or more and headings 1.3 or more, even if the values above are tighter.',
        '- Never apply letter-spacing (positive or negative) to Thai text; ignore the tracking values above for Thai. No uppercase or italics on Thai.',
        '- Body text 16px or larger; let the browser wrap Thai lines and avoid fixed-width truncation.', '',
        '## Layout', '', '- Section vertical padding: `' + sh.spacing.section + '`. Card padding: `' + sh.spacing['card-padding'] + '`.', '- Keep one clear primary action per section.', '',
        '## Elevation & Depth', '');
      if (flat) L.push('- Surfaces are flat. Separate areas with hairlines (`{colors.hairline}`) and background changes, not shadows.');
      else L.push('- Use soft shadows only under cards and floating panels.' + (shadows.length ? ' Documented values: ' + shadows.map(function (x) { return '`' + x + '`'; }).join(', ') + '.' : ''));
      if (grad) L.push('- Gradient washes built from the accent colors may sit behind hero areas only — never behind body text or controls.');
      L.push('', '## Components', '',
        '- **button-primary**: `{colors.primary}` fill, `{colors.on-primary}` text, radius `' + sh.rounded.button + '`, padding `' + sh.spacing['button-padding'] + '`.',
        '- **button-secondary**: outlined or transparent, same radius and padding.',
        '- **card-feature**: `{colors.surface}` with hairline border, radius `' + sh.rounded.card + '`.' + (tiles ? ' Highlight cards may use the color blocks `{colors.block-1}` to `{colors.block-3}`.' : ''), '',
        "## Do's and Don'ts", '', '### Do', '',
        '- Use `{colors.primary}` for primary actions and key links only.',
        '- Take every color, radius and font size from the tokens above (also available in `tokens.css`).',
        upper ? '- Set display headlines in UPPERCASE and keep the documented letter spacing.' : '- Keep headlines in sentence case, with the documented weight.',
        flat ? '- Separate surfaces with hairlines or background color changes.' : '- Keep shadows soft and use them sparingly.',
        grad ? '- Use gradient washes behind hero areas to create atmosphere.' : null,
        tiles ? '- Use color-block cards to break up long pages.' : null,
        mono ? '- Use monospace uppercase text for small labels and eyebrows.' : null,
        '', '### Don\'t', '',
        '- Don\'t add colors that are not in the palette.',
        '- Don\'t use `{colors.primary}` as the color of body text.',
        flat ? '- Don\'t add drop shadows to cards, buttons or text.' : '- Don\'t stack heavy shadows or glow effects.',
        '- Don\'t change the button radius `' + sh.rounded.button + '` on individual pages.',
        '- Don\'t use the name, logo or imagery of the brands this mix was inspired by.',
        '', '## Sources of inspiration', '',
        '- Colors: ' + src.colors.name + '\n- Typography: ' + src.type.name + '\n- Shapes: ' + src.shape.name + '\n- Feel: ' + src.feel.name, '',
        'Created with DESIGN.md Hub (https://github.com/surakchatketniam-a11y/design-web-hub). The source analyses come from VoltAgent/awesome-design-md (MIT License). For learning and inspiration only; not affiliated with any of the brands named above.');
      return L.filter(function (x) { return x !== null; }).join('\n') + '\n';
    }

    function buildCss(E) {
      var colors = uniqColors(E), ty = typeTokens(E), sh = shapeTokens(E), v = E.v;
      var L = ['/* ' + (st.n || 'Your Brand') + ' — mixed design tokens (created with DESIGN.md Hub) */', ':root {'];
      Object.keys(colors).forEach(function (k) { L.push('  --color-' + k + ': ' + colors[k] + ';'); });
      L.push('  --font-display: ' + v.fd + ';', '  --font-body: ' + v.fb + ';', '  --font-thai-display: ' + thStack(v.fdth) + ';', '  --font-thai-body: ' + thStack(v.fbth) + ';');
      if (v.fe) L.push('  --font-label: ' + v.fe + ';');
      Object.keys(ty).forEach(function (k) { var t = ty[k]; L.push('  --text-' + k + '-size: ' + t.fontSize + ';', '  --text-' + k + '-weight: ' + t.fontWeight + ';', '  --text-' + k + '-line-height: ' + t.lineHeight + ';', '  --text-' + k + '-tracking: ' + t.letterSpacing + ';'); });
      Object.keys(sh.rounded).forEach(function (k) { L.push('  --radius-' + k + ': ' + sh.rounded[k] + ';'); });
      Object.keys(sh.spacing).forEach(function (k) { L.push('  --space-' + k + ': ' + sh.spacing[k] + ';'); });
      if (v.sh1) L.push('  --shadow-1: ' + v.sh1 + ';'); if (v.sh2) L.push('  --shadow-2: ' + v.sh2 + ';');
      L.push('}'); return L.join('\n') + '\n';
    }
    function buildJson(E) {
      var src = sources(E);
      return JSON.stringify({ name: st.n || 'Your Brand', generator: 'DESIGN.md Hub — Mix', sources: { colors: src.colors.name, typography: src.type.name, shapes: src.shape.name, feel: src.feel.name }, traits: E.classes, colors: uniqColors(E), typography: typeTokens(E), thaiFonts: { display: thName(E.v.fdth), body: thName(E.v.fbth), note: 'Latin fonts have no Thai glyphs; use these for Thai content, body line-height >= 1.7, no letter-spacing.' }, shape: shapeTokens(E), shadows: [E.v.sh1, E.v.sh2].filter(Boolean) }, null, 2) + '\n';
    }
    var AP = null;
    function buildPrompt() {
      if (!AP) return '';
      var t = data.prompts.filter(function (p) { return p.key === $('mxPrompt').value; })[0] || data.prompts[0];
      return AP.buildPrompt(t, { tool: $('mxTool').value, content: { name: st.n === 'Your Brand' ? '' : st.n, offer: $('mxOffer').value, audience: $('mxAud').value } });
    }
    function refreshPrompt() { $('mxPromptText').value = buildPrompt(); }
    if (window.Promise) { try { import('./prompt.js?v=' + (root.getAttribute('data-pv') || '')).then(function (m) { AP = m; refreshPrompt(); }, function () {}); } catch (e) {} }

    /* ----- contrast checker: every pair that matters, with the real ratio ----- */
    function renderContrast(E) {
      var v = E.v, rows = [];
      function add(label, fg, bgc, min) {
        var a = parseColor(fg), b = parseColor(bgc);
        if (!a || !b) return;
        rows.push({ label: label, fg: fg, bg: bgc, min: min, ratio: contrast(a, b) });
      }
      add('ตัวอักษรหลัก บนพื้นหลัง', v.ink, v.bg, 4.5);
      add('ตัวอักษรเล็ก/ป้ายกำกับ บนพื้นหลัง', v.mute, v.bg, 4.5);
      add('ตัวอักษรบนปุ่มหลัก', v.onpri, v.pri, 4.5);
      add('ปุ่มหลัก บนพื้นหลัง (ต้องเห็นขอบเขตปุ่ม)', v.pri, v.bg, 3);
      add('ลิงก์ บนพื้นหลัง', v.linkc, v.bg, 4.5);
      if (E.c.hasBand) add('ตัวอักษรบนแถบเข้ม', v.onband1, v.band1, 4.5);
      [['ผิดพลาด', v.err], ['สำเร็จ', v.okc], ['เตือน', v.warnc]].forEach(function (s) {
        add('สถานะ' + s[0] + ' บนพื้นหลัง', s[1], v.bg, 4.5);
        if (v.sur && v.sur !== v.bg) add('สถานะ' + s[0] + ' บนการ์ด', s[1], v.sur, 4.5);
      });
      if (E.classes.indexOf('tone-tiles') >= 0) [1, 2, 3].forEach(function (i) { if (v['tile' + i]) add('ตัวอักษรบนการ์ดสีบล็อก ' + i, v['ontile' + i], v['tile' + i], 4.5); });
      var bad = rows.filter(function (r) { return r.ratio < r.min; });
      function li(r) {
        var ok = r.ratio >= r.min;
        return '<li class="cr ' + (ok ? 'ok' : 'bad') + '"><span class="crsw" style="background:' + esc(r.bg) + ';color:' + esc(r.fg) + '">Aa</span><span class="crl">' + esc(r.label) + '</span><b>' + r.ratio.toFixed(1) + ':1</b><em>' + (ok ? '✓' : '⚠ ต่ำกว่า ' + r.min + ':1') + '</em></li>';
      }
      var head = bad.length ? '<li class="cr-sum bad">⚠ ' + bad.length + ' จาก ' + rows.length + ' คู่สีอ่านยากหรือมองไม่เห็นชัด</li>' : '<li class="cr-sum ok">✓ ผ่านเกณฑ์ทั้ง ' + rows.length + ' คู่สี (ตัวอักษร 4.5:1 · ปุ่ม 3:1)</li>';
      $('mxWarn').innerHTML = head + bad.map(li).join('') + '<li class="cr-all"><details><summary>ดูทุกคู่สี</summary><ul>' + rows.map(li).join('') + '</ul></details></li>';
    }

    /* ----- update everything ----- */
    var last = null;
    function update() {
      var E = effective(); last = E;
      send(E);
      ['colors', 'type', 'shape', 'feel'].forEach(groupPreview);
      var md = buildDesignMd(E);
      $('mxMdText').value = md;
      $('mxPromptText').value = buildPrompt();
      renderContrast(E);
      var src = sources(E);
      $('mxSrc').innerHTML = ['colors', 'type', 'shape', 'feel'].map(function (g) { return '<li><b>' + LABEL[g].split(' ')[0] + ':</b> <a href="../b/' + esc(src[g].slug) + '/">' + esc(src[g].name) + '</a></li>'; }).join('');
      // keep the URL shareable
      var u = new URLSearchParams();
      Object.keys(DEF).forEach(function (k) { if (st[k] && st[k] !== DEF[k]) u.set(k, st[k]); });
      history.replaceState(null, '', location.pathname + (u.toString() ? '?' + u.toString() : ''));
    }
    function schedule() { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); }

    /* ----- wire up ----- */
    var KEY = { colors: 'c', type: 't', shape: 's', feel: 'f' };
    function syncInputs() {
      Object.keys(KEY).forEach(function (g) { $('mx-' + g).value = st[KEY[g]]; });
      $('mxCat').value = st.cat; $('mxLayout').value = st.l; $('mxLang').value = st.lg; $('mxName').value = st.n === 'Your Brand' ? '' : st.n;
      $('mxPri').value = st.p || '#533afd'; $('mxPriOn').checked = !!st.p;
    }
    Object.keys(KEY).forEach(function (g) { $('mx-' + g).addEventListener('change', function (e) { st[KEY[g]] = e.target.value; schedule(); }); });
    $('mxCat').addEventListener('change', function (e) { st.cat = e.target.value; schedule(); });
    $('mxLang').addEventListener('change', function (e) { st.lg = e.target.value === 'en' ? 'en' : 'th'; schedule(); });
    $('mxLayout').addEventListener('change', function (e) { st.l = e.target.value; schedule(); });
    $('mxName').addEventListener('input', function (e) { st.n = e.target.value.trim() || 'Your Brand'; schedule(); });
    $('mxPriOn').addEventListener('change', function (e) { st.p = e.target.checked ? $('mxPri').value : ''; schedule(); });
    $('mxPri').addEventListener('input', function (e) { $('mxPriOn').checked = true; st.p = e.target.value; schedule(); });
    $('mxAll').addEventListener('change', function (e) { if (!e.target.value) return; ['c', 't', 's', 'f'].forEach(function (k) { st[k] = e.target.value; }); e.target.value = ''; syncInputs(); schedule(); });
    $('mxRandom').addEventListener('click', function () { ['c', 't', 's', 'f'].forEach(function (k) { st[k] = brands[Math.floor(Math.random() * brands.length)].slug; }); syncInputs(); schedule(); });
    $('mxReset').addEventListener('click', function () { Object.keys(DEF).forEach(function (k) { st[k] = DEF[k]; }); syncInputs(); schedule(); });
    ['mxPrompt', 'mxTool'].forEach(function (id) { $(id).addEventListener('change', refreshPrompt); });
    ['mxOffer', 'mxAud'].forEach(function (id) { $(id).addEventListener('input', refreshPrompt); });
    Array.prototype.forEach.call(document.querySelectorAll('.mx-dev [data-w]'), function (b) { b.addEventListener('click', function () { frame.style.width = b.getAttribute('data-w'); Array.prototype.forEach.call(document.querySelectorAll('.mx-dev [data-w]'), function (x) { x.classList.toggle('on', x === b); }); }); });
    $('mxDlMd').addEventListener('click', function () { download('DESIGN.md', buildDesignMd(last), 'text/markdown;charset=utf-8'); });
    $('mxDlCss').addEventListener('click', function () { download('tokens.css', buildCss(last), 'text/css;charset=utf-8'); });
    $('mxDlJson').addEventListener('click', function () { download('tokens.json', buildJson(last), 'application/json;charset=utf-8'); });
    $('mxCopyMd').addEventListener('click', function () { copyText(buildDesignMd(last)).then(function () { toast('คัดลอก DESIGN.md แล้ว'); }, function () { toast('คัดลอกไม่สำเร็จ'); }); });
    $('mxCopyPrompt').addEventListener('click', function () { copyText($('mxPromptText').value).then(function () { toast('คัดลอกคำสั่งแล้ว'); }, function () { toast('คัดลอกไม่สำเร็จ'); }); });
    $('mxShare').addEventListener('click', function () { copyText(location.href).then(function () { toast('คัดลอกลิงก์การผสมนี้แล้ว'); }, function () { toast('คัดลอกไม่สำเร็จ'); }); });

    // phone layout: the controls are long, so a floating button jumps between "settings" and the live preview
    var jump = $('mxJump'), view = root.querySelector('.mix-view'), inView = false;
    if (jump && view && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { inView = en[0].intersectionRatio > 0.35; jump.textContent = inView ? '⚙ กลับไปตั้งค่า' : '👁 ดูตัวอย่าง'; }, { threshold: [0, 0.35, 0.7] }).observe(view);
      jump.addEventListener('click', function () { (inView ? root : view).scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    }
    resend = function () { if (last) send(last); };
    syncInputs(); update();
    // the frame may not have run its script yet (slow network): retry until it answers "applied"
    (function ensure(n) { if (acked || n > 60) return; resend(); setTimeout(function () { ensure(n + 1); }, 400); })(0);
  }
})();
