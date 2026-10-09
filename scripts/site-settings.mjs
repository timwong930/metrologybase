import { readFileSync } from 'node:fs';

export function loadSiteSettings() {
  const config = JSON.parse(readFileSync(new URL('../config/site.config.json', import.meta.url), 'utf8'));
  validateSettings(config);
  return config;
}

export function validateSettings(config) {
  if (!config || !config.site || typeof config.site.name !== 'string' || !config.site.name.trim()) {
    throw new Error('config/site.config.json: site.name must be a non-empty string');
  }
  if (!config.navigation || !Array.isArray(config.navigation.links)) {
    throw new Error('config/site.config.json: navigation.links must be an array');
  }
  if (!config.footer || !Array.isArray(config.footer.links)) {
    throw new Error('config/site.config.json: footer.links must be an array');
  }
  for (const item of [...config.navigation.links, ...config.footer.links, config.navigation.defaultCta].filter(Boolean)) {
    if (typeof item.label !== 'string' || typeof item.href !== 'string' || !item.href.startsWith('/')) {
      throw new Error('Navigation and footer links must have a label and a root-relative href');
    }
  }
  for (const [variable, color] of Object.entries(config.theme?.colors || {})) {
    if (!/^--[a-z0-9-]+$/.test(variable) || !/^#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?$/.test(color)) {
      throw new Error('Invalid theme variable or hex color: ' + variable);
    }
  }
  if (config.site.url && !/^https:\/\/[^/]+/.test(config.site.url)) {
    throw new Error('site.url must be an HTTPS origin, or empty');
  }
  for (const key of ['logoPath', 'faviconPath']) {
    if (config.site[key] && !config.site[key].startsWith('/')) {
      throw new Error('site.' + key + ' must be a root-relative path');
    }
  }
}

function esc(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function brand(settings, extraClass = '') {
  const site = settings.site;
  const mark = site.logoPath
    ? '<img src="' + esc(site.logoPath) + '" alt="" style="max-width:78%;max-height:78%;object-fit:contain">'
    : esc(site.mark || site.name.charAt(0));
  return '<a class="brand' + (extraClass ? ' ' + extraClass : '') + '" href="/" aria-label="' +
    esc(site.name) + ' home"><span class="brand-mark">' + mark + '</span><span>' +
    esc(site.name) + '</span></a>';
}

function linkMarkup(item, active = false) {
  return '<a href="' + esc(item.href) + '"' + (active ? ' aria-current="page"' : '') +
    '>' + esc(item.label) + '</a>';
}

function isCurrent(href, pagePath) {
  const linkPath = href.split(/[?#]/)[0];
  return linkPath !== '/' && (pagePath === linkPath || pagePath.startsWith(linkPath + '/'));
}

function renderHeader(settings, pagePath, oldHeader) {
  const oldCta = oldHeader.match(/<a\b[^>]*class=["'][^"']*\bnav-cta\b[^"']*["'][^>]*>[\s\S]*?<\/a>/i);
  const defaultCta = settings.navigation.defaultCta;
  const cta = oldCta ? oldCta[0] : defaultCta
    ? '<a class="nav-cta" href="' + esc(defaultCta.href) + '">' + esc(defaultCta.label) + '</a>' : '';
  const links = settings.navigation.links.filter(item => item.enabled !== false);
  return '<header class="site-header">' +
    brand(settings) +
    '<nav class="nav-links" aria-label="Primary navigation">' +
    links.map(item => linkMarkup(item, isCurrent(item.href, pagePath))).join('') +
    '</nav>' + cta + '</header>';
}

function renderFooter(settings) {
  const footer = settings.footer;
  return '<footer><div class="shell footer-grid">' +
    '<div>' + brand(settings, 'footer-brand') + '<p>' + esc(settings.site.tagline || '') + '</p></div>' +
    '<div class="footer-links">' +
    footer.links.filter(item => item.enabled !== false).map(item => linkMarkup(item)).join('') +
    '</div><div class="footer-meta">' + esc(footer.notice || '') +
    '</div></div></footer>';
}

function insertIntoHead(html, content) {
  if (!/<\/head>/i.test(html)) throw new Error('HTML page is missing a closing head tag');
  return html.replace(/<\/head>/i, content + '\n</head>');
}

function pageDescription(html) {
  const tag = html.match(/<meta\b(?=[^>]*\bname=["']description["'])[^>]*>/i)?.[0];
  return tag?.match(/\bcontent=["']([^"']*)["']/i)?.[1] || '';
}

export function applySiteSettings(input, pagePath, settings) {
  validateSettings(settings);
  const name = settings.site.name;
  const seo = settings.seo || {};
  // Replace legacy visible branding; keep machine identifiers (which use lower case) unchanged.
  let html = input.replaceAll('MetrologyBase', esc(name));

  html = html.replace(/<header\b[^>]*>[\s\S]*?<\/header>/gi, match =>
    /\bsite-header\b/.test(match.slice(0, match.indexOf('>') + 1))
      ? renderHeader(settings, pagePath, match) : match);

  if (settings.footer.enabled !== false) {
    const footer = renderFooter(settings);
    if (/<footer\b[^>]*>[\s\S]*?<\/footer>/i.test(html)) {
      html = html.replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, footer);
    } else {
      html = html.replace(/<\/body>/i, footer + '\n</body>');
    }
  } else {
    html = html.replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, '');
  }

  const home = pagePath === '/';
  const pageTitle = home && seo.homepageTitle
    ? seo.homepageTitle.replaceAll('{siteName}', name)
    : '';
  if (pageTitle) {
    html = html.replace(/<title\b[^>]*>[\s\S]*?<\/title>/i, '<title>' + esc(pageTitle) + '</title>');
  }

  const existingDescription = pageDescription(html);
  const description = home
    ? (seo.homepageDescription || existingDescription || seo.defaultDescription || '')
    : (existingDescription || seo.defaultDescription || '');
  if (description) {
    const meta = '<meta name="description" content="' + esc(description) + '">';
    const existingTag = /<meta\b(?=[^>]*\bname=["']description["'])[^>]*>/i;
    html = existingTag.test(html) ? html.replace(existingTag, meta) : insertIntoHead(html, meta);
  }

  if (settings.site.faviconPath) {
    const icon = '<link rel="icon" href="' + esc(settings.site.faviconPath) + '">';
    const existingIcon = /<link\b(?=[^>]*\brel=["'](?:shortcut )?icon["'])[^>]*>/i;
    html = existingIcon.test(html) ? html.replace(existingIcon, icon) : insertIntoHead(html, icon);
  }

  if (!/<meta\b[^>]*\bproperty=["']og:site_name["']/i.test(html)) {
    html = insertIntoHead(html, '<meta property="og:site_name" content="' + esc(name) + '">');
  }

  if (settings.site.url && !/<link\b[^>]*\brel=["']canonical["']/i.test(html)) {
    const target = new URL(pagePath, settings.site.url).toString();
    html = insertIntoHead(html, '<link rel="canonical" href="' + esc(target) + '">');
  }

  const colors = Object.entries(settings.theme?.colors || {})
    .map(([key, value]) => key + ':' + value + ';').join('');
  const theme = '<style id="global-site-theme">:root{' + colors + '}</style>';
  if (!/id=["']global-site-theme["']/.test(html)) {
    html = insertIntoHead(html, theme);
  }
  return html;
}
