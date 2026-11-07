// App color roles: maps a brand's palette onto what a web app needs (page, surfaces, borders, text, accent,
// status, chart series). Roles point at real palette colors when one fits and are derived (mixed / contrast-tuned)
// only when the brand has nothing suitable. Output feeds tokens.css (--app-*), tokens.tailwind.css (bg-app-*)
// and design-rules.md, so an AI can pick colors by purpose instead of guessing from a flat list.
import { parseColor, toHex, luminance, contrast, readableOn, deriveTheme, tuneStatus } from './theme.mjs';

// mix(a, b, t): a moved t of the way toward b (t=0 -> a, t=1 -> b)
const mix = (a, b, t) => {
  const A = parseColor(a), B = parseColor(b);
  return toHex({ r: A.r + (B.r - A.r) * t, g: A.g + (B.g - A.g) * t, b: A.b + (B.b - A.b) * t });
};
const sat = (c) => { const mx = Math.max(c.r, c.g, c.b), mn = Math.min(c.r, c.g, c.b); return mx === 0 ? 0 : (mx - mn) / mx; };
const dist = (a, b) => Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b);

export function deriveRoles(b) {
  const solid = Object.entries(b.tokens.colors).map(([name, value]) => ({ name, value, c: parseColor(value) })).filter((x) => x.c && x.c.a >= 0.99);
  const theme = deriveTheme(b.tokens.colors, { dark: b.darkHint, forceNight: b.forceNight });
  const { bg, ink, dark } = theme;
  const hexOf = (v) => toHex(parseColor(v));
  const tok = (re) => solid.find((x) => re.test(x.name));
  const out = [];
  const add = (key, value, note) => {
    const h = hexOf(value);
    const ref = solid.find((x) => toHex(x.c).toLowerCase() === h.toLowerCase());
    out.push({ key, value: h, ref: ref ? ref.name : null, note });
  };

  // surfaces
  const surface = theme.surface;
  const surfaceMuted = tok(/^(surface-soft|canvas-soft|surface-muted|surface-2|surface-alt|canvas-parchment|surface-pearl|surface-subtle)$/);
  add('page', bg, 'page background');
  add('surface', surface, 'cards, panels, inputs, dropdowns');
  add('surface-muted', surfaceMuted && hexOf(surfaceMuted.value) !== hexOf(bg) ? surfaceMuted.value : mix(bg, ink, dark ? 0.07 : 0.04), 'table header, zebra rows, sidebar, hover background');

  // borders
  const borderSoft = tok(/(hairline-soft|border-soft|border-subtle|border-light|divider-soft)/);
  const borderStrong = tok(/(border-strong|hairline-strong|stroke-strong)/);
  add('border', theme.border, 'default 1px borders and dividers');
  add('border-subtle', borderSoft ? borderSoft.value : mix(theme.border, bg, 0.5), 'dividers inside cards, table row lines');
  add('border-strong', borderStrong ? borderStrong.value : mix(theme.border, ink, 0.3), 'input borders, emphasised outlines');

  // text
  // keep the brand's muted color when it is readable (4.5:1); otherwise nudge it toward the text color until it is
  const ensure = (c, min) => { let out = c; for (let t = 0; t <= 1.0001 && contrast(parseColor(out), parseColor(bg)) < min; t += 0.05) out = mix(c, ink, t); return out; };
  const mute = ensure(hexOf(theme.mute) === hexOf(ink) ? mix(ink, bg, 0.35) : theme.mute, 4.5);
  const subtle = mix(mute, bg, 0.35);
  add('text', ink, 'headings and body text');
  add('text-muted', mute, 'secondary text, captions, labels');
  add('text-subtle', contrast(parseColor(subtle), parseColor(bg)) >= 3 ? subtle : mute, 'placeholders, disabled text, hints');

  // accent
  // some brands' "primary" is the same color as their page (black on black): fall back to a chromatic color that shows up, else the text color
  let accent = theme.primary, onAccent = theme.onPrimary;
  if (contrast(parseColor(accent), parseColor(bg)) < 1.15) {
    const alt = solid.filter((x) => sat(x.c) > 0.35 && contrast(x.c, parseColor(bg)) >= 3).sort((a, c) => sat(c.c) - sat(a.c))[0];
    accent = alt ? alt.value : ink;
    onAccent = readableOn(parseColor(accent));
  }
  const hover = tok(/^primary-(active|hover|pressed|focus)$/);
  const disabled = tok(/^primary-disabled$/);
  add('accent', accent, 'primary buttons, active tab, key actions');
  const own = accent === theme.primary; // brand hover/disabled tokens belong to the brand primary, not to a fallback accent
  add('accent-hover', hover && own ? hover.value : mix(accent, ink, 0.15), 'primary button hover / pressed');
  const accentSoft = mix(bg, accent, dark ? 0.18 : 0.1);
  // a solid accent FILL that carries small text: darkest-needed variant where on-accent text reaches 4.5:1 (Airbnb: white on #ff385c is 3.5:1)
  let strong = accent;
  const strongTok = hover && own ? hover.value : null;
  if (contrast(parseColor(onAccent), parseColor(strong)) < 4.5) {
    strong = strongTok && contrast(parseColor(onAccent), parseColor(strongTok)) >= 4.5 ? strongTok : accent;
    for (let t = 0; t <= 1.0001 && contrast(parseColor(onAccent), parseColor(strong)) < 4.5; t += 0.05) strong = mix(accent, luminance(parseColor(onAccent)) > 0.5 ? '#000000' : '#ffffff', t);
  }
  add('accent-strong', strong, 'solid accent surface that carries small text (cards, badges, small buttons): on-accent text is at least 4.5:1 on it');
  add('accent-soft', accentSoft, 'selected row, selected card, active nav item background');
  // the raw accent is often too light to use as TEXT (Airbnb #ff385c on white is 3.5:1): this variant is nudged until it reads on the page and on accent-soft
  let accentText = accent;
  for (let t = 0; t <= 1.0001 && (contrast(parseColor(accentText), parseColor(bg)) < 4.5 || contrast(parseColor(accentText), parseColor(accentSoft)) < 4.5); t += 0.05) accentText = mix(accent, ink, t);
  add('accent-text', accentText, 'accent-colored TEXT: links, active nav label, key numbers (4.5:1 on page and on accent-soft; never use plain accent for small text)');
  add('accent-border', mix(bg, accent, 0.35), 'border of a selected card / focused field');
  add('accent-disabled', disabled && own ? disabled.value : mix(bg, accent, 0.4), 'disabled primary button');
  add('on-accent', onAccent,'text/icons on an accent background');
  add('focus', accent, 'focus ring');

  // link
  const linkTok = tok(/^(link|legal-link|text-link|action-link|link-blue|action-blue)$/);
  const link = tuneStatus('info', linkTok ? linkTok.value : undefined, bg, surface);
  add('link', link.value, 'inline links');
  add('overlay', '#000000', 'modal backdrop (use at 50% opacity)');

  // status: brand color when its hue fits, otherwise a safe semantic color nudged to 4.5:1 on page and card
  const kinds = [
    ['danger', 'err', /(error|danger|negative|critical|destructive)/, 'errors, destructive actions, failed state'],
    ['success', 'ok', /(success|positive)/, 'success, completed, healthy state'],
    ['warning', 'warn', /warn|caution/, 'warnings, needs attention'],
    ['info', 'info', /(^|-)info($|-)/, 'neutral information, help text, notices']
  ];
  const statusHex = {};
  for (const [name, kind, re, note] of kinds) {
    const cand = tok(re);
    const first = tuneStatus(kind, cand && !/hover|bg|surface/.test(cand.name) ? cand.value : undefined, bg, surface);
    const soft = mix(bg, first.value, dark ? 0.16 : 0.1);
    const fin = tuneStatus(kind, first.value, bg, soft); // text must stay readable on its own tinted background
    statusHex[name] = fin.value;
    add(name, fin.value, note + ' (text, icon, solid badge)');
    add(`${name}-soft`, soft, `${name} background (alert, badge)`);
    add(`${name}-border`, mix(bg, fin.value, 0.35), `${name} border`);
  }

  // chart series. Series 1 is the brand accent, then chromatic brand colors, then hues from a fixed wheel (blue, green, orange, violet, teal, pink)
  // drawn with the accent's own saturation and lightness so the whole set has one visual weight (the old status-color fallback gave a heavy brown).
  // Every series is at least 3:1 on the page (the contrast needed for graphics) and at least 35 degrees of hue from the others.
  // Status colors are not used: a bar must not look like an error.
  const bgC = parseColor(bg);
  const toHsl = (c) => {
    const r = c.r / 255, g = c.g / 255, b = c.b / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
    let h = 0, sa = 0;
    if (d) { sa = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h = (h * 60 + 360) % 360; }
    return { h, s: sa, l };
  };
  const fromHsl = ({ h, s: sa, l }) => {
    const k = (n) => (n + h / 30) % 12, a = sa * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return toHex({ r: f(0) * 255, g: f(8) * 255, b: f(4) * 255 });
  };
  const hueOf = (c) => (sat(c) < 0.2 ? null : toHsl(c).h);
  const apart = (a, c, minDeg = 35) => {
    const ha = hueOf(a), hc = hueOf(c);
    if (ha === null || hc === null) return dist(a, c) > 90; // neutrals: fall back to plain distance
    const d = Math.abs(ha - hc); return Math.min(d, 360 - d) >= minDeg;
  };
  // shift lightness away from the page until the color reaches 3:1 on it
  const onPage = (hex) => {
    const base = toHsl(parseColor(hex));
    const walk = (dir) => {
      const hsl = { ...base }; let i = 0;
      while (i < 50 && contrast(parseColor(fromHsl(hsl)), bgC) < 3) { hsl.l = Math.max(0, Math.min(1, hsl.l + dir * 0.02)); i++; }
      return { i, ok: contrast(parseColor(fromHsl(hsl)), bgC) >= 3, hex: fromHsl(hsl) };
    };
    const darker = walk(-1), lighter = walk(1);
    if (darker.ok && lighter.ok) return darker.i <= lighter.i ? darker.hex : lighter.hex; // mid-tone page: the smaller change wins
    return (darker.ok ? darker : lighter).hex;
  };
  const ref = toHsl(parseColor(accent));
  const picked = [parseColor(accent)];
  const series = [contrast(parseColor(accent), bgC) >= 3 ? hexOf(accent) : onPage(accent)];
  const take = (hex, minDeg) => { const c = parseColor(hex); if (c && picked.every((q) => apart(q, c, minDeg))) { picked.push(c); series.push(toHex(c)); } };
  solid.filter((x) => sat(x.c) > 0.35 && luminance(x.c) > 0.04 && contrast(x.c, bgC) >= 3).sort((a, c) => sat(c.c) - sat(a.c)).forEach((x) => series.length < 4 && take(x.value));
  const wheel = { s: Math.min(0.85, Math.max(0.45, ref.s)), l: Math.min(0.6, Math.max(0.35, ref.l)) };
  const hues = [215, 150, 30, 275, 185, 335, 60, 100];
  for (const h of hues) if (series.length < 6) take(onPage(fromHsl({ h, ...wheel })));
  for (const h of hues) if (series.length < 6) take(onPage(fromHsl({ h, ...wheel })), 25); // still short of 6: accept hues a little closer together
  series.forEach((hx, i) => add(`chart-${i + 1}`, hx, i === 0 ? 'chart series 1 (brand accent)' : `chart series ${i + 1}`));
  return out;
}
