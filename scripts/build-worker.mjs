import { build } from 'esbuild';
import { stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
await build({
  absWorkingDir: root,
  entryPoints: ['worker/index.mjs'],
  outfile: 'dist/worker/worker.mjs',
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  loader: { '.css': 'text' },
  legalComments: 'inline',
});
const { size } = await stat(new URL('../dist/worker/worker.mjs', import.meta.url));
console.log(`Worker bundle ready: dist/worker/worker.mjs (${size} bytes). No deployment performed.`);
