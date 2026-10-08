import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('dist');
const manifest = JSON.parse(fs.readFileSync('scripts/additel-pump-data.json', 'utf8'));
const pumps = manifest.pumps;

function esc(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function a(url, text, css='') {
  return '<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer"' + (css ? ' class="' + css + '"' : '') + '>' + esc(text) + '</a>';
}
function local(p) { return '/products/additel-' + p.slug; }
function specs(p) {
  return [
    ['Pressure range',p.range],
    ['Equivalent range',p.bar],
    ['Pressure medium',p.fluid],
    ['Adjustment resolution',p.resolution],
    ['Weight',p.weight],
    ['Dimensions (L × W × H)',p.dimensions],
    ['Pressure connection',p.ports],
    ['Volume / displacement',p.volume],
    ['Included and optional accessories',p.accessories]
  ];
}
function list(xs,klass='') {
  return '<ul' + (klass ? ' class="'+klass+'"' : '') + '>' + xs.map(x=>'<li>'+esc(x)+'</li>').join('') + '</ul>';
}
function head(title,description) {
  return [
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
    '<title>'+esc(title)+' — MetrologyBase</title><meta name="description" content="'+esc(description)+'">',
    '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    '<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap" rel="stylesheet">',
    '<link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/products/device.css">',
    '<style>',
    '.pump-wrap{padding:26px 0 88px}.pump-breadcrumb{font:600 12px "DM Sans",sans-serif;color:#6c788b;margin:20px 0 30px}.pump-breadcrumb a{color:var(--blue);text-decoration:none}',
    '.pump-hero{display:grid;grid-template-columns:1.04fr .96fr;gap:42px;align-items:center;padding:28px 0 50px}.pump-kicker{color:var(--blue);font:600 11px "DM Mono",monospace;text-transform:uppercase;letter-spacing:.08em}',
    '.pump-hero h1{font:600 clamp(40px,6vw,74px)/1 "Fraunces",serif;margin:12px 0 16px;letter-spacing:-.04em}.pump-hero p{color:#58677a;font-size:16px;line-height:1.7;margin:0}',
    '.pump-range{font-size:clamp(23px,3vw,34px);font-weight:700;color:var(--ink);margin:25px 0 10px}.pump-actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:23px}',
    '.pump-actions a{padding:12px 15px;border:1px solid var(--line);border-radius:12px;text-decoration:none;font-size:12px;font-weight:700;color:var(--blue);background:#fff}.pump-actions a:first-child{background:var(--blue);border-color:var(--blue);color:white}',
    '.pump-photo-frame{padding:24px;border:1px solid var(--line);border-radius:22px;background:#fff;min-width:0}.pump-photo-frame img{display:block;width:100%;height:325px;object-fit:contain}',
    '.photo-caption{font-size:11px;color:#69788b;padding-top:12px}.photo-caption a{color:var(--blue);font-weight:600}',
    '.pump-columns{display:grid;grid-template-columns:1.15fr .85fr;gap:24px;margin:18px 0 28px}.pump-panel{background:#fff;border:1px solid var(--line);border-radius:20px;padding:25px}',
    '.pump-panel h2,.pump-section h2{font:600 clamp(25px,3vw,35px) "Fraunces",serif;letter-spacing:-.02em;margin:0 0 18px}.pump-facts{width:100%;border-collapse:collapse}.pump-facts th,.pump-facts td{padding:12px 0;border-bottom:1px solid #ece9e2;text-align:left;vertical-align:top;line-height:1.5}',
    '.pump-facts th{width:37%;padding-right:14px;color:#6b7789;font-size:12px;font-weight:600}.pump-facts td{color:#1b3049;font-size:13px;font-weight:600}',
    '.pump-bullets{padding-left:20px;margin:0}.pump-bullets li{margin:0 0 14px;color:#4f6072;font-size:14px;line-height:1.6}',
    '.pump-section{margin:30px 0}.pump-warning{background:#fff9ed;border:1px solid #eadbb7;border-radius:17px;padding:22px}.pump-warning strong{display:block;margin-bottom:8px}.pump-warning li{margin-bottom:10px;font-size:13px;color:#615541}',
    '.pump-sources{border-top:1px solid var(--line);margin:48px 0 10px;padding-top:24px}.pump-sources a{display:inline-block;margin:0 12px 12px 0;font-size:13px;color:var(--blue);font-weight:700}',
    '.pump-related{margin-top:28px;display:flex;flex-wrap:wrap;gap:10px}.pump-related a{padding:9px 13px;border:1px solid var(--line);border-radius:999px;background:#fff;color:var(--blue);font-size:12px;font-weight:700;text-decoration:none}',
    '@media(max-width:870px){.pump-hero,.pump-columns{grid-template-columns:1fr}.pump-photo-frame img{height:260px}.pump-hero{gap:25px}}',
    '</style><script>window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments);};</script><script defer src="/_vercel/insights/script.js"></script></head>'
  ].join('\n');
}
function nav(){
  return '<header class="site-header"><a class="brand" href="/"><span class="brand-mark">M</span><span>MetrologyBase</span></a><nav class="nav-links" aria-label="Primary navigation"><a href="/articles">Articles</a><a href="/#tools">Tools</a><a href="/products">Products</a><a href="/pressure-gauges">Pressure deep dive</a></nav><a class="nav-cta" href="/products?brand=Additel&measurement=pressure">Additel gear</a></header>';
}
function footer(){
  return '<footer><div class="shell footer-grid"><div><a class="brand footer-brand" href="/"><span class="brand-mark">M</span><span>MetrologyBase</span></a><p>Practical resources for calibration professionals.</p></div><div class="footer-links"><a href="/products">Products</a><a href="/products/additel-pressure-pumps">Pressure pumps</a><a href="/articles">Articles</a></div><div class="footer-meta">Independent, vendor-neutral reference. Verify specifications and safety limits before purchase or use.</div></div></footer>';
}
function detail(p,index){
  const pageTitle='Additel '+p.model+' '+p.medium+' Pressure Pump';
  const description='Review the Additel '+p.model+' pressure pump: '+p.range+', '+p.fluid+', '+p.weight+', fittings, features and official datasheet.';
  const facts=specs(p).map(([key,val])=>'<tr><th scope="row">'+esc(key)+'</th><td>'+esc(val)+'</td></tr>').join('');
  const relatives=[pumps[(index+15)%pumps.length],pumps[(index+1)%pumps.length]];
  return [
    head(pageTitle,description),'<body>',nav(),
    '<main class="shell pump-wrap"><div class="pump-breadcrumb"><a href="/products">Products</a> / <a href="/products/additel-pressure-pumps">Additel pressure pumps</a> / '+esc(p.model)+'</div>',
    '<section class="pump-hero"><div><div class="pump-kicker">Additel · '+esc(p.medium)+' pressure generation</div><h1>ADT'+esc(p.model)+'</h1>',
    '<p>'+esc(p.features[0])+' Compare key operating specifications, ordering considerations and source documents before selecting this model.</p>',
    '<div class="pump-range">'+esc(p.range)+'</div><div class="pump-kicker">'+esc(p.bar)+' · '+esc(p.weight)+'</div>',
    '<div class="pump-actions">'+a(p.official,'Manufacturer page ↗')+a(p.datasheet,'Official datasheet (PDF) ↗')+'<a href="/products/additel-pressure-pumps">Compare all pumps →</a></div></div>',
    '<figure class="pump-photo-frame"><img src="'+esc(p.img)+'" alt="Product photograph of Additel ADT'+esc(p.model)+' '+esc(p.medium.toLowerCase())+' pressure pump" width="720" height="500" decoding="async" referrerpolicy="no-referrer" onerror="this.style.display=\'none\';this.nextElementSibling.textContent=\'Image unavailable — open the photo source below.\'">',
    '<figcaption class="photo-caption">Photo source: '+a(p.photoPage,p.photo)+' · <span>Image credit belongs to its source.</span></figcaption></figure></section>',
    '<div class="pump-columns"><section class="pump-panel"><h2>Technical specifications</h2><table class="pump-facts"><tbody>'+facts+'</tbody></table>',
    '<p style="font-size:12px;color:#6e7b8b;margin:17px 0 0">Fine-adjustment resolution is a pump control specification, not measurement accuracy. Confirm the reference instrument separately. Source: '+a(p.datasheet,'Additel datasheet')+'.</p></section>',
    '<section class="pump-panel"><h2>How this model works</h2>'+list(p.features,'pump-bullets')+'</section></div>',
    '<section class="pump-section pump-warning"><strong>Selection and operating notes</strong>'+list(p.notes)+'<p style="font-size:12px;margin:0;color:#756952">Pressure rating, fluid cleanliness, hose rating, port type and DUT compatibility must all be checked against the official documentation. Never assume adapters rated for general service are suitable at ultra-high pressure.</p></section>',
    '<section class="pump-sources"><h2>Sources and documentation</h2><p style="font-size:13px;color:#667085">Technical values: Additel manufacturer datasheet (linked below). Photos: credited distributor or manufacturer listing. Weight or connection details may differ between older selection sheets and newer model datasheets; the newer model-specific datasheet takes precedence.</p>',
    a(p.datasheet,'Additel '+p.model+' datasheet (PDF)')+a(p.official,'Additel '+p.model+' product page')+a(manifest.selectionGuide,'Additel pressure pump selection guide')+a(p.photoPage,'Photo source: '+p.photo),
    '</section><div class="pump-related"><a href="/products/additel-pressure-pumps">← All 16 Additel pump models</a>'+relatives.map(q=>'<a href="'+local(q)+'">ADT'+esc(q.model)+' →</a>').join('')+'</div>',
    '</main>',footer(),'<script defer src="/search.js"></script></body></html>'
  ].join('\n');
}
function overview(){
  const groups=['Pneumatic','Hydraulic'];
  const section=groups.map(group=>{
    const entries=pumps.filter(p=>p.medium===group);
    return '<section class="pump-section" id="'+group.toLowerCase()+'"><div class="pump-group-heading"><h2>'+group+' pumps</h2><span>'+entries.length+' model families</span></div><div class="pump-overview-grid">'+entries.map(p=>{
      return '<article class="overview-card"><a class="overview-photo" href="'+local(p)+'" aria-label="Open Additel '+esc(p.model)+'"><img src="'+esc(p.img)+'" alt="Additel '+esc(p.model)+' product" width="350" height="230" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.style.display=\'none\'"></a><div class="overview-info"><div class="pump-kicker">'+esc(p.medium)+' · '+esc(p.resolution)+'</div><h3><a href="'+local(p)+'">ADT'+esc(p.model)+'</a></h3><p class="overview-range">'+esc(p.range)+'</p><dl><div><dt>Weight</dt><dd>'+esc(p.weight)+'</dd></div><div><dt>Fluid</dt><dd>'+esc(p.fluid)+'</dd></div><div><dt>Key feature</dt><dd>'+esc(p.features[0])+'</dd></div></dl><div class="overview-links"><a href="'+local(p)+'">Full specifications →</a>'+a(p.datasheet,'Datasheet ↗')+'</div><div class="overview-credit">Photo: '+a(p.photoPage,p.photo)+'</div></div></article>';
    }).join('')+'</div></section>';
  }).join('');
  return [
    head('Additel pneumatic and hydraulic pumps: full model comparison','Compare all 16 current Additel hand-operated pressure pump families by pressure range, fluid, weight and adjustment resolution, with product photos and sourced details.'),
    '<body>',nav(),'<main class="shell pump-wrap"><div class="pump-breadcrumb"><a href="/products">Products</a> / Additel pressure pumps</div>',
    '<div class="pump-kicker">Pressure generation · Additel</div><section class="pump-library-hero"><h1>Additel pressure pumps.</h1>',
    '<p>Compare all 16 pneumatic and hydraulic pressure pump families, from ultra-low pressure generation to 60,000 psi. Select a model for its full specifications, accessories, considerations, product photography and direct Additel references.</p>',
    '<div class="pump-actions"><a href="#pneumatic">9 pneumatic families ↓</a><a href="#hydraulic">7 hydraulic families ↓</a>'+a(manifest.selectionGuide,'Selection guide (PDF) ↗')+'</div>',
    '</section>',section,
    '<section class="pump-sources"><h2>How to select a pressure pump</h2><p>Start with the required minimum/maximum pressure and the medium permitted in the DUT. Next check displacement/reservoir volume, required stability, portability and connection type. The pump generates pressure; measurement accuracy is determined by your pressure reference. For 40,000–60,000 psi work, use high-pressure fittings and documented safety precautions specifically rated for that service.</p>',
    '<p><strong>Source notes:</strong> Each model links to its official datasheet and manufacturer page; each image links to its distributor or Additel listing. Newer model-specific datasheets were used to resolve weight and media differences with the general selection guide.</p>',
    a(manifest.selectionGuide,'Additel pressure pump selection guide (PDF)'),'</section></main>',
    footer(),
    '<style>.pump-library-hero{padding:18px 0 35px;max-width:850px}.pump-library-hero h1{font:600 clamp(44px,6vw,76px)/1 "Fraunces",serif;letter-spacing:-.04em;margin:12px 0 18px}.pump-library-hero p{color:#5e6e81;font-size:17px;line-height:1.7}.pump-group-heading{display:flex;align-items:baseline;gap:14px;margin-bottom:20px}.pump-group-heading span{font:500 11px "DM Mono",monospace;color:#7c8695}.pump-overview-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}.overview-card{display:grid;grid-template-columns:170px 1fr;gap:17px;padding:16px;background:#fff;border:1px solid var(--line);border-radius:18px}.overview-photo{display:flex;align-items:center;justify-content:center;min-width:0;border-radius:13px;background:#f9f9f8;overflow:hidden}.overview-photo img{width:100%;height:165px;object-fit:contain}.overview-info h3{margin:7px 0;font:600 26px "Fraunces",serif}.overview-info h3 a{text-decoration:none;color:var(--ink)}.overview-range{font-size:14px;font-weight:750;margin:0 0 12px;color:var(--ink)}.overview-info dl{font-size:11px;margin:0}.overview-info dl div{display:grid;grid-template-columns:75px 1fr;gap:8px;margin:6px 0}.overview-info dt{color:#8993a0}.overview-info dd{margin:0;color:#526176}.overview-links{margin-top:13px;display:flex;gap:13px;flex-wrap:wrap;font-size:12px;font-weight:700}.overview-links a,.overview-credit a{color:var(--blue)}.overview-credit{font-size:10px;color:#7a8494;margin-top:8px}@media(max-width:1060px){.pump-overview-grid{grid-template-columns:1fr}}@media(max-width:530px){.overview-card{grid-template-columns:1fr}.overview-photo img{height:200px}}</style>',
    '<script defer src="/search.js"></script></body></html>'
  ].join('\n');
}

for (let i=0;i<pumps.length;i++){
  const p=pumps[i];
  fs.writeFileSync(path.join(root,'products','additel-'+p.slug+'.html'),detail(p,i));
}
fs.writeFileSync(path.join(root,'products','additel-pressure-pumps.html'),overview());

const gallery=path.join(root,'products.html');
let galleryHTML=fs.readFileSync(gallery,'utf8');
let changed=0;
galleryHTML=galleryHTML.replace(/<article class="product-card"[^>]*data-detail="\/products\/additel-pressure-pumps#([^"]+)"[\s\S]*?<\/article>/g, (card, slug) => {
  const p=pumps.find(item=>item.slug===slug);
  if(!p)throw new Error('Unrecognized Additel pump gallery slug: '+slug);
  changed++;
  const url=local(p);
  card=card.replace('data-detail="/products/additel-pressure-pumps#'+slug+'"','data-detail="'+url+'"');
  card=card.replaceAll('/products/additel-pressure-pumps#'+slug,url);
  card=card.replace(/<h3>/, '<a href="'+url+'" class="pump-gallery-photo" aria-label="Review Additel '+esc(p.model)+' pump"><img src="'+esc(p.img)+'" alt="Additel '+esc(p.model)+' '+esc(p.medium.toLowerCase())+' pump" width="400" height="220" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.style.display=\'none\'"></a><div class="pump-gallery-credit">Photo: '+a(p.photoPage,p.photo)+'</div><h3>');
  card=card.replace(/<div class="card-meta">[\s\S]*?<\/div>/, '<div class="card-meta"><span>'+esc(p.medium)+' · '+esc(p.weight)+'</span></div>');
  card=card.replace('data-search="', 'data-search="'+esc(p.range+' '+p.fluid+' '+p.resolution+' '+p.ports+' '+p.features.join(' '))+' ');
  return card;
});
if(changed!==pumps.length)throw new Error('Expected 16 gallery cards, transformed '+changed);
galleryHTML=galleryHTML.replace('</style>', '.pump-gallery-photo{display:flex;margin-top:14px;height:155px;align-items:center;justify-content:center;overflow:hidden;border-radius:11px;background:#fff}.pump-gallery-photo img{display:block;max-width:100%;width:100%;height:100%;object-fit:contain}.pump-gallery-credit{font:500 9px "DM Sans",sans-serif;margin-top:5px;color:#788698}.pump-gallery-credit a{color:var(--blue);text-decoration:none}.product-card:has(.pump-gallery-photo) h3{margin-top:14px}</style>');
fs.writeFileSync(gallery,galleryHTML);
console.log('Built '+pumps.length+' Additel pump detail pages, illustrated overview and gallery cards.');
