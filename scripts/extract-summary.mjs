// dev helper: print a compact summary of each brand's DESIGN.md for curation
import { readFileSync, readdirSync } from 'node:fs';
import { splitFrontMatter, parseYaml } from './lib/yaml.mjs';
const plain = (s) => String(s).replace(/[*`]/g, '').replace(/\s+/g, ' ').trim();
const from = Number(process.argv[2] || 0), to = Number(process.argv[3] || 999);
const slugs = readdirSync('content').sort().slice(from, to);
for (const s of slugs) {
  const raw = readFileSync(`content/${s}/DESIGN.md`, 'utf8');
  const { yaml, body } = splitFrontMatter(raw);
  let desc = '';
  if (yaml) desc = parseYaml(yaml).description || '';
  if (!desc) { const m = body.match(/##\s*1\.[^\n]*\n+([^\n]+)/); desc = m ? m[1] : ''; }
  const kc = body.match(/Key Characteristics:?\*{0,2}\s*\n((?:\s*[-*].*\n?){1,5})/);
  const bullets = kc ? kc[1].split('\n').filter(Boolean).slice(0, 4).map((x) => plain(x.replace(/^\s*[-*]\s*/, '')).slice(0, 110)).join(' | ') : '';
  console.log(`## ${s}\n${plain(desc).slice(0, 380)}\nKC: ${bullets}\n`);
}
