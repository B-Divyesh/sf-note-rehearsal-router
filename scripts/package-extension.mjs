import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { zipSync } from 'fflate';

const extensionRoot = resolve('dist/extension/chrome-mv3');
const downloadRoot = resolve('dist/site/downloads');

async function collect(directory, files = {}) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolutePath = resolve(directory, entry.name);
    if (entry.isDirectory()) await collect(absolutePath, files);
    else files[relative(extensionRoot, absolutePath).replaceAll('\\', '/')] = new Uint8Array(await readFile(absolutePath));
  }
  return files;
}

await mkdir(downloadRoot, { recursive: true });
const files = await collect(extensionRoot);
await writeFile(resolve(downloadRoot, 'note-rehearsal-router.zip'), zipSync(files, { level: 9 }));
console.log(`Packaged ${Object.keys(files).length} extension files for download.`);
