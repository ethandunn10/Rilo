/* Runs every test in here and reports once.
   `npm test` — no framework, just node and vite-node.

   The one that matters most is talk-flow: it actually types into the
   onboarding conversation in a real DOM. A screen can render perfectly and
   be completely non-functional, which is exactly what happened when a
   missing word table made every submit throw inside React's onSubmit —
   silent, and invisible to any test that only checks the markup. */

import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const files = readdirSync(here)
  .filter((f) => /\.test\.(mjs|jsx)$/.test(f))
  .sort();

let failed = 0;

for (const f of files) {
  /* .jsx needs vite-node for JSX and extensionless imports; .mjs is plain */
  const jsx = f.endsWith('.jsx');
  const res = spawnSync(
    jsx ? 'npx' : process.execPath,
    jsx ? ['vite-node', join(here, f)] : [join(here, f)],
    { cwd: join(here, '..'), encoding: 'utf8' },
  );

  const out = (res.stdout || '') + (res.stderr || '');
  const ok = res.status === 0;
  if (!ok) failed += 1;

  console.log(`\n${ok ? '✓' : '✗'} ${f}`);
  /* the detail only matters when something broke */
  const lines = out.split('\n').filter((l) => l.trim());
  (ok ? lines.slice(-1) : lines).forEach((l) => console.log(`   ${l}`));
}

console.log(
  `\n${files.length - failed} of ${files.length} test files passed`,
);
process.exit(failed ? 1 : 0);
