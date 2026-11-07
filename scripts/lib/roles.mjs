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
  add('accent-soft', mix(bg, accent, dark ? 0.18 : 0.1), 'selected row, selected card, active nav item background');
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

  // chart series: brand accent first, then other chromatic palette colors, then status hues so every series is distinct
  // a series must differ in HUE (35 degrees) from the ones already chosen, otherwise three shades of one red read as one series
  const hueOf = (c) => {
    const r = c.r / 255, g = c.g / 255, b = c.b / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    if (!d) return null;
    const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return (h * 60 + 360) % 360;
  };
  const apart = (a, c, minDeg = 35) => {
    const ha = hueOf(a), hc = hueOf(c);
    if (ha === null || hc === null || sat(a) < 0.2 || sat(c) < 0.2) return dist(a, c) > 90; // neutrals: fall back to plain distance
    const d = Math.abs(ha - hc); return Math.min(d, 360 - d) >= minDeg;
  };
  const picked = [parseColor(accent)];
  const series = [accent];
  const take = (hex, minDeg) => { const c = parseColor(hex); if (c && picked.every((p) => apart(p, c, minDeg))) { picked.push(c); series.push(toHex(c)); } };
  solid.filter((x) => sat(x.c) > 0.35 && luminance(x.c) > 0.04 && luminance(x.c) < 0.75).sort((a, c) => sat(c.c) - sat(a.c)).forEach((x) => series.length < 4 && take(x.value));
  for (const k of ['info', 'success', 'warning', 'danger']) if (series.length < 6) take(statusHex[k]);
  // still short of 4 series (a palette that is mostly one hue): accept status hues that are at least 15 degrees apart
  for (const k of ['warning', 'danger', 'info', 'success']) if (series.length < 4) take(statusHex[k], 15);
  series.forEach((hx, i) => add(`chart-${i + 1}`, hx, i === 0 ? 'chart series 1 (brand accent)' : `chart series ${i + 1}`));
  return out;
}
