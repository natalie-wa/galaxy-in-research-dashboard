import {annual, counts, filterWorks} from './metrics.js';

const defaults={year:'All years',period:'year',field:'All fields',topic:'All topics',query:'',country:'All countries',institution:'All institutions'};
const keys=[...Object.keys(defaults),'kind','left','right','overlay','limit','view','sort','page','size'];
export function viewHref(page, state={}) {
  const params=new URLSearchParams();
  for(const key of keys) if(state[key]!=null && state[key]!=='' && String(state[key])!==String(defaults[key])) params.set(key,String(state[key]));
  return page+(params.size?'?'+params:'');
}
export function shareView(href) {
  const root=document.createElement('div');root.className='share-view';
  const button=document.createElement('button');button.type='button';button.textContent='Share this view';
  const link=document.createElement('input');link.type='text';link.readOnly=true;link.setAttribute('aria-label','Link to this view');link.hidden=true;
  const status=document.createElement('span');status.setAttribute('role','status');
  button.onclick=async()=>{
    const url=new URL(typeof href==='function'?href():href,window.location.href);link.value=url.href;
    window.history.replaceState(null,'',url.href);
    try {await window.navigator.clipboard.writeText(url.href);status.textContent='Link copied';}
    catch {link.hidden=false;link.focus();link.select();status.textContent='Copy the selected link';}
  };
  root.append(button,link,status);return root;
}

export function timeline(years,{year='All years',period='year',invalidate,interval=1500}={}) {
  const numeric=years.filter(d=>Number.isInteger(d)).sort((a,b)=>a-b);
  const root=document.createElement('div');root.className='timeline';
  const label=document.createElement('label');label.textContent='Publication year';
  const select=document.createElement('select');select.setAttribute('aria-label','Publication year');
  for(const y of ['All years',...numeric,'Missing year']){const o=document.createElement('option');o.value=String(y);o.textContent=String(y);select.append(o);}
  select.value=[...select.options].some(o=>o.value===String(year))?String(year):'All years';label.append(select);
  const modeLabel=document.createElement('label');modeLabel.textContent='Time window';
  const mode=document.createElement('select');mode.setAttribute('aria-label','Time window');
  for(const [value,text] of [['year','That year'],['cumulative','Cumulative']]){const o=document.createElement('option');o.value=value;o.textContent=text;mode.append(o);}
  mode.value=period==='cumulative'?'cumulative':'year';modeLabel.append(mode);
  const sliderLabel=document.createElement('label');sliderLabel.className='timeline-slider';sliderLabel.textContent='Move through time';
  const slider=document.createElement('input');slider.type='range';slider.min=String(numeric[0]);slider.max=String(numeric.at(-1));slider.step='1';slider.setAttribute('aria-label','Timeline year');sliderLabel.append(slider);
  const play=document.createElement('button');play.type='button';play.textContent='Play timeline';play.setAttribute('aria-pressed','false');
  const status=document.createElement('span');status.className='timeline-status';status.setAttribute('role','status');
  let timer;
  function update(){
    const y=/^\d+$/.test(select.value)?Number(select.value):select.value;
    root.value={year:y,period:mode.value};
    slider.value=Number.isInteger(y)?String(y):String(numeric.at(-1));
    slider.setAttribute('aria-valuetext',Number.isInteger(y)?String(y):y);
    status.textContent=y==='All years'?'All years, including unknown dates':y==='Missing year'?'Unknown publication dates':`${mode.value==='cumulative'?'2006–':''}${y}${y===2026?' · 2026 incomplete':''}`;
  }
  function emit(){update();root.dispatchEvent(new Event('input',{bubbles:true}));}
  function pause(){clearInterval(timer);timer=null;play.textContent='Play timeline';play.setAttribute('aria-pressed','false');}
  function advance(){
    const current=Number(select.value),index=numeric.indexOf(current);
    if(index===numeric.length-1){pause();return;}
    select.value=String(numeric[index<0?0:index+1]);emit();
  }
  select.onchange=()=>{pause();emit();};mode.onchange=()=>emit();
  slider.oninput=event=>{event.stopPropagation();pause();select.value=slider.value;emit();};
  play.onclick=()=>{
    if(timer){pause();return;}
    if(!Number.isInteger(root.value.year)||root.value.year===numeric.at(-1)){select.value=String(numeric[0]);emit();}
    play.textContent='Pause timeline';play.setAttribute('aria-pressed','true');timer=setInterval(advance,interval);
  };
  const visibility=()=>{if(document.hidden)pause();};document.addEventListener('visibilitychange',visibility);
  root.reset=()=>{pause();select.value='All years';mode.value='year';emit();};
  root.dispose=()=>{pause();document.removeEventListener('visibilitychange',visibility);};invalidate?.then(root.dispose);
  root.append(label,modeLabel,sliderLabel,play,status);update();return root;
}

