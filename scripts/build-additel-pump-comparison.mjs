import fs from 'node:fs';
import path from 'node:path';

const manifest=JSON.parse(fs.readFileSync('scripts/additel-pump-data.json','utf8'));
const pumps=manifest.pumps;
const file=path.resolve('dist/products/additel-pressure-pumps.html');
let html=fs.readFileSync(file,'utf8');

function esc(x){return String(x??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
const limits={
 'adt901b':6,'adt912a':60,'adt914a':375,'adt916a':600,
 'adt992-993':1000,'adt917':1000,'adt918':1500,'adt919a':2000,
 'adt920-920hv':3000,'adt925':6000,'adt997':10000,'adt927':10000,
 'adt928a':15000,'adt946a':15000,'adt959a':40000,'adt960':60000
};
const mediumLabels={
 'adt997':'Approved oils / DI water / other fluids*',
 'adt925':'Oil / water option','adt927':'Oil / water option',
 'adt928a':'Oil / water / Skydrol options','adt946a':'Oil / water option'
};
const workLabels={
 'adt901b':'Field / bench','adt912a':'Field / bench','adt914a':'Handheld',
 'adt916a':'Portable','adt917':'Portable','adt918':'Portable',
 'adt919a':'Bench','adt920-920hv':'Bench','adt992-993':'Handheld',
 'adt997':'Handheld','adt925':'Handheld','adt927':'Portable',
 'adt928a':'Portable','adt946a':'Bench','adt959a':'Bench','adt960':'Bench'
};

if(pumps.length!==16)throw new Error('Expected 16 model families; found '+pumps.length);
const rows=pumps.map(p=>{
 if(!Object.hasOwn(limits,p.slug))throw new Error('Missing max PSI for '+p.slug);
 const weight=parseFloat(p.weight);
 if(!Number.isFinite(weight))throw new Error('Invalid weight for '+p.slug);
 const detail='/products/additel-'+p.slug;
 const media=mediumLabels[p.slug]||p.fluid;
 const search=[p.model,p.medium,p.range,p.bar,p.fluid,p.resolution,p.weight,workLabels[p.slug]].join(' ').toLowerCase();
 return [
 '<tr data-medium="'+p.medium.toLowerCase()+'" data-psi="'+limits[p.slug]+'" data-weight="'+weight+'" data-model="'+esc(p.model.toLowerCase())+'" data-search="'+esc(search)+'">',
 '<th scope="row" class="pump-compare-model"><div class="pump-compare-model-content">',
 '<a href="'+detail+'" class="pump-compare-thumb" aria-label="Review Additel '+esc(p.model)+' pump"><img src="'+esc(p.img)+'" alt="" width="78" height="67" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.style.display=\'none\'"></a>',
 '<span><a class="pump-compare-name" href="'+detail+'">ADT'+esc(p.model)+'</a><small>'+esc(workLabels[p.slug])+'</small></span>',
 '</div></th>',
 '<td><span class="pump-compare-pill '+p.medium.toLowerCase()+'">'+esc(p.medium)+'</span></td>',
 '<td>'+esc(p.range)+'</td>',
 '<td>'+esc(p.bar)+'</td>',
 '<td title="'+esc(p.fluid)+'">'+esc(media)+'</td>',
 '<td>'+esc(p.resolution)+'</td>',
 '<td>'+esc(p.weight)+'</td>',
 '<td><a class="pump-compare-link" href="'+detail+'">Details →</a><a class="pump-compare-link" href="'+esc(p.datasheet)+'" target="_blank" rel="noopener noreferrer">Datasheet ↗</a></td>',
 '</tr>'
 ].join('');
}).join('\n');
const selection=esc(manifest.selectionGuide);
const chart=[
 '<section id="pumpComparison" class="pump-compare" aria-label="Additel pump selection comparison chart">',
 '<div class="pump-compare-head"><div><h2>Compare all Additel pumps.</h2>',
 '<p class="pump-compare-intro">A side-by-side comparison modeled on Additel’s official selection guide, with the latest pump families and model-specific specifications. Filter by pressure requirement or type to find a suitable pump.</p></div>',
 '<div id="pumpCompareCount" class="pump-compare-count" aria-live="polite">16 of 16 model families</div></div>',
 '<div class="pump-compare-controls">',
 '<div class="pump-compare-search"><label for="pumpCompareSearch">Search by model or specification</label><input type="search" id="pumpCompareSearch" placeholder="Model, range, fluid…" autocomplete="off"></div>',
 '<div><label for="pumpCompareType">Pump type</label><select id="pumpCompareType"><option value="all">All types</option><option value="pneumatic">Pneumatic</option><option value="hydraulic">Hydraulic</option></select></div>',
 '<div><label for="pumpCompareCapacity">Required maximum pressure</label><select id="pumpCompareCapacity"><option value="0">Any pressure</option><option value="375">At least 375 psi</option><option value="1000">At least 1,000 psi</option><option value="3000">At least 3,000 psi</option><option value="6000">At least 6,000 psi</option><option value="10000">At least 10,000 psi</option><option value="15000">At least 15,000 psi</option><option value="40000">At least 40,000 psi</option><option value="60000">At least 60,000 psi</option></select></div>',
 '<div><label for="pumpCompareSort">Sort</label><select id="pumpCompareSort"><option value="max-asc">Pressure: low to high</option><option value="max-desc">Pressure: high to low</option><option value="weight">Weight: lightest first</option><option value="model">Model number</option></select></div>',
 '</div>',
 '<div class="pump-compare-scroll-note">← Scroll horizontally for the complete chart →</div>',
 '<div class="pump-compare-scroller" role="region" tabindex="0" aria-label="Scrollable pressure pump comparison table">',
 '<table id="pumpCompareTable" class="pump-compare-table"><thead><tr>',
 '<th scope="col">Model and photo</th><th scope="col">Type</th><th scope="col">Range (psi)</th><th scope="col">Range (bar)</th><th scope="col">Pressure media</th><th scope="col">Adjustment resolution</th><th scope="col">Weight</th><th scope="col">Sources</th>',
 '</tr></thead><tbody>',rows,'</tbody></table></div>',
 '<div id="pumpCompareEmpty" class="pump-compare-empty" hidden>No pumps match these filters. Lower the pressure requirement or choose another type.</div>',
 '<p class="pump-compare-note"><strong>Reading this chart:</strong> A pump generates pressure; adjustment resolution is not calibration accuracy. The 992/993 and 920/920HV entries represent model families, so check the specific variant before ordering. Fluid options depend on model/ordering code. Newer model-specific datasheets take precedence over older selection-guide weight values (including 928A, 946A and 960). *For ADT997, verify fluid compatibility with Additel. Source: <a href="'+selection+'" target="_blank" rel="noopener noreferrer">Additel pressure pump selection guide ↗</a> and each model’s official datasheet linked above.</p>',
 '</section>'
].join('\n');

const insertBefore='<section class="pump-section" id="pneumatic">';
if(!html.includes(insertBefore))throw new Error('Could not locate first pump-card section');
if(html.includes('id="pumpComparison"'))throw new Error('Comparison chart already present');
html=html.replace(insertBefore,chart+'\n'+insertBefore);
html=html.replace('<a href="#pneumatic">9 pneumatic families ↓</a>','<a href="#pumpComparison">Compare all pumps ↓</a><a href="#pneumatic">9 pneumatic families ↓</a>');
html=html.replace('</head>','<link rel="stylesheet" href="/pump-compare.css"></head>');
html=html.replace('</body>','<script defer src="/pump-compare.js"></script></body>');

fs.writeFileSync(file,html);
console.log('Added sourced 16-family pump comparison chart with filtering and sorting.');
