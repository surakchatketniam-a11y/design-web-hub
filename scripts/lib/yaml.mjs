// Minimal YAML reader for the restricted front matter used by DESIGN.md files:
// nested maps by 2-space indentation, scalar values (quoted or bare), and `|` / `>` block scalars.
// Anything else (lists, flow style) is ignored rather than guessed.

export function splitFrontMatter(text) {
  const t = text.replace(/\r\n/g, '\n');
  if (!t.startsWith('---\n')) return { yaml: null, body: t };
  const end = t.indexOf('\n---', 4);
  if (end === -1) return { yaml: null, body: t };
  return { yaml: t.slice(4, end), body: t.slice(end + 4).replace(/^\n/, '') };
}

function unquote(v) {
  v = v.trim();
  if (v.length >= 2 && v[0] === '"' && v.at(-1) === '"') return v.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  if (v.length >= 2 && v[0] === "'" && v.at(-1) === "'") return v.slice(1, -1).replace(/''/g, "'");
  return v;
}

function splitKey(line) {
  // key may be quoted; value starts after the first ':' that follows the key
  let m = line.match(/^(\s*)"([^"]+)":(?:\s+(.*))?$/) || line.match(/^(\s*)'([^']+)':(?:\s+(.*))?$/) || line.match(/^(\s*)([^\s:#][^:]*?):(?:\s+(.*))?$/);
  if (!m) return null;
  return { indent: m[1].length, key: m[2], value: m[3] ?? '' };
}

export function parseYaml(src) {
  const lines = src.split('\n');
  const root = {};
  const stack = [{ indent: -1, node: root }];
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw.trim() || raw.trim().startsWith('#')) continue;
    const kv = splitKey(raw);
    if (!kv) continue;
    while (stack.length > 1 && kv.indent <= stack.at(-1).indent) stack.pop();
    const parent = stack.at(-1).node;
    const v = kv.value.trim();
    if (v === '|' || v === '>' || v === '|-' || v === '>-') {
      const folded = v.startsWith('>');
      const block = [];
      while (i + 1 < lines.length && (lines[i + 1].trim() === '' || /^\s+/.test(lines[i + 1]) && lines[i + 1].search(/\S/) > kv.indent)) {
        block.push(lines[++i].trim());
      }
      parent[kv.key] = block.join(folded ? ' ' : '\n').trim();
    } else if (v === '') {
      const child = {};
      parent[kv.key] = child;
      stack.push({ indent: kv.indent, node: child });
    } else {
      parent[kv.key] = unquote(v.replace(/\s+#\s.*$/, ''));
    }
  }
  return root;
}
