// Best-effort token extraction from the PROSE of DESIGN.md files that have no YAML front matter
// (typography table, "Border Radius Scale", "Spacing System"). Used only for the downloadable
// tokens.css / tokens.json: preview pages keep using the strict YAML tokens.

const slug = (s) => String(s).toLowerCase().replace(/\(.*?\)/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const PX = /(-?\d+(?:\.\d+)?)\s*px/;

/** Lines of the section that starts at a "### <title-regex>" heading and runs to the next ### / ## heading. Also returns the heading text. */
function section(body, titleRe) {
  const lines = body.split('\n'), out = [];
  let on = false, head = '';
  for (const ln of lines) {
    if (/^#{2,3}\s/.test(ln)) {
      if (on) break;
      if (new RegExp(`^###\\s+(${titleRe.source})`, titleRe.flags).test(ln)) { on = true; head = ln.replace(/^###\s+/, ''); }
      continue;
    }
    if (on) out.push(ln);
  }
  return { head, lines: out, found: on };
}
const cells = (ln) => ln.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
const isSep = (ln) => /^\|?\s*:?-{2,}/.test(ln.trim());
const toPx = (cell) => {
  const m = String(cell).match(/(?<![d.-])(d+(?:.d+)?)s*px/); if (m) return `${m[1]}px`;
  const r = String(cell).match(/(\d+(?:\.\d+)?)\s*rem/); return r ? `${+(parseFloat(r[1]) * 16).toFixed(2)}px` : '';
};

function parseTypography(body) {
  const { lines, found } = section(body, /Hierarchy/);
  if (!found) return {};
  const rows = lines.filter((l) => l.trim().startsWith('|'));
  if (rows.length < 3) return {};
  const head = cells(rows[0]).map((h) => h.toLowerCase());
  const col = (re) => head.findIndex((h) => re.test(h));
  const iRole = 0, iFont = col(/^font/), iSize = col(/size/), iW = col(/weight/), iLh = col(/line/), iLs = col(/letter|tracking/);
  if (iSize < 0) return {};
  const out = {};
  for (const r of rows.slice(1)) {
    if (isSep(r)) continue;
    const c = cells(r);
    const key = slug(c[iRole]); if (!key || out[key]) continue;
    const size = toPx(c[iSize]); if (!size) continue;
    const t = { fontSize: size };
    const f = iFont >= 0 ? c[iFont].replace(/[`*]/g, '').trim() : '';
    if (f && f !== '—' && f !== '-') t.fontFamily = f;
    const w = iW >= 0 ? c[iW].match(/\d{3}/) : null; if (w) t.fontWeight = Number(w[0]);
    if (iLh >= 0) {
      const raw = c[iLh], paren = raw.match(/\((?:~)?(\d+(?:\.\d+)?)\)/), plain = raw.match(/^\s*(\d+(?:\.\d+)?)(?![\d.]|\s*px)/), px = toPx(raw);
      if (paren) t.lineHeight = Number(paren[1]); else if (plain) t.lineHeight = Number(plain[1]); else if (px) t.lineHeight = px;
    }
    if (iLs >= 0) { const m = c[iLs].match(/(-?\d+(?:\.\d+)?)\s*px/); if (m) t.letterSpacing = `${m[1]}px`; else if (/^normal$/i.test(c[iLs].trim())) t.letterSpacing = '0px'; }
    out[key] = t;
  }
  return out;
}

function parseRadius(body) {
  const { head, lines, found } = section(body, /Border Radius[^\n]*/);
  if (!found) return {};
  const out = {}, seen = new Set();
  const put = (name, v) => {
    if (!v || seen.has(v)) return;
    seen.add(v);
    const n = parseFloat(v);
    const key = name || (v.endsWith('%') ? (n >= 50 ? 'circle' : `${n}pct`) : n >= 500 ? 'pill' : `${n}`);
    let k = key, i = 2; while (k in out) k = `${key}-${i++}`;
    out[k] = v;
  };
  // inline form: "### Border Radius: 3px, 6px, 9999px, 50%"
  for (const m of head.matchAll(/(\d+(?:\.\d+)?(?:px|%))/g)) put('', m[1]);
  for (const ln of lines) {
    const t = ln.trim();
    if (t.startsWith('|')) {
      if (isSep(t)) continue;
      const c = cells(t);
      const named = c[0].replace(/[`*]/g, '').match(/^radius-([\w-]+)$/);
      if (named) { const v = c[1].match(/(\d+(?:\.\d+)?)(?:-\d+(?:\.\d+)?)?(px|%)/); if (v) put(named[1], v[1] + v[2]); continue; }
      const v = c[0].replace(/[`*~]/g, '').match(/^(\d+(?:\.\d+)?(?:px|%))/);
      if (v) put('', v[1]);
    } else if (/^[-*]\s/.test(t)) {
      const lab = t.match(/^[-*]\s+\**([A-Za-z][A-Za-z ]*?)\**\s*\((~?\d+(?:\.\d+)?(?:px|%))/);
      if (lab) { put(slug(lab[1]), lab[2].replace('~', '')); continue; }
      const v = t.replace(/\*+/g, '').match(/^[-*]\s+~?(\d+(?:\.\d+)?(?:px|%))/);
      if (v) put('', v[1]);
    }
  }
  return out;
}

function parseSpacing(body) {
  const { head, lines, found } = section(body, /Spacing[^\n]*/);
  if (!found) return {};
  const out = {};
  const px = (n) => `${+n}px`;
  const base = lines.join('\n').match(/Base unit\**\s*[:\-]?\**\s*\**(\d+(?:\.\d+)?)\s*px/i);
  if (base) out.base = px(base[1]);
  const list = (s) => { for (const m of s.replace(/\(.*?\)/g, ' ').matchAll(/(\d+(?:\.\d+)?)\s*(?:px)?\s*(?=[,/]|$|\.|\s)/g)) { const v = px(m[1]); if (!Object.values(out).includes(v)) out[`${m[1]}`] = v; } };
  if (head.includes(':')) list(head.split(':').slice(1).join(':').replace(/px/g, 'px '));
  for (const ln of lines) {
    const t = ln.trim();
    if (t.startsWith('|')) {
      if (isSep(t)) continue;
      const c = cells(t), n = c[0].replace(/[`*]+/g, '').replace(/^-+/, '').match(/^space-([\w-]+)$/);
      const v = c.slice(1).map(toPx).filter(Boolean).pop();
      if (n && v) out[n[1]] = v;
    } else if (/^[-*]\s+\**(full )?(scale|common values)\b/i.test(t)) {
      list(t.replace(/^[-*]\s+\**[^:]*:\**/, ''));
    }
  }
  return out;
}

/** { typography, rounded, spacing } parsed from prose; each may be empty. */
export function extractProseTokens(body) {
  // a "." is not valid inside a CSS custom-property name (--space-21.44), so 21.44 becomes 21p44
  const safe = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k.replace(/\./g, 'p'), v]));
  return { typography: parseTypography(body), rounded: safe(parseRadius(body)), spacing: safe(parseSpacing(body)) };
}

/** "- **Name** (`#hex`)" color bullets found in the prose, keyed by slug. */
export function extractProseColors(body) {
  const out = {};
  for (const m of body.matchAll(/^[-*]\s+\*\*([^*]+)\*\*\s*\(`?(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\))`?[^)]*\)/gm)) {
    const key = slug(m[1]);
    if (key && !(key in out)) out[key] = m[2];
  }
  return out;
}
