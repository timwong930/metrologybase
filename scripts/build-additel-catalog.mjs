import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve('dist');
const productDir = path.join(dist, 'products');
const catalog = JSON.parse(fs.readFileSync('scripts/additel-catalog-data.json', 'utf8'));
const pumps = JSON.parse(fs.readFileSync('scripts/additel-pump-data.json', 'utf8')).pumps;
const items = catalog.items;
const escape = value => String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const slug = item => (item.model.startsWith('AM') ? 'accumac-' : 'additel-') + item.model.toLowerCase();
const display = item => (item.model.startsWith('AM') ? 'AccuMac ' : 'Additel ADT') + item.model;
const pageURL = item => '/products/' + slug(item);
const photoURL = item => '/additel-catalog/' + slug(item) + '.jpg';
const catalogURL = item => catalog.source + '#page=' + (item.page + 6);
const sectionType = measurement => measurement.includes('temperature') ? 'Temperature' : measurement.includes('process') ? 'Process / electrical' : measurement.includes('electrical') ? 'Electrical' : 'Pressure';
const cite = (url,text) => '<a href="'+escape(url)+'" target="_blank" rel="noopener noreferrer">'+escape(text)+' ↗</a>';

if (items.length < 40) throw new Error('Catalog inventory appears incomplete');
const ids = items.map(slug);
for (const item of items) {
  if (!fs.existsSync(path.join(dist,photoURL(item)))) throw new Error('Missing locally hosted 2026 catalog photo for '+item.model+'. Generate images via scripts/extract-additel-photos.py.');
}
if(new Set(ids).size !== ids.length) throw new Error('Duplicate catalog product slug');
if(items.some(p => !p.page || p.page < 1 || p.page > 221 || !p.overview || !p.features.length)) throw new Error('Missing catalog page or product information');
fs.mkdirSync(productDir, {recursive:true});

const styles = [
  '.catalog-shell{padding:22px 0 90px}.catalog-crumbs{padding:18px 0 30px;font-size:12px;color:#657185}.catalog-crumbs a{color:var(--blue);text-decoration:none}',
  '.catalog-hero{display:grid;grid-template-columns:1.04fr .96fr;gap:38px;align-items:start;padding:22px 0 52px}',
  '.catalog-eyebrow{font:500 11px "DM Mono",monospace;letter-spacing:.06em;text-transform:uppercase;color:#3267a8}',
  '.catalog-hero h1{font:600 clamp(39px,6vw,74px)/1.03 "Fraunces",Georgia,serif;letter-spacing:-.04em;margin:13px 0}',
  '.catalog-subtitle{font-size:20px;font-weight:600;color:#2e4566}.catalog-lede{max-width:670px;color:#526277;line-height:1.76;font-size:16px}',
  '.catalog-pillbox{display:flex;flex-wrap:wrap;gap:8px;margin:22px 0}.catalog-pill{padding:7px 11px;border:1px solid #d5deeb;border-radius:100px;font-size:11px;color:#344f72;background:#f5f9ff}',
  '.catalog-actions{display:flex;flex-wrap:wrap;gap:11px;margin-top:25px}.catalog-actions a{padding:12px 16px;border-radius:100px;background:#122949;color:#fff;font-size:12px;font-weight:700;text-decoration:none}.catalog-actions a+ a{background:#fff;color:#184c80;border:1px solid #ced8e5}',
  '.catalog-image{margin:0;padding:14px;border:1px solid #d6deea;border-radius:22px;background:#fff;min-width:0}.catalog-image iframe{width:100%;height:380px;display:block;border:0;border-radius:12px;background:#f5f7fa}.catalog-image img{width:100%;height:380px;display:block;object-fit:contain;background:#fff;border-radius:12px}.catalog-image figcaption{padding:12px 4px 3px;font-size:11px;color:#68798d;line-height:1.5}.catalog-image details{padding:9px 4px}.catalog-image summary{cursor:pointer;font-size:12px;font-weight:700;color:#215da0}.catalog-photo-fallback{display:none;padding:75px 20px;text-align:center;font-size:13px;color:#64748b}',
  '.catalog-image figcaption a,.catalog-source a,.catalog-related a{color:var(--blue)}.catalog-columns{display:grid;grid-template-columns:1.12fr .88fr;gap:19px}',
  '.catalog-card{background:#fff;padding:27px;border:1px solid #dfe4eb;border-radius:21px;margin-bottom:22px}',
  '.catalog-card h2{font:600 30px/1.16 "Fraunces",Georgia,serif;margin:0 0 19px}.catalog-card p{line-height:1.75;font-size:14px;color:#526277}',
  '.catalog-facts{border-collapse:collapse;width:100%}.catalog-facts th,.catalog-facts td{padding:15px 0;text-align:left;border-bottom:1px solid #e6eaf0;vertical-align:top;font-size:13px;line-height:1.6}',
  '.catalog-facts th{width:33%;color:#697b90;font-weight:600;padding-right:16px}.catalog-facts td{color:#1e3655;font-weight:600}',
  '.catalog-bullets{margin:0;padding-left:20px}.catalog-bullets li{color:#526277;font-size:14px;line-height:1.7;margin:12px 0}',
  '.catalog-source{border-top:1px solid #e6eaf0;padding-top:21px;margin-top:28px;color:#56677e;font-size:13px;line-height:1.8}',
  '.catalog-related{display:flex;gap:9px;flex-wrap:wrap}.catalog-related a{border:1px solid #d9e0e8;padding:10px 13px;border-radius:999px;font-size:12px;text-decoration:none;background:#fff;font-weight:700}',
  '.catalog-small{font-size:12px;color:#65758b;line-height:1.65}.catalog-source-ref{font:500 10px "DM Mono",monospace;color:#617994;text-transform:uppercase;letter-spacing:.06em}',
  '@media(max-width:880px){.catalog-hero,.catalog-columns{grid-template-columns:1fr}.catalog-image iframe{height:350px}}',
  '@media(max-width:520px){.catalog-image iframe{height:290px}.catalog-card{padding:20px}.catalog-hero{gap:16px}}'
].join('');

