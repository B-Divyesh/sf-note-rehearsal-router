import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const siteRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: siteRoot,
  publicDir: resolve(siteRoot, 'public'),
  build: {
    target: 'es2022',
    outDir: resolve(siteRoot, '../dist/site'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        home: resolve(siteRoot, 'index.html'),
        demo: resolve(siteRoot, 'demo/index.html'),
        privacy: resolve(siteRoot, 'privacy/index.html'),
        terms: resolve(siteRoot, 'terms/index.html'),
        notFound: resolve(siteRoot, '404.html')
      }
    }
  }
});
