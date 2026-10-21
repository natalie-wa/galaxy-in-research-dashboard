import * as d3 from 'npm:d3@7.9.0';
let overlayEnabled = false;
let overlayLimit = 300;

export function featureCode(feature) {
  const p = feature.properties;
  return [p.ISO_A2_EH,p.ISO_A2,p.WB_A2].find(d=>d && /^[A-Z]{2}$/.test(d)) || (p.ADM0_A3 === 'KOS' ? 'XK' : null);
}
export function researchMap(world, countryCounts, {width=1200,institutions=[],initialCountry='All countries',initialInstitution='All institutions',selectionState,colorMax}={}) {
  const root=document.createElement('div');root.className='research-map';root.value='All countries';
  const totals=new Map(countryCounts.map(d=>[d.label,d.publications]));
  root.value=selectionState?.value ?? (initialInstitution!=='All institutions'?'institution:'+initialInstitution:world.features.some(f=>featureCode(f)===initialCountry)?initialCountry:'All countries');
  overlayEnabled=selectionState?.overlayEnabled ?? overlayEnabled;
  overlayLimit=selectionState?.overlayLimit ?? overlayLimit;
  if(root.value.startsWith('institution:'))overlayEnabled=true;
  const selectedCountry=()=>root.value.startsWith('institution:')?'All countries':root.value;
  const selectedInstitution=()=>root.value.startsWith('institution:')?root.value.slice(12):null;
  const emitSelection=()=>{if(selectionState)selectionState.value=root.value;root.dispatchEvent(new Event('input',{bubbles:true}));};
  const max=colorMax || d3.max(countryCounts,d=>d.publications) || 1;
  const color=d3.scaleSequentialLog([1,Math.max(2,max)],d3.interpolateRgbBasis(['#dce8f2','#a2bdd6','#527ea4','#25537b','#2c3143']));
  const height=580;
  const features=world.features.filter(d=>featureCode(d)!=='AQ');
  const collection={type:'FeatureCollection',features};
  const projection=d3.geoNaturalEarth1().fitExtent([[18,22],[width-18,height-22]],collection);
  const path=d3.geoPath(projection);
  const svg=d3.create('svg').attr('viewBox',`0 0 ${width} ${height}`).attr('role','group').attr('aria-label','Interactive map of publications citing Galaxy. Select a country to explore its papers.').attr('class','world-svg');
  const layer=svg.append('g');
  layer.append('path').datum(d3.geoGraticule10()).attr('d',path).attr('fill','none').attr('stroke','#dce5ee').attr('stroke-width',.45).attr('opacity',.65);
  const label=document.createElement('div');label.className='map-readout';label.setAttribute('aria-live','polite');
  const name=f=>f.properties.NAME_EN || f.properties.ADMIN || f.properties.NAME;
  const writeReadout=f=>{
    label.replaceChildren();
    const strong=document.createElement('strong');strong.textContent=f ? name(f) : 'A worldwide research community';
    const span=document.createElement('span');span.textContent=f ? `${(totals.get(featureCode(f))||0).toLocaleString()} citing publications` : 'Hover to explore · Click a country to discover its papers';
    label.append(strong,span);
  };
  writeReadout(features.find(d=>featureCode(d)===selectedCountry()));
  const paths=layer.selectAll('.country').data(features).join('path').attr('class','country').attr('d',path)
    .attr('fill',d=>totals.has(featureCode(d))?color(totals.get(featureCode(d))):'#e9edf1')
    .attr('stroke','#fff').attr('stroke-width',.55).attr('vector-effect','non-scaling-stroke')
    .attr('role','button').attr('tabindex',d=>totals.has(featureCode(d))?0:-1)
    .attr('aria-label',d=>`${name(d)}, ${(totals.get(featureCode(d))||0).toLocaleString()} citing publications`)
    .on('pointerenter',function(event,d){d3.select(this).attr('stroke','#d19e00').attr('stroke-width',1.8);writeReadout(d);})
    .on('pointerleave',function(){paint();writeReadout(features.find(d=>featureCode(d)===selectedCountry()));})
    .on('focus',function(event,d){writeReadout(d);})
    .on('click',(event,d)=>{if(!event.defaultPrevented) select(d);})
    .on('keydown',(event,d)=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();select(d);}});
  paths.append('title').text(d=>`${name(d)} · ${(totals.get(featureCode(d))||0).toLocaleString()} publications`);
  let markers, clearInstitutionButton;
  function paint(){paths.attr('stroke',d=>featureCode(d)===selectedCountry()?'#d19e00':'#fff').attr('stroke-width',d=>featureCode(d)===selectedCountry()?2.4:.55).attr('opacity',d=>selectedCountry()==='All countries'||featureCode(d)===selectedCountry()?1:.55).attr('aria-pressed',d=>String(featureCode(d)===selectedCountry()));markers?.attr('opacity',d=>selectedInstitution()?d.id===selectedInstitution()?1:.35:selectedCountry()==='All countries'||d.country_code===selectedCountry()?1:.3).attr('fill',d=>d.id===selectedInstitution()?'#25537b':'#ffd700').attr('stroke',d=>d.id===selectedInstitution()?'#ffd700':'#fff').attr('stroke-width',d=>d.id===selectedInstitution()?2:.8).attr('aria-pressed',d=>String(d.id===selectedInstitution()));if(clearInstitutionButton)clearInstitutionButton.hidden=!selectedInstitution();}
  function select(f){const code=featureCode(f);if(!totals.has(code))return;root.value=root.value===code?'All countries':code;paint();writeReadout(selectedCountry()==='All countries'?null:f);emitSelection();}
  const zoom=d3.zoom().extent([[0,0],[width,height]]).scaleExtent([1,8]).translateExtent([[0,0],[width,height]]).filter(event=>event.type!=='wheel' && (!event.button)).on('zoom',event=>{layer.attr('transform',event.transform);if(selectionState)selectionState.transform=event.transform;});
  svg.call(zoom).on('dblclick.zoom',null);
  if(selectionState?.transform)svg.call(zoom.transform,selectionState.transform);
  const controls=document.createElement('div');controls.className='map-controls';
  for(const [text,title,fn] of [['+','Zoom in',()=>svg.transition().duration(200).call(zoom.scaleBy,1.5)],['−','Zoom out',()=>svg.transition().duration(200).call(zoom.scaleBy,1/1.5)],['↺','Reset map',()=>{svg.transition().duration(200).call(zoom.transform,d3.zoomIdentity);root.value='All countries';paint();writeReadout(null);emitSelection();}]]){const b=document.createElement('button');b.type='button';b.textContent=text;b.title=title;b.setAttribute('aria-label',title);b.onclick=fn;controls.append(b);}
  const legend=document.createElement('div');legend.className='map-legend';
  const caption=document.createElement('span');caption.textContent='Citing publications';
  const ramp=document.createElement('div');ramp.className='legend-ramp';
  ramp.style.background='linear-gradient(90deg,#dce8f2,#a2bdd6,#527ea4,#25537b,#2c3143)';
  const numbers=document.createElement('div');numbers.className='legend-numbers';
  for(const n of [1,Math.max(1,Math.round(Math.sqrt(max))),max]){const s=document.createElement('span');s.textContent=n.toLocaleString();numbers.append(s);}
  const key=document.createElement('small');key.textContent='Log scale · Gray: no records in this selection';
  legend.append(caption,ramp,numbers,key);
  const picker=document.createElement('label');picker.className='country-picker';
  const dropdown=document.createElement('select');dropdown.setAttribute('aria-label','Select a country');
  const names=new Intl.DisplayNames(['en'],{type:'region'});
  const countryOptions=[...new Set([...countryCounts.map(d=>d.label),...(selectedCountry()==='All countries'?[]:[selectedCountry()])])].sort((a,b)=>names.of(a).localeCompare(names.of(b)));
  for(const code of ['All countries',...countryOptions]){const option=document.createElement('option');option.value=code;option.textContent=code==='All countries'?'All countries':names.of(code);dropdown.append(option);}
  dropdown.value=selectedCountry();
  dropdown.onchange=()=>{root.value=dropdown.value;paint();writeReadout(features.find(d=>featureCode(d)===selectedCountry()));emitSelection();};
  root.addEventListener('input',event=>{if(event.target===root)dropdown.value=selectedCountry();});
  picker.append(dropdown);
  const overlay = layer.append('g').attr('class','institution-overlay');
  const panel = document.createElement('div');panel.className='institution-panel';
  const toggleLabel = document.createElement('label');
  const checkbox = document.createElement('input');checkbox.type='checkbox';checkbox.checked=overlayEnabled;checkbox.setAttribute('aria-label','Show institutions');
  toggleLabel.append(checkbox,document.createTextNode('Show institutions'));
  const limit = document.createElement('select');limit.setAttribute('aria-label','Number of institutions to display');
  for(const n of [100,300,1000]){const option=document.createElement('option');option.value=String(n);option.textContent=`Up to ${n.toLocaleString()} institutions`;limit.append(option);}
  limit.value=String(overlayLimit);
  const status=document.createElement('small');status.setAttribute('aria-live','polite');
  const description=document.createElement('small');description.textContent='Gold dots · Click a dot to discover its papers. Ranked within the filters above.';
  function renderInstitutions(){
    const visible=overlayEnabled?institutions.slice(0,overlayLimit):[];
    const chosen=institutions.find(d=>d.id===selectedInstitution());
    if(overlayEnabled&&chosen&&!visible.includes(chosen)){if(visible.length>=overlayLimit)visible.pop();visible.push(chosen);}
    overlay.selectAll('*').remove();
    const size=d3.scaleSqrt().domain([0,d3.max(institutions,d=>d.publications)||1]).range([1.8,6.5]);
    // Large markers first so smaller neighbors remain reachable above them.
    markers=overlay.selectAll('circle').data(visible).join('circle').attr('class','institution-marker').attr('cx',d=>projection([d.longitude,d.latitude])[0]).attr('cy',d=>projection([d.longitude,d.latitude])[1])
      .attr('r',d=>size(d.publications)).attr('fill','#ffd700').attr('stroke','#fff').attr('stroke-width',.8).attr('vector-effect','non-scaling-stroke')
      .attr('tabindex',0).attr('role','button').attr('aria-label',d=>`${d.name}, ${d.publications.toLocaleString()} publications. Filter papers from this institution.`)
      .on('pointerenter focus',(event,d)=>{label.replaceChildren();const strong=document.createElement('strong');strong.textContent=d.name;const span=document.createElement('span');span.textContent=`${[d.city,d.country_code].filter(Boolean).join(', ')} · ${d.publications.toLocaleString()} publications`;label.append(strong,span);})
      .on('pointerleave blur',()=>writeReadout(features.find(d=>featureCode(d)===selectedCountry())))
      .on('click',(event,d)=>{event.stopPropagation();if(!event.defaultPrevented)selectInstitution(d);})
      .on('keydown',(event,d)=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();selectInstitution(d);}});
    markers.append('title').text(d=>`${d.name}\n${[d.city,d.country_code].filter(Boolean).join(', ')}\n${d.publications.toLocaleString()} publications`);
    limit.disabled=!overlayEnabled;
    status.textContent=overlayEnabled?`${visible.length.toLocaleString()} shown · ${institutions.length.toLocaleString()} available`:'Optional institution overlay';
    paint();
  }
  function selectInstitution(d){root.value=selectedInstitution()===d.id?'All countries':'institution:'+d.id;paint();emitSelection();}
  clearInstitutionButton=document.createElement('button');clearInstitutionButton.type='button';clearInstitutionButton.className='clear-institution';clearInstitutionButton.textContent='Clear institution ×';clearInstitutionButton.setAttribute('aria-label','Clear institution filter');
  clearInstitutionButton.onclick=()=>{root.value='All countries';paint();writeReadout(null);emitSelection();};
  checkbox.onchange=()=>{overlayEnabled=checkbox.checked;if(selectionState)selectionState.overlayEnabled=overlayEnabled;renderInstitutions();};
  limit.onchange=()=>{overlayLimit=Number(limit.value);if(selectionState)selectionState.overlayLimit=overlayLimit;renderInstitutions();};
  panel.append(toggleLabel,limit,status,description,clearInstitutionButton);renderInstitutions();
  const canvas=document.createElement('div');canvas.className='map-canvas';
  canvas.append(svg.node(),label,controls);
  const toolbar=document.createElement('div');toolbar.className='map-toolbar';
  toolbar.append(picker,panel,legend);
  root.append(canvas,toolbar);return root;
}
