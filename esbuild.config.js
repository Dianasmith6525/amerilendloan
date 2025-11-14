import { build } from 'esbuild';

build({
  entryPoints: ['server/_core/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outdir: 'dist',
  external: [
    // Native modules that can't be bundled
    '@tailwindcss/*',
    'lightningcss',
    '@babel/preset-typescript',
    'sharp',
    'pg-native',
    'cpu-features',
    // Other packages that should remain external
    'canvas',
    'jsdom',
  ],
  loader: {
    '.node': 'file',
  },
}).catch(() => process.exit(1));