function header() {
  return '<header class="site-header"><a class="brand" href="/"><span class="brand-mark">M</span><span>MetrologyBase</span></a><nav class="nav-links" aria-label="Primary navigation"><a href="/articles">Articles</a><a href="/#tools">Tools</a><a href="/products" aria-current="page">Products</a><a href="/pressure-gauges">Pressure deep dive</a></nav><a class="nav-cta" href="/products?brand=Additel">Additel equipment</a></header>';
}
function footer() {
  return '<footer><div class="shell footer-grid"><div><a class="brand footer-brand" href="/"><span class="brand-mark">M</span><span>MetrologyBase</span></a><p>Practical tools and resources for calibration professionals.</p></div><div class="footer-links"><a href="/products">Products</a><a href="/articles">Articles</a></div><div class="footer-meta">Independent technical guide. Confirm specifications, approvals and calibration uncertainty against manufacturer documentation.</div></div></footer>';
}
function page(item) {
  const brand = item.model.startsWith('AM') ? 'AccuMac' : 'Additel';
  const name = display(item);
  const related = items.filter(x => x.model !== item.model && (x.type === item.type || x.page === item.page)).slice(0,3);
  const intro = escape(item.overview);
  const vals = [['Product',''+name],['Equipment type',item.title],['Published series range',item.range],['Published accuracy / performance',item.accuracy],['Catalog location','2026 catalog · printed page '+item.page+' (PDF page '+(item.page+6)+')']];
  const facts = vals.map(x=>'<tr><th scope="row">'+escape(x[0])+'</th><td>'+escape(x[1])+'</td></tr>').join('');
  const choices = [
    'Confirm the exact model and measurement range: published series-wide limits may not apply to every selectable configuration.',
    'Match the pressure or temperature connection, medium, sensor input, and accessory compatibility to the DUT.',
    'Check the model-specific ordering chart and calibration certificate for uncertainty, compensation conditions, and any hazardous-area approvals.'
  ];
  return [
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
    '<title>'+escape(name+' '+item.title+' — MetrologyBase')+'</title><meta name="description" content="'+escape(item.overview)+'"><meta property="og:image" content="'+escape(photoURL(item))+'">',
    '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    '<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap" rel="stylesheet">',
    '<link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/products/device.css"><style>'+styles+'</style>',
    '<script>window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments);};</script><script defer src="/_vercel/insights/script.js"></script>',
    '</head><body>',header(),'<main class="shell catalog-shell">',
    '<div class="catalog-crumbs"><a href="/products">Products</a> / <a href="/products?brand=Additel">2026 Additel catalog</a> / '+escape(name)+'</div>',
    '<section class="catalog-hero"><div><div class="catalog-eyebrow">'+escape(brand)+' · '+escape(sectionType(item.measurement))+' calibration equipment</div>',
    '<h1>'+escape(name)+'</h1><p class="catalog-subtitle">'+escape(item.title)+'</p><p class="catalog-lede">'+intro+'</p>',
    '<div class="catalog-pillbox"><span class="catalog-pill">'+escape(item.range)+'</span><span class="catalog-pill">Catalog verified · 2026</span></div>',
    '<div class="catalog-actions">'+(item.official?cite(item.official,'Official manufacturer page'):'')+cite(catalogURL(item),'Original catalog page')+cite(catalog.resources,'Manufacturer resources')+'</div></div>',
    '<figure class="catalog-image"><img loading="eager" fetchpriority="high" decoding="async" alt="'+escape(name)+' product photograph sourced from the 2026 Additel catalog" width="650" height="380" src="'+escape(photoURL(item))+'" onerror="this.hidden=true;this.nextElementSibling.open=true">',
    '<details><summary>View full manufacturer catalog page and photo</summary><iframe loading="lazy" title="'+escape(name)+' page in the 2026 Additel catalog" src="'+escape(catalogURL(item)+'&toolbar=0&navpanes=0')+'"></iframe></details>',
    '<figcaption>Product photograph: '+cite(catalogURL(item),'Additel 2026 Product Catalog · p. '+item.page)+'. Some product-family photos depict multiple available models. &copy; Additel/AccuMac.</figcaption></figure></section>',
    '<div class="catalog-columns"><section class="catalog-card"><h2>At a glance</h2><table class="catalog-facts"><tbody>'+facts+'</tbody></table>',
    '<p class="catalog-small">Accuracy values are shown as the catalog describes them; FS = full span/scale, RD = reading. Never treat an accuracy option as a guarantee for every pressure range or configuration.</p></section>',
    '<section class="catalog-card"><h2>Technical highlights</h2><ul class="catalog-bullets">'+item.features.map(f=>'<li>'+escape(f)+'</li>').join('')+'</ul><p class="catalog-small">Features and available configurations may differ between submodels. Review ordering tables in the referenced product section.</p></section></div>',
    '<section class="catalog-card"><h2>Applications and selecting a configuration</h2><p>'+intro+' The required performance depends on the device under test, working environment and measurement uncertainty target.</p>',
    '<ul class="catalog-bullets">'+choices.map(f=>'<li>'+escape(f)+'</li>').join('')+'</ul></section>',
    '<section class="catalog-card"><h2>Accessories and ordering details</h2><p>The original catalog section includes the manufacturer\'s model-specific ordering information, compatible accessories and connection notes where published. Use the catalog rather than assuming accessories from a related model will fit this one.</p>',
    '<p>'+cite(catalogURL(item),'Review ordering and accessories in catalog')+' · '+cite(catalog.resources,'Manufacturer datasheets, manuals and resources')+'</p></section>',
    '<section class="catalog-source"><div class="catalog-source-ref">Sources · verifiable catalog page</div><p>Source of specifications: <strong>Additel 2026 Product Catalog</strong>, printed p. '+item.page+', PDF p. '+(item.page+6)+'. For model-specific engineering or safety decisions, consult the latest manufacturer datasheet and ordering guide. The PDF source is a distributor-hosted copy of the catalog; '+cite(catalog.resources,'Additel publishes its latest resources here')+'.</p></section>',
    '<div class="catalog-related">'+related.map(x=>'<a href="'+pageURL(x)+'">'+escape(display(x))+' →</a>').join('')+'<a href="/products">← All products</a></div>',
    '</main>',footer(),'<script defer src="/search.js"></script></body></html>'
  ].join('\n');
}

