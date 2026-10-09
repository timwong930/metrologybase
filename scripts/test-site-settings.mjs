import assert from 'node:assert/strict';
import { loadSiteSettings, applySiteSettings } from './site-settings.mjs';

const defaults = loadSiteSettings();
const renamed = JSON.parse(JSON.stringify(defaults));
renamed.site.name = 'Axis Precision';
renamed.site.mark = 'A';
renamed.site.tagline = 'Precision education and calibration resources.';
renamed.site.url = 'https://example.com';
renamed.theme.colors['--blue'] = '#123456';
const source = '<!doctype html><html><head><title>Test Device — MetrologyBase</title>' +
  '<meta name="description" content="Device-specific description"></head><body>' +
  '<header class="site-header"><a class="brand">MetrologyBase</a>' +
  '<a class="nav-cta" href="/products?brand=Additel">Browse Additel</a></header>' +
  '<main><h1>Device specs</h1></main><footer>Old footer</footer></body></html>';

const result = applySiteSettings(source, '/products/test-device', renamed);
assert.match(result, /Test Device — Axis Precision/);
assert.match(result, /Device-specific description/);
assert.match(result, /Axis Precision home/);
assert.match(result, /class="brand-mark">A</);
assert.match(result, /aria-current="page">Products<\/a>/);
assert.match(result, /Browse Additel/);
assert.match(result, /Precision education and calibration resources/);
assert.match(result, /--blue:#123456/);
assert.match(result, /https:\/\/example\.com\/products\/test-device/);
assert.match(result, /og:site_name/);
assert.doesNotMatch(result, /MetrologyBase|Old footer/);
assert.equal((result.match(/global-site-theme/g) || []).length, 1);
const noFooter = applySiteSettings(source.replace('<footer>Old footer</footer>', ''), '/products/test-device', renamed);
assert.match(noFooter, /<footer>/);
assert.equal((applySiteSettings(result, '/products/test-device', renamed).match(/global-site-theme/g) || []).length, 1);
const homepage = applySiteSettings(source, '/', renamed);
assert.match(homepage, /Axis Precision — Practical tools, resources/);
assert.match(homepage, /Practical metrology resources/);
const withoutFooter = JSON.parse(JSON.stringify(renamed));
withoutFooter.footer.enabled = false;
assert.doesNotMatch(applySiteSettings(source, '/', withoutFooter), /<footer>/);
console.log('Site settings rendering tests passed.');
