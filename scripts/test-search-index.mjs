import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const docs = JSON.parse(fs.readFileSync('dist/search-index.json','utf8'));
const page = docs.find(doc => doc.url === '/additel-pressure-adapters');
assert.ok(page, 'Adapter directory must be present in the site search index');
assert.equal(page.type, 'Directory', 'Adapter directory must be classified as a directory');
assert.match(page.keywords, /Autoclave/i, 'Adapter directory needs searchable HP / Autoclave aliases');

const fittings = docs.filter(doc => doc.type === 'Adapter');
assert.equal(fittings.length,70,'Every Additel adapter SKU must be independently indexed');
assert.equal(new Set(fittings.map(doc => doc.partNumber)).size,70,'Indexed adapter numbers must be unique');
for (const fitting of fittings) {
  assert.match(fitting.url,/^\/additel-pressure-adapters#part-adt100-/);
  assert.match(fitting.description,/max (150|15,000|40,000|60,000) psi/);
}
assert.equal(fittings.filter(doc => doc.description.includes('max 60,000 psi')).length,1);
assert.equal(fittings.filter(doc => doc.description.includes('max 40,000 psi')).length,4);
assert.equal(fittings.filter(doc => doc.description.includes('max 150 psi')).length,1);

// Exercise the actual site-wide search script with a lightweight DOM and fetch shim.
// This catches ranking regressions rather than only checking index construction.
function el() {
  return {
    listeners:{},style:{},attributes:{},textContent:'',value:'',hidden:false,innerHTML:'',
    classList:{add(){},remove(){},toggle(){}},
    addEventListener(event, handler){this.listeners[event] = handler;},
    setAttribute(name,value){this.attributes[name] = value;},
    querySelectorAll(){return[];},
    blur(){},focus(){},select(){}
  };
}
const input=el(),results=el(),kbd=el(),header=el(),search=el();
header.querySelector=()=>null;
header.appendChild=()=>{};
search.querySelector=selector=>({
  '.global-search-input':input,
  '.global-search-results':results,
  '.global-search-kbd':kbd
}[selector] || null);
const document={
  querySelector:selector=>selector === '.site-header' ? header : null,
  createElement:()=>search,
  addEventListener(){},
};
let fetchCount=0;
const context={
  document,location:{pathname:'/'},navigator:{platform:'Win32',userAgent:'test'},
  setTimeout,clearTimeout,
  fetch:async(url,opts)=>{
    assert.equal(url,'/search-index.json');
    assert.equal(opts.cache,'no-store','Search should not reuse a stale index');
    fetchCount++;
    return {ok:true,json:async()=>docs};
  }
};
vm.runInNewContext(fs.readFileSync('dist/search.js','utf8'),context,{filename:'search.js'});
async function query(value, expectedHref){
  input.value=value;
  input.listeners.input();
  await new Promise(resolve=>setTimeout(resolve,115));
  assert.ok(results.innerHTML.includes('href="'+expectedHref+'"'),
    'Search for '+JSON.stringify(value)+' should show '+expectedHref);
}
await query('Additel adapters','/additel-pressure-adapters');
await query('Autoclave','/additel-pressure-adapters');
await query('ADT104 HP','/additel-pressure-adapters');
await query('ADT100-HPM-HPM','/additel-pressure-adapters#part-adt100-hpm-hpm');
await query('ADT100HPMHPM','/additel-pressure-adapters#part-adt100-hpm-hpm');
await query('ADT100-HPM-M14M','/additel-pressure-adapters#part-adt100-hpm-m14m');
await query('pressure fittings','/pressure-adapters-and-fittings');
await query('pressure','/additel-pressure-adapters');
assert.match(results.innerHTML,/global-search-more/,'Broad searches should offer more than ten results');
results.listeners.click({target:{closest:selector=>selector==='.global-search-more' ? {} : null}});
assert.ok(!results.innerHTML.includes('global-search-more'),'Expanding shows every ranked result');
assert.equal(fetchCount,1,'Search should share one fresh index fetch per page session');
console.log('Verified site search, adapter directory discoverability, 70 SKU deep links, fresh indexing and expanded results.');
