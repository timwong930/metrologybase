
(function(){
  const root=document.getElementById('pumpComparison');
  if(!root)return;
  const body=document.querySelector('#pumpCompareTable tbody');
  const rows=Array.from(body.querySelectorAll('tr'));
  const search=document.getElementById('pumpCompareSearch');
  const type=document.getElementById('pumpCompareType');
  const capacity=document.getElementById('pumpCompareCapacity');
  const sort=document.getElementById('pumpCompareSort');
  const count=document.getElementById('pumpCompareCount');
  const empty=document.getElementById('pumpCompareEmpty');
  function update(){
    const query=search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const medium=type.value;
    const minimum=Number(capacity.value);
    const order=sort.value;
    const sorted=rows.slice().sort((a,b)=>{
      if(order==='max-desc')return Number(b.dataset.psi)-Number(a.dataset.psi);
      if(order==='weight')return Number(a.dataset.weight)-Number(b.dataset.weight) || Number(a.dataset.psi)-Number(b.dataset.psi);
      if(order==='model')return a.dataset.model.localeCompare(b.dataset.model,undefined,{numeric:true});
      return Number(a.dataset.psi)-Number(b.dataset.psi);
    });
    let visible=0;
    for(const row of sorted){
      const show=(medium==='all'||row.dataset.medium===medium)
        && Number(row.dataset.psi)>=minimum
        && query.every(word=>row.dataset.search.includes(word));
      row.hidden=!show;
      row.style.display=show?'':'none';
      if(show)visible++;
      body.appendChild(row);
    }
    count.textContent=visible+' of '+rows.length+' model families';
    empty.hidden=visible>0;
  }
  search.addEventListener('input',update);
  for(const el of [type,capacity,sort])el.addEventListener('change',update);
  update();
})();
