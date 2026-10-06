// Color helpers + deriving a usable preview theme from a brand's tokens (robust to missing tokens).

export function parseColor(v) {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  let m = s.match(/^#([0-9a-f]{3})$/i);
  if (m) return { r: parseInt(m[1][0] + m[1][0], 16), g: parseInt(m[1][1] + m[1][1], 16), b: parseInt(m[1][2] + m[1][2], 16), a: 1 };
  m = s.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/i);
  if (m) return { r: parseInt(m[1].slice(0, 2), 16), g: parseInt(m[1].slice(2, 4), 16), b: parseInt(m[1].slice(4, 6), 16), a: m[2] ? parseInt(m[2], 16) / 255 : 1 };
  m = s.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)(?:[\s,/]+([\d.]+))?\s*\)$/i);
  if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
  return null;
}

const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
export const luminance = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
export function contrast(a, b) {
  const l1 = luminance(a), l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}
export const toHex = (c) => '#' + [c.r, c.g, c.b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('');
const BLACK = { r: 0, g: 0, b: 0, a: 1 }, WHITE = { r: 255, g: 255, b: 255, a: 1 };
export const readableOn = (bg) => (contrast(bg, WHITE) >= contrast(bg, BLACK) ? '#ffffff' : '#000000');
const saturation = (c) => { const mx = Math.max(c.r, c.g, c.b), mn = Math.min(c.r, c.g, c.b); return mx === 0 ? 0 : (mx - mn) / mx; };

/** Resolve "{colors.primary}" style references against the token tree. */
export function resolveRef(v, tokens) {
  if (typeof v !== 'string') return v;
  const m = v.match(/^\{([\w.-]+)\}$/);
  if (!m) return v;
  const path = m[1].split('.');
  let node = tokens;
  for (const p of path) { node = node?.[p]; if (node === undefined) return undefined; }
  return typeof node === 'string' ? node : undefined;
}

function pick(colors, names) {
  for (const n of names) if (colors[n] && parseColor(colors[n])) return colors[n];
  return null;
}

export function deriveTheme(colors = {}, opts = {}) {
  const solid = Object.fromEntries(Object.entries(colors).filter(([, v]) => { const c = parseColor(v); return c && c.a >= 0.99; }));
  // legacy documents have no canvas token: use a hint from the text, else assume a white page
  const byLum = Object.values(solid).map((v) => ({ v, l: luminance(parseColor(v)) })).sort((a, b) => a.l - b.l);
  const named = pick(solid, ['canvas', 'background', 'bg', 'surface-base', 'page']);
  const bg = named || (opts.dark && byLum.length ? byLum[0].v : '#ffffff');
  const bgC = parseColor(bg);
  let ink = pick(solid, ['ink', 'text', 'body', 'foreground', 'on-canvas', 'text-primary']);
  if (!ink || contrast(parseColor(ink), bgC) < 4.5) ink = readableOn(bgC);
  let primary = pick(solid, ['primary', 'brand', 'accent', 'brand-primary']);
  if (!primary) {
    const cands = Object.values(solid).map(parseColor).sort((a, b) => saturation(b) - saturation(a));
    primary = cands.length ? toHex(cands[0]) : ink;
  }
  const primaryC = parseColor(primary);
  const onPrimary = pick(solid, ['on-primary', 'on-brand']) && contrast(parseColor(pick(solid, ['on-primary', 'on-brand'])), primaryC) >= 3
    ? pick(solid, ['on-primary', 'on-brand']) : readableOn(primaryC);
  const lift = opts.dark && !named ? byLum.find((x) => x.l - luminance(bgC) > 0.008 && x.l < 0.2)?.v : null;
  const surface = pick(solid, ['surface-card', 'surface-1', 'surface', 'canvas-soft', 'card', 'surface-soft']) || lift || bg;
  const border = pick(solid, ['hairline', 'border', 'divider', 'line']) || (luminance(bgC) > 0.5 ? '#e5e7eb' : '#333333');
  const mute = (() => {
    const m = pick(solid, ['ink-mute', 'ink-muted', 'text-muted', 'muted', 'ink-subtle']);
    return m && contrast(parseColor(m), bgC) >= 3 ? m : ink;
  })();
  return { bg, ink, mute, primary, onPrimary, surface, border, dark: luminance(bgC) < 0.35 };
}
