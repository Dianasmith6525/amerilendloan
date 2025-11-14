import { build } from 'esbuild';

build({
  entryPoints: ['server/_core/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outdir: 'dist',
  packages: 'external', // Keep all node_modules external
}).catch(() => process.exit(1));
