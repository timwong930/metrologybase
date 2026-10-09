/* Shared optional-accessory selection state. This is NOT an order-code validator. */
(function(){
  const modelRange=document.getElementById('modelRange');
  const pcSelect=document.getElementById('pcOption');
  const output=document.getElementById('chosenAccessories');
  const inputs=Array.from(document.querySelectorAll('.accessory-choice input[type="checkbox"]'));
  if(!modelRange||!pcSelect||!output||!inputs.length)return;
  const chosen=()=>inputs.filter(el=>el.checked&&!el.disabled).map(el=>el.dataset.label||el.value);
  window.metrologySelectedAccessories=chosen;
  function sync(){
    for(const el of inputs){
      const permitted=!el.dataset.range||el.dataset.range.split(' ').includes(modelRange.value);
      const requiresPc=el.dataset.pc==='true';
      el.disabled=!permitted||(requiresPc&&pcSelect.value!=='pc');
      if(el.disabled)el.checked=false;
      const card=el.closest('.accessory-choice');
      if(card)card.classList.toggle('unavailable',el.disabled);
    }
    const selected=chosen();
    output.textContent=selected.length?'Optional extras: '+selected.join(' · '):'No optional accessories selected.';
  }
  modelRange.addEventListener('change',sync);
  pcSelect.addEventListener('change',sync);
  inputs.forEach(el=>el.addEventListener('change',sync));
  sync();
})();
