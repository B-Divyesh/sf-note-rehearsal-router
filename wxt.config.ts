import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: '.',
  outDir: 'dist/extension',
  manifest: {
    name: 'Note Rehearsal Router',
    description: 'Turn local Markdown notes into one deliberate recall, solve, teach, do, or archive action.',
    version: '1.0.0',
    minimum_chrome_version: '110',
    permissions: ['storage'],
    action: {
      default_title: 'Open Note Rehearsal Router'
    },
    icons: {
      16: 'icon/16.png',
      32: 'icon/32.png',
      48: 'icon/48.png',
      128: 'icon/128.png'
    }
  },
  vite: () => ({
    build: { target: 'es2022' }
  })
});
