import { build } from 'esbuild';
import { nodeExternalsPlugin } from 'esbuild-node-externals';

build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.js',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: ['node22'],
  sourcemap: true,
  loader: {
    '.wasm': 'file',
    '.ts': 'ts',
    '.mts': 'ts',
    '.json': 'json'
  },
  plugins: [nodeExternalsPlugin()]
}).catch(() => process.exit(1));
