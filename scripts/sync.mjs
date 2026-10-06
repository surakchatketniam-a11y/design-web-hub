// Refresh content/ from a local checkout of awesome-design-md:  node scripts/sync.mjs ../design-md
import { readdirSync, mkdirSync, copyFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
const src = process.argv[2];
if (!src || !existsSync(src)) { console.error('usage: node scripts/sync.mjs <path to awesome-design-md/design-md>'); process.exit(1); }
let n = 0;
for (const d of readdirSync(src)) {
  const f = join(src, d, 'DESIGN.md');
  if (statSync(join(src, d)).isDirectory() && existsSync(f)) { mkdirSync(join('content', d), { recursive: true }); copyFileSync(f, join('content', d, 'DESIGN.md')); n++; }
}
console.log(`synced ${n} brands into content/`);
