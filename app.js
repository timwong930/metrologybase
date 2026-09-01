const navItems=[['Learn','/learn/'],['Tools','/tools/'],['Glossary','/glossary/'],['About','/about/']];

function isActive(href){const path=window.location.pathname;return href==='/'?path==='/':path.startsWith(href)}
function renderShell(){
  const header=document.querySelector('#site-header');
  const footer=document.querySelector('#site-footer');
  if(header){
    header.className='site-header';
    header.innerHTML=`<a class="brand" href="/" aria-label="MetrologyBase home"><span class="brand-mark">M</span><span>MetrologyBase</span></a><button class="menu-toggle" type="button" aria-expanded="false" aria-controls="primary-nav"><span></span><span></span><span></span><span class="sr-only">Toggle navigation</span></button><nav id="primary-nav" class="nav-links" aria-label="Primary navigation">${navItems.map(([label,href])=>`<a href="${href}"${isActive(href)?' aria-current="page"':''}>${label}</a>`).join('')}</nav><a class="nav-cta" href="/tools/">Open tools</a>`;
    const toggle=header.querySelector('.menu-toggle');
    const nav=header.querySelector('.nav-links');
    toggle?.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')==='true';toggle.setAttribute('aria-expanded',String(!open));nav?.classList.toggle('open',!open)});
    nav?.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{toggle?.setAttribute('aria-expanded','false');nav.classList.remove('open')}));
  }
  if(footer){
    footer.innerHTML=`<div class="shell footer-grid"><div><a class="brand footer-brand" href="/"><span class="brand-mark">M</span><span>MetrologyBase</span></a><p>Practical metrology, explained clearly.</p></div><div class="footer-links">${navItems.map(([label,href])=>`<a href="${href}">${label}</a>`).join('')}</div><div class="footer-meta">Independent educational reference.<br>Verify procedures, standards, and specifications against authoritative sources.</div></div>`;
  }
}

const factors={psi:6894.757293168,bar:100000,kpa:1000,mpa:1000000,inh2o:249.08891};
const labels={psi:'psi',bar:'bar',kpa:'kPa',mpa:'MPa',inh2o:'inH₂O'};
function format(n){if(!Number.isFinite(n))return '—';const a=Math.abs(n);if(a===0)return '0';if(a>=1000)return n.toLocaleString(undefined,{maximumFractionDigits:3});if(a>=1)return n.toLocaleString(undefined,{maximumFractionDigits:5});return n.toPrecision(6)}
function updatePressure(){const value=parseFloat(document.querySelector('#pressureValue')?.value);const from=document.querySelector('#pressureFrom')?.value;const to=document.querySelector('#pressureTo')?.value;const out=document.querySelector('#pressureResult');if(!out||!factors[from]||!factors[to])return;const result=value*factors[from]/factors[to];out.textContent=`${format(result)} ${labels[to]}`}
function updateTur(){const dut=Math.abs(parseFloat(document.querySelector('#dutTolerance')?.value));const ref=Math.abs(parseFloat(document.querySelector('#refUncertainty')?.value));const out=document.querySelector('#turResult');const status=document.querySelector('#turStatus');if(!out||!status)return;if(!Number.isFinite(dut)||!Number.isFinite(ref)||ref===0){out.textContent='—';status.textContent='Enter valid non-zero values';return}const tur=dut/ref;out.textContent=`${tur.toFixed(2)} : 1`;status.textContent=tur>=4?'Common 4:1 target met':tur>=3?'Below 4:1 — review your requirement':'Low ratio — review measurement capability'}
function initTools(){document.querySelectorAll('#pressureValue,#pressureFrom,#pressureTo').forEach(el=>el.addEventListener('input',updatePressure));document.querySelectorAll('#dutTolerance,#refUncertainty').forEach(el=>el.addEventListener('input',updateTur));updatePressure();updateTur()}

document.addEventListener('DOMContentLoaded',()=>{renderShell();initTools()});
