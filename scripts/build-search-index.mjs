import fs from 'node:fs';
import path from 'node:path';
import { loadSiteSettings } from './site-settings.mjs';

const settings = loadSiteSettings();

const dist = path.resolve('dist');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(function(entry) {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function decodeEntities(value) {
  const entities = {
    '&amp;':'&',
    '&lt;':'<',
    '&gt;':'>',
    '&quot;':'"',
    '&#39;':"'",
    '&nbsp;':' ',
    '&times;':'×',
    '&plusmn;':'±',
    '&deg;':'°',
    '&rarr;':'→',
    '&mdash;':'—',
    '&ndash;':'–'
  };

  return String(value || '')
    .replace(/&(amp|lt|gt|quot|#39|nbsp|times|plusmn|deg|rarr|mdash|ndash);/g,function(match){
      return entities[match] || match;
    })
    .replace(/&#(\d+);/g,function(_,n){ return String.fromCodePoint(Number(n)); })
    .replace(/&#x([0-9a-f]+);/gi,function(_,n){ return String.fromCodePoint(parseInt(n,16)); });
}

function visibleText(html) {
  return decodeEntities(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
      .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi,' ')
      .replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi,' ')
      .replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi,' ')
      .replace(/<[^>]+>/g,' ')
  ).replace(/\s+/g,' ').trim();
}

function meta(html,name) {
  const a = html.match(new RegExp('<meta[^>]+name=["\\\']' + name + '["\\\'][^>]+content=["\\\']([^"\\\']*)["\\\']','i'));
  const b = html.match(new RegExp('<meta[^>]+content=["\\\']([^"\\\']*)["\\\'][^>]+name=["\\\']' + name + '["\\\']','i'));
  return decodeEntities((a || b || [,''])[1] || '');
}

function pageTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const raw = match ? match[1].replace(/<[^>]+>/g,' ') : '';
  return decodeEntities(raw).replace(/\s+/g,' ').trim();
}

function urlFromFile(file) {
  let rel = path.relative(dist,file).replace(/\\/g,'/');
  if (rel === 'index.html') return '/';
  rel = rel.replace(/\.html$/,'');
  return '/' + rel;
}

function inferType(url,title) {
  if (url === '/') return 'Home';
  if (url === '/products' || url === '/pressure-gauges' || url === '/articles') return 'Directory';
  if (url.startsWith('/pressure-gauges/') || url.startsWith('/products/')) return 'Product';
  if (url === '/full-scale-vs-full-span') return 'Tool';
  if (/calculator/i.test(title)) return 'Tool';
  return 'Article';
}

const htmlFiles = walk(dist).filter(function(file){ return file.endsWith('.html'); });

const docs = htmlFiles.map(function(file) {
  let html = fs.readFileSync(file,'utf8');
  const url = urlFromFile(file);
  const originalTitle = pageTitle(html);
  let title = originalTitle;
  for (const separator of [' — ', ' | ', ' - ']) {
    const suffix = separator + settings.site.name;
    if (originalTitle.endsWith(suffix)) {
      title = originalTitle.slice(0, -suffix.length);
      break;
    }
  }
  title = title.trim() || settings.site.name;
  const description = meta(html,'description');
  const text = visibleText(html).slice(0,65000);

  if (settings.features?.globalSearch !== false && !/\/search\.js["']/.test(html)) {
    html = html.replace(/<\/body>/i,'<script defer src="/search.js"></script></body>');
    fs.writeFileSync(file,html);
  }

  return {
    url:url,
    title:title,
    description:description,
    type:inferType(url,title),
    text:text
  };
});

fs.writeFileSync(path.join(dist,'search-index.json'),JSON.stringify(docs));
console.log('Built full-text search index for ' + docs.length + ' pages.');
