(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const accuracyLabel = { '01': '0.01% FS', '02': '0.02% FS', '05': '0.05% FS' };
  const state = { model: '500', accuracy: '01', low: 'CP35', port: 'N', extras: new Set() };
  let catalog;
  const model = () => catalog.models.find(item => item.code === state.model);
  const port = () => catalog.ports.find(item => item.code === state.port);
  const addOption = (select, value, text) => {
    const opt = document.createElement('option');
    opt.value = value; opt.textContent = text; select.appendChild(opt);
  };
  const setText = (id,text) => { byId(id).textContent = text; };
  const isLimitedDuration = code => ['DP025','DP050','DP1','DP2','DP5','DP10'].includes(code);
  const code = () => {
    const m = model();
    if (m.code === 'BP') return 'ADT761A-BP-[X]';
    const core = ['ADT761A',m.code,state.accuracy,state.low];
    if (m.connection) core.push(state.port);
    return core.join('-');
  };
  const notices = () => {
    const m = model();
    const messages = [];
    if (m.code === 'BP') messages.push('BP suffix X is not defined in the catalog ordering diagram; confirm the required connection and final part number with Additel.');
    if (isLimitedDuration(state.low)) messages.push('The selected very-low-range ADT155 module has a six-month accuracy statement; consult the separate one-year drift figure.');
    if (['500','1K','1.5K'].includes(m.code)) messages.push('Absolute pressure uses the built-in barometer and adds 55 Pa uncertainty to the gauge-module specification.');
    if (m.code === 'D') messages.push('0.01% FS ADT155 CP modules are not permitted for the 761A-D; the D high-range accuracy is 0.02% FS.');
    if (m.code === '1.5K') messages.push('Use the ADT111-X-KIT external manifold and ADT100-761A-1.5K-X hose kit for the 1.5K platform.');
    if (m.code === 'LLP') messages.push('The LLP does not use the external manifold pressure-port option. Its high-range module is DP30.');
    if (state.low && state.low.startsWith('CP') && ['500','1K','1.5K'].includes(m.code)) messages.push('Confirm low-module ADT155 accuracy and availability; the displayed accuracy code identifies the ordered 761A configuration.');
    return messages;
  };
  function chooseModel(next) {
    const m=catalog.models.find(item=>item.code===next);
    if (!m) return;
    state.model=m.code;
    state.accuracy=m.accuracy[0];
    state.low=m.defaultLow || '';
    state.port='N';
    const allowed=new Set(catalog.accessories.filter(a=>a.models.includes(m.code)).map(a=>a.code));
    for(const chosen of state.extras)if(!allowed.has(chosen))state.extras.delete(chosen);
    render();
  }
  function renderModels() {
    const target=byId('adt761a-models'); target.replaceChildren();
    for(const entry of catalog.models){
      const button=document.createElement('button');button.type='button';
      button.setAttribute('aria-pressed',String(entry.code===state.model));
      button.textContent='761A-'+entry.code;
      const small=document.createElement('small');small.textContent=entry.maximum;button.appendChild(small);
      button.addEventListener('click',()=>chooseModel(entry.code));target.appendChild(button);
    }
    for(const row of document.querySelectorAll('[data-adt-model]'))row.classList.toggle('selected',row.dataset.adtModel===state.model);
  }
  function renderSelections() {
    const m=model();
    const accuracy=byId('adt761a-accuracy');accuracy.replaceChildren();
    m.accuracy.forEach(value=>addOption(accuracy,value,accuracyLabel[value]));accuracy.value=state.accuracy;
    document.querySelector('label[for="adt761a-accuracy"]').textContent=m.code==='BP'?'Published barometer accuracy (FS)':'High-range accuracy (full span)';
    const low=byId('adt761a-low');low.replaceChildren();
    const available=m.lowModules;
    byId('adt761a-low-label').hidden=available.length===0;
    low.hidden=available.length===0;
    for(const key of available){
      const item=catalog.modules[key];
      addOption(low,key,key+' · '+item.range+' · '+item.accuracy);
    }
    if(available.length){if(!available.includes(state.low))state.low=m.defaultLow;low.value=state.low;}
    setText('adt761a-module-note',m.highModule?
      'Included high module: ADT155-'+m.highModule+'. Selected low module: ADT155-'+state.low+' ('+catalog.modules[state.low].range+'). '+catalog.modules[state.low].note
      :'This barometric variant has no selectable low-pressure ADT155 module in the catalog ordering table.');
    const connection=byId('adt761a-port-panel');connection.hidden=!m.connection;
    const select=byId('adt761a-port');select.replaceChildren();
    if(m.connection){catalog.ports.forEach(item=>addOption(select,item.code,item.code+' · '+item.name));select.value=state.port;}
    setText('adt761a-port-note',m.code==='1.5K'?
      'The 761A-1.5K uses its model-specific ADT111-X-KIT manifold and matching hose kit. Confirm the port on that assembly.':
      'This connection suffix refers to the external pressure manifold, not an ADT155 module sensor port.');
  }
  function renderExtras() {
    const target=byId('adt761a-extras');target.replaceChildren();
    for(const accessory of catalog.accessories.filter(a=>a.models.includes(state.model))){
      const label=document.createElement('label');label.className='adt761a-check';
      const box=document.createElement('input');box.type='checkbox';box.checked=state.extras.has(accessory.code);box.value=accessory.code;
      box.addEventListener('change',()=>{if(box.checked)state.extras.add(accessory.code);else state.extras.delete(accessory.code);renderSummary();});
      const text=document.createElement('span');text.textContent=accessory.code+' · '+accessory.label;
      const note=document.createElement('small');note.textContent=accessory.note;text.appendChild(note);
      label.append(box,text);target.appendChild(label);
    }
  }
  function renderSummary() {
    const m=model(),low=state.low?catalog.modules[state.low]:null;
    setText('adt761a-part',code());
    setText('adt761a-fit',m.bestFor);
    setText('adt761a-summary-model','761A-'+m.code);
    setText('adt761a-summary-range',m.range);
    setText('adt761a-summary-accuracy',accuracyLabel[state.accuracy]);
    setText('adt761a-summary-high',m.highModule?'ADT155-'+m.highModule:'Integrated barometric reference');
    setText('adt761a-summary-low',low?'ADT155-'+state.low+' · '+low.range:'Not applicable');
    setText('adt761a-summary-port',m.connection?port().name:m.code==='BP'?'Factory confirmation required':'No manifold port');
    setText('adt761a-summary-extras',state.extras.size?[...state.extras].join(', '):'None selected');
    setText('adt761a-caution',notices().join(' ')+' Confirm all ratings, low-module accuracy and certificates in the latest Additel datasheet before purchase.');
  }
  function render(){renderModels();renderSelections();renderExtras();renderSummary();setText('adt761a-copy-message','');}
  function configurationText(){
    return [
      'Additel ADT761A reference configuration (not an approved quote)',
      'Part number: '+code(),
      'Model: 761A-'+state.model,
      'High-range accuracy: '+accuracyLabel[state.accuracy],
      'High module: '+(model().highModule?'ADT155-'+model().highModule:'Built-in barometric reference'),
      'Low module: '+(state.low?'ADT155-'+state.low:'N/A'),
      'Port: '+(model().connection?port().name:'Confirm applicable model connection'),
      'Additional accessories (separate order lines): '+(state.extras.size?[...state.extras].join(', '):'None'),
      'Notes: '+notices().join(' '),
      'Manufacturer datasheet: '+catalog.source.manufacturerPdf,
      'Verify with Additel or distributor before ordering.'
    ].join('\n');
  }
  async function start(){
    const response=await fetch('/additel-761a-data.json',{cache:'force-cache'});
    if(!response.ok)throw Error('761A specifications unavailable (HTTP '+response.status+')');
    catalog=await response.json();
    if(catalog.models.length!==6)throw Error('Model catalog incomplete');
    const accuracy=byId('adt761a-accuracy');
    const low=byId('adt761a-low');
    const p=byId('adt761a-port');
    accuracy.addEventListener('change',()=>{if(model().accuracy.includes(accuracy.value))state.accuracy=accuracy.value;render();});
    low.addEventListener('change',()=>{if(model().lowModules.includes(low.value))state.low=low.value;render();});
    p.addEventListener('change',()=>{if(model().connection&&catalog.ports.some(item=>item.code===p.value))state.port=p.value;render();});
    for(const button of document.querySelectorAll('[data-pick-model]')){
      button.addEventListener('click',()=>{chooseModel(button.dataset.pickModel);byId('configurator').scrollIntoView({behavior:'smooth',block:'start'});});
    }
    byId('adt761a-copy').addEventListener('click',async()=>{
      try{
        if(!navigator.clipboard?.writeText)throw Error('clipboard unavailable');
        await navigator.clipboard.writeText(configurationText());
        setText('adt761a-copy-message','Configuration copied. Manufacturer confirmation is still required.');
      }catch(_error){setText('adt761a-copy-message','Clipboard unavailable. Select and copy the ordering code above manually.');}
    });
    render();
  }
  start().catch(error=>{setText('adt761a-caution','The configuration options could not be loaded. Use the manufacturer datasheet and ordering table.');setText('adt761a-copy-message',error.message);});
})();