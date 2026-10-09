import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const d=JSON.parse(fs.readFileSync('scripts/additel-761a-data.json','utf8'));
const page=fs.readFileSync('dist/products/additel-761a.html','utf8');
const js=fs.readFileSync('dist/adt761a-configurator.js','utf8');
const css=fs.readFileSync('dist/adt761a.css','utf8');
const search=JSON.parse(fs.readFileSync('dist/search-index.json','utf8'));
const directory=fs.readFileSync('dist/products.html','utf8');
const models=Object.fromEntries(d.models.map(m=>[m.code,m]));

assert.deepEqual(d.models.map(m=>m.code),['LLP','D','500','1K','1.5K','BP']);
assert.equal(d.ports.length,5);
assert.equal(new Set(d.ports.map(p=>p.code)).size,5);
for(const m of d.models){
 assert.ok(m.range&&m.bestFor&&m.accuracy.length);
 assert.ok(m.accuracy.every(a=>['01','02','05'].includes(a)),m.code);
 assert.ok(m.lowModules.every(id=>d.modules[id]),m.code);
 assert.equal(new Set(m.lowModules).size,m.lowModules.length);
 assert.ok(!m.defaultLow || m.lowModules.includes(m.defaultLow),m.code);
 assert.ok(page.includes('data-pick-model="'+m.code+'"'),'Comparison table missing '+m.code);
}
assert.deepEqual(models.LLP.accuracy,['05']);
assert.deepEqual(models.D.accuracy,['02']);
assert.deepEqual(models.BP.accuracy,['01']);
assert.ok(!models.LLP.connection&&!models.BP.connection);
assert.ok(models.D.connection&&models['1.5K'].connection);
assert.ok(models.BP.lowModules.length===0);
assert.ok(models.D.lowModules.includes('DP100'));
assert.ok(!models.D.lowModules.includes('CP500'));
assert.ok(!models['500'].lowModules.includes('CP600'));
assert.ok(!models['1K'].lowModules.includes('CP10'));
assert.ok(!models['1.5K'].lowModules.includes('CP1.5K'));
assert.ok(models.LLP.lowModules.includes('DP025'));
assert.ok(models['1.5K'].lowModules.includes('CP1K'));
assert.ok(d.accessories.every(a=>a.models.every(m=>models[m])));
for(const file of ['dist/additel-761a-data.json','dist/additel-catalog/additel-761a.jpg'])assert.ok(fs.existsSync(file),file);
for(const text of [
 '2026 Product Catalog','Original catalog page','adt761a-configurator-v1',
 'src="/additel-catalog/additel-761a.jpg"','/adt761a-configurator.js','/adt761a.css',
 'id="adt761a-models"','id="adt761a-accuracy"','id="adt761a-low"',
 'id="adt761a-port"','id="adt761a-part"','id="adt761a-copy"'
])assert.ok(page.includes(text),'Missing detail content: '+text);
for(const text of ['state.accuracy','m.lowModules.includes','m.connection','renderSummary','navigator.clipboard'])assert.ok(js.includes(text),'Missing interaction: '+text);
assert.ok(css.includes('@media') && css.length>3500);
assert.ok(search.find(p=>p.url==='/products/additel-761a' && p.text.includes('761A-BP')));
assert.ok(directory.includes('data-detail="/products/additel-761a"'));
assert.ok(directory.includes('src="/additel-catalog/additel-761a.jpg"'));
console.log('Verified 761A comparison, six model constraints, live configurator assets, gallery and search index.');