export function topicExplorer(works,state={},page='./') {
  const root=document.createElement('div');root.className='topic-explorer';
  const names=new Map(works.filter(w=>w.topic).map(w=>[w.topic,w.topic_name]));
  const rows=counts(works.filter(w=>w.topic),'topic').slice(0,12);
  if(!rows.length){const p=document.createElement('p');p.textContent='No classified topics in this selection.';root.append(p);}
  for(const row of rows){
    const link=document.createElement('a');link.className='topic-card';link.href=viewHref(page,{...state,topic:row.label});
    const name=document.createElement('strong');name.textContent=names.get(row.label)||row.label;
    const value=document.createElement('span');value.textContent=`${row.publications.toLocaleString()} publications`;
    link.append(name,value);root.append(link);
  }
  const missing=works.filter(w=>!w.topic).length;
  const note=document.createElement('p');note.className='topic-note';note.textContent=`Top primary OpenAlex topics · ${missing.toLocaleString()} publications without a topic. Automated labels may be imperfect.`;
  root.append(note);return root;
}

export function comparisonData(works,{kind='country',left,right,...filters}) {
  const base=filterWorks(works,{...filters,country:'All countries',institution:'All institutions'});
  const column=kind==='institution'?'institutions':'countries';
  const a=base.filter(w=>w[column].includes(left)),b=base.filter(w=>w[column].includes(right));
  const ids=new Set(a.map(w=>w.key));
  const inWindow=d=>filters.year==='Missing year'?false:!Number.isFinite(Number(filters.year))?true:filters.period==='cumulative'?d.year<=Number(filters.year):d.year===Number(filters.year);
  return {a,b,overlap:b.filter(w=>ids.has(w.key)).length,annualA:annual(a).filter(inWindow),annualB:annual(b).filter(inWindow)};
}
export function comparisonView(data,{leftName,rightName,selectionState={},sameSelection=false}) {
  const root=document.createElement('div');root.className='comparison-view compact-comparison';
  const colors=['#25537b','#a36b00'];
  const summary=document.createElement('div');summary.className='compare-summary';
  for(const [i,name,works] of [[0,leftName,data.a],[1,rightName,data.b]]) {
    const card=document.createElement('div');card.className='compare-total';card.style.borderTopColor=colors[i];
    const title=document.createElement('h2');title.textContent=name;
    const number=document.createElement('strong');number.textContent=works.length.toLocaleString();
    const label=document.createElement('span');label.textContent='publications';card.append(title,number,label);summary.append(card);
  }
  const overlap=document.createElement('div');overlap.className='compare-overlap';
  const number=document.createElement('strong');number.textContent=data.overlap.toLocaleString();
  const label=document.createElement('span');label.textContent='shared publications';overlap.append(number,label);summary.append(overlap);root.append(summary);
  if(sameSelection){const p=document.createElement('p');p.className='empty';p.textContent='Choose two different selections for a useful comparison.';root.append(p);}
  const switcher=document.createElement('div');switcher.className='compare-switcher';switcher.setAttribute('role','group');switcher.setAttribute('aria-label','Comparison chart');
  const trends=document.createElement('section'),fieldsPanel=document.createElement('section');trends.className='compare-trends';fieldsPanel.className='compare-fields';
  const buttons=[];
  for(const [value,label] of [['trends','Publication trends'],['fields','Research fields']]) {
    const button=document.createElement('button');button.type='button';button.textContent=label;button.onclick=()=>setView(value);buttons.push([button,value]);switcher.append(button);
  }
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 760 270');svg.setAttribute('role','img');svg.setAttribute('aria-label',`Annual publication counts for ${leftName} and ${rightName}. Exact values are available in View exact counts.`);
  const start=data.annualA[0]?.year??2006,end=data.annualA.at(-1)?.year??2026;
  const x=year=>start===end?392.5:60+(year-start)/(end-start)*665;
  const max=Math.max(1,...data.annualA.map(d=>d.publications),...data.annualB.map(d=>d.publications));
  const text=(x,y,value)=>{const node=document.createElementNS(ns,'text');node.setAttribute('x',x);node.setAttribute('y',y);node.textContent=value;svg.append(node);};
  for(let i=0;i<=4;i++){const y=225-i*47.5;const line=document.createElementNS(ns,'line');for(const [k,v] of Object.entries({x1:60,x2:725,y1:y,y2:y,stroke:'#dce4ee'}))line.setAttribute(k,v);svg.append(line);text(2,y+5,Math.round(max*i/4).toLocaleString());}
  for(const year of [...new Set([start,2010,2015,2020,end])].filter(y=>y>=start&&y<=end).sort((a,b)=>a-b))text(x(year)-15,253,String(year));
  for(const [rows,color] of [[data.annualA,colors[0]],[data.annualB,colors[1]]]){
    const line=document.createElementNS(ns,'polyline');line.setAttribute('points',rows.map(d=>`${x(d.year)},${225-d.publications/max*190}`).join(' '));line.setAttribute('fill','none');line.setAttribute('stroke',color);line.setAttribute('stroke-width','3');svg.append(line);
    for(const d of rows){const dot=document.createElementNS(ns,'circle');dot.setAttribute('cx',x(d.year));dot.setAttribute('cy',225-d.publications/max*190);dot.setAttribute('r','3');dot.setAttribute('fill',color);const title=document.createElementNS(ns,'title');title.textContent=`${d.year}: ${d.publications.toLocaleString()} publications`;dot.append(title);svg.append(dot);}
  }
  trends.append(svg);
  if(!data.annualA.length){const p=document.createElement('p');p.textContent='No dated years in this window. Publication totals above include eligible unknown dates.';trends.append(p);}
  const a=new Map(counts(data.a,'field').map(d=>[d.label,d.publications])),b=new Map(counts(data.b,'field').map(d=>[d.label,d.publications]));
  const fields=[...new Set([...a.keys(),...b.keys()])].sort((x,y)=>(a.get(y)||0)+(b.get(y)||0)-(a.get(x)||0)-(b.get(x)||0)||x.localeCompare(y)).slice(0,10);
  const fieldNote=document.createElement('p');fieldNote.className='field-note';fieldNote.textContent='Top six primary fields · percentage of each selection’s publications';fieldsPanel.append(fieldNote);
  const fmt=(n,total)=>`${n.toLocaleString()} (${total?(100*n/total).toFixed(1):'0.0'}%)`;
  for(const f of fields.slice(0,6)){
    const row=document.createElement('div');row.className='compare-field-row';const heading=document.createElement('strong');heading.textContent=f;row.append(heading);
    for(const [counts,total,color,name] of [[a,data.a.length,colors[0],leftName],[b,data.b.length,colors[1],rightName]]){
      const n=counts.get(f)||0,bar=document.createElement('div');bar.className='compare-field-bar';bar.setAttribute('aria-label',`${name}: ${fmt(n,total)}`);
      const track=document.createElement('div');track.className='compare-field-track';const fill=document.createElement('div');fill.style.width=`${total?100*n/total:0}%`;fill.style.background=color;track.append(fill);
      const value=document.createElement('span');value.textContent=fmt(n,total);bar.append(track,value);row.append(bar);
    }
    fieldsPanel.append(row);
  }
  if(!fields.length){const p=document.createElement('p');p.textContent='No publications match these filters.';fieldsPanel.append(p);}
  const legend=document.createElement('div');legend.className='compact-legend';
  for(const [name,color] of [[leftName,colors[0]],[rightName,colors[1]]]){const span=document.createElement('span');span.style.color=color;span.textContent='● '+name;legend.append(span);}
  root.append(switcher,legend,trends,fieldsPanel);
  function table(headers,rows){const table=document.createElement('table'),head=document.createElement('thead'),tr=document.createElement('tr');for(const v of headers){const th=document.createElement('th');th.scope='col';th.textContent=v;tr.append(th);}head.append(tr);table.append(head);const body=document.createElement('tbody');for(const row of rows){const tr=document.createElement('tr');for(const v of row){const td=document.createElement('td');td.textContent=v;tr.append(td);}body.append(tr);}table.append(body);return table;}
  const details=document.createElement('details');details.className='compare-exact';const detailTitle=document.createElement('summary');detailTitle.textContent='View exact counts';
  const annualTable=table(['Year',leftName,rightName],data.annualA.map((r,i)=>[String(r.year),r.publications.toLocaleString(),data.annualB[i].publications.toLocaleString()]));
  const fieldTable=table(['Primary field',leftName,rightName],fields.map(f=>[f,fmt(a.get(f)||0,data.a.length),fmt(b.get(f)||0,data.b.length)]));details.append(detailTitle,annualTable,fieldTable);root.append(details);
  const note=document.createElement('p');note.className='comparison-footnote';note.textContent=`Shared publications count in both selections. Unknown years: ${leftName} ${data.a.filter(w=>w.year===null).length}; ${rightName} ${data.b.filter(w=>w.year===null).length}. 2026 is incomplete.`;root.append(note);
  function setView(view){root.value=view==='fields'?'fields':'trends';selectionState.view=root.value;trends.hidden=root.value!=='trends';fieldsPanel.hidden=root.value!=='fields';annualTable.hidden=root.value!=='trends';fieldTable.hidden=root.value!=='fields';for(const [button,value] of buttons)button.setAttribute('aria-pressed',String(root.value===value));root.dispatchEvent(new Event('input',{bubbles:true}));}
  setView(selectionState.view);return root;
}

export function resetOverview({timeline,fieldInput,topicInput,searchInput,map}) {
  const button=document.createElement('button');button.type='button';button.className='reset-overview';button.textContent='Reset map & filters';
  button.onclick=()=>{
    timeline.reset();
    for(const form of [fieldInput,topicInput]){const select=form.querySelector('select');select.selectedIndex=0;select.dispatchEvent(new Event('input',{bubbles:true}));}
    const search=searchInput.querySelector('input');search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));
    map.resetAll();
    const url=new URL(window.location.href);url.search='';url.hash='';window.history.replaceState(null,'',url.href);
    button.textContent='Reset complete';setTimeout(()=>{button.textContent='Reset map & filters';},1500);
  };
  return button;
}
