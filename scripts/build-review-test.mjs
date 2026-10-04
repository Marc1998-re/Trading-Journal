import { build } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

const root = fileURLToPath(new URL('..', import.meta.url));
const outDir = process.argv[2];
if (!outDir) throw new Error('Specify a separate local test output directory, never the production build directory.');
if (resolve(outDir) === resolve(root, 'dist/apps/web')) throw new Error('Test fixture must not replace the production app.');
await build({
  configFile: false,
  root: resolve(root, 'tests/browser'),
  base: '/review-tests/',
  resolve: { alias: [
    { find: /^@\/contexts\/AuthContext(?:\.jsx)?$/, replacement: resolve(root, 'tests/browser/auth.fixture.jsx') },
    { find: /^@\/lib\/pocketbaseClient(?:\.js)?$/, replacement: resolve(root, 'tests/browser/pocketbase.fixture.js') },
    { find: '@', replacement: resolve(root, 'apps/web/src') },
  ] },
  css: { postcss: { plugins: [tailwindcss({ config: resolve(root, 'apps/web/tailwind.config.js'), content: [resolve(root, 'apps/web/src/**/*.{js,jsx}'), resolve(root, 'tests/browser/*.jsx')] }), autoprefixer()] } },
  build: { outDir: resolve(outDir), emptyOutDir: true, rollupOptions: { input: resolve(root, 'tests/browser/review-test.html') } },
});
