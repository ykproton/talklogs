import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const versions = {};
async function scan(folder = '') {
  for (const entry of (await readdir(join(root, folder), { withFileTypes: true })).sort((a,b) => a.name.localeCompare(b.name, 'en'))) {
    const path = folder ? folder + '/' + entry.name : entry.name;
    if (entry.isDirectory()) await scan(path);
    else if (path !== 'index.html') {
      versions[path] = createHash('sha256').update(await readFile(join(root, path))).digest('hex').slice(0, 16);
    }
  }
}
await scan();
const index = join(root, 'index.html');
let html = await readFile(index, 'utf8');
html = html.replace(/(src|href)="([^"?]+)(?:\?v=[a-f0-9]+)?"/g, (all, attr, path) =>
  versions[path] ? attr + '="' + path + '?v=' + versions[path] + '"' : all);
const data = Object.fromEntries(Object.entries(versions).filter(([path]) => path.includes('/')));
html = html.replace(/(<script type="application\/json" id="asset-versions">)[\s\S]*?(<\/script>)/, (_, start, end) => start + JSON.stringify(data) + end);
await writeFile(index, html);