let count=0;
for (const item of items) {
  const dest = path.join(productDir, slug(item)+'.html');
  if (fs.existsSync(dest)) throw new Error('Catalog generator would overwrite an existing detailed page: '+dest);
  fs.writeFileSync(dest,page(item),'utf8'); count++;
}

const directoryFile = path.join(dist,'products.html');
let directory = fs.readFileSync(directoryFile,'utf8');
if (!directory.includes('<div class="product-grid" id="productGrid">')) throw new Error('Product gallery marker missing');
const cards = items.map(item=>{
  const brand = item.model.startsWith('AM') ? 'AccuMac' : 'Additel';
  const data = key => escape(item[key]);
  const label=escape(display(item));
  const url=pageURL(item);
  const text=(display(item)+' '+item.title+' '+item.range+' '+item.accuracy+' '+item.overview+' '+item.features.join(' '));
  return '<article class="product-card" data-measurement="'+data('measurement')+'" data-brand="'+brand+'" data-equipment="'+data('type')+'" data-use="reference-calibration field-calibration lab-bench" data-environment="lab bench field" data-detail="'+url+'" data-search="'+escape(text)+'" tabindex="0" role="link" aria-label="Open '+label+' details">'+
  '<div class="product-top"><span class="brand-lockup"><span class="brand-pill">'+brand+'</span></span><span class="measurement-pill">'+escape(sectionType(item.measurement))+'</span></div>'+
  '<div class="catalog-card-photo"><img src="'+escape(photoURL(item))+'" loading="lazy" decoding="async" width="250" height="125" alt="'+label+' product image"></div>'+\n  '<h3>'+label+'</h3><div class="product-type">'+data('title')+'</div><p>'+data('overview')+'</p>'+
  '<div class="card-meta"><span>'+data('range')+'</span></div>'+
  '<div class="best-for"><span>Catalog reference</span><strong>2026 · page '+item.page+'</strong></div>'+
  '<div class="product-actions"><a class="detail-link" href="'+url+'">Review unit →</a></div></article>';
}).join('\n');
directory=directory.replace('</head>','<style>.catalog-card-photo{display:flex;align-items:center;justify-content:center;height:144px;overflow:hidden;background:#fff;border:1px solid #e4eaf2;border-radius:12px;margin:10px 0 14px}.catalog-card-photo img{display:block;max-width:100%;width:100%;height:139px;object-fit:contain;padding:7px}</style></head>');
directory=directory.replace('<div class="product-grid" id="productGrid">','<div class="product-grid" id="productGrid">\n'+cards);
// Fix existing pump gallery cards so they link to their previously generated dedicated pages.
for(const pump of pumps) {
  const anchored='/products/additel-pressure-pumps#'+pump.slug;
  const detail='/products/additel-'+pump.slug;
  directory=directory.replaceAll('data-detail="'+anchored+'"','data-detail="'+detail+'"').replaceAll('href="'+anchored+'"','href="'+detail+'"');
}
directory=directory.replace('<option value="Additel">Additel</option>','<option value="Additel">Additel</option><option value="AccuMac">AccuMac</option>');
directory=directory.replace('<option value="pressure-controller">Pressure controller</option>','<option value="pressure-controller">Pressure controller</option><option value="thermometer-readout">Thermometer readout</option><option value="temperature-probe">Temperature probe</option><option value="pressure-accessory">Pressure accessory</option>');
fs.writeFileSync(directoryFile,directory,'utf8');

