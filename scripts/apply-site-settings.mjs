import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { loadSiteSettings, applySiteSettings } from './site-settings.mjs';

const settings = loadSiteSettings();
const dist = path.resolve('dist');
if (!existsSync(dist)) throw new Error('dist directory missing; run the full build first');

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}

const pages = walk(dist).filter(file => file.endsWith('.html'));
if (!pages.length) throw new Error('No HTML pages were found in dist');
for (const file of pages) {
  const relative = path.relative(dist, file).replace(/\\/g, '/');
  const pagePath = relative === 'index.html' ? '/' : '/' + relative.replace(/\.html$/, '');
  const updated = applySiteSettings(readFileSync(file, 'utf8'), pagePath, settings);
  writeFileSync(file, updated);
}

// The standalone search UI also contains human-visible site branding.
const searchPath = path.join(dist, 'search.js');
if (existsSync(searchPath)) {
  const search = readFileSync(searchPath, 'utf8');
  writeFileSync(searchPath, search.replaceAll('MetrologyBase', settings.site.name));
}
console.log('Applied shared site settings to ' + pages.length + ' HTML pages.');