// Verify that high-detail model pages are preserved, not silently replaced by generic pages.
const existing = [
 'pressure-gauges/additel-adt601ex.html','pressure-gauges/additel-adt680a.html',
 'pressure-gauges/additel-adt681a.html','pressure-gauges/additel-adt685.html',
 'pressure-gauges/additel-adt686.html','products/additel-875.html',
 'products/additel-878.html','products/additel-835.html','products/additel-227.html',
 'products/additel-760a-760s.html','products/additel-pressure-pumps.html'
];
const checks = {
 'pressure-gauges/additel-adt601ex.html':['0.5%','15,000'],
 'pressure-gauges/additel-adt680a.html':['0.1%','0.2%','60,000'],
 'pressure-gauges/additel-adt681a.html':['0.01%','60,000'],
 'pressure-gauges/additel-adt685.html':['0.01%','60,000'],
 'pressure-gauges/additel-adt686.html':['0.02%','60,000'],
 'products/additel-875.html':['660'],
 'products/additel-878.html':['700'],
 'products/additel-835.html':['250'],
 'products/additel-227.html':['HART'],
 'products/additel-760a-760s.html':['760A','760S']
};
for(const f of existing) {
 const full=path.join(dist,f);
 if(!fs.existsSync(full))throw new Error('Expected existing detailed product page missing: '+f);
 const html=fs.readFileSync(full,'utf8');
 for(const s of checks[f]||[])if(!html.toLowerCase().includes(s.toLowerCase()))throw new Error('Existing page needs catalog review: '+f+' ('+s+')');
}
const missingPumpPages=pumps.filter(x=>!fs.existsSync(path.join(productDir,'additel-'+x.slug+'.html')));
if(missingPumpPages.length)throw new Error('Missing established pump detail pages: '+missingPumpPages.map(x=>x.model).join(', '));
console.log('Generated '+count+' 2026 Additel catalog pages; verified '+existing.length+' preserved detailed pages and '+pumps.length+' pump pages; updated product gallery.');
