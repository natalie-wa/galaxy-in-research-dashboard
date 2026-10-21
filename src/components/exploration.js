import {annual, counts, filterWorks} from './metrics.js';

const defaults={year:'All years',period:'year',field:'All fields',topic:'All topics',query:'',country:'All countries',institution:'All institutions'};
const keys=[...Object.keys(defaults),'kind','left','right','overlay','limit'];
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
export function comparisonView(data,{leftName,rightName}) {
  const root=document.createElement('div');root.className='comparison-view';
  const cards=document.createElement('div');cards.className='comparison-cards';
  for(const [name,works,color] of [[leftName,data.a,'#25537b'],[rightName,data.b,'#a36b00']]){
    const card=document.createElement('div');card.className='comparison-card';card.style.borderTopColor=color;
    const title=document.createElement('h2');title.textContent=name;
    const number=document.createElement('strong');number.textContent=works.length.toLocaleString();
    const note=document.createElement('p');note.textContent=`publications · ${works.filter(w=>w.year===null).length} with unknown years`;
    card.append(title,number,note);cards.append(card);
  }
  root.append(cards);
  if(leftName===rightName){const p=document.createElement('p');p.className='empty';p.textContent='Choose two different places to compare.';root.append(p);}
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 760 290');svg.setAttribute('role','img');svg.setAttribute('aria-label',`Annual publication counts: ${leftName} and ${rightName}. Values are available in the table below.`);
  const start=data.annualA[0]?.year??2006,end=data.annualA.at(-1)?.year??2026;
  const x=year=>start===end?392.5:60+(year-start)/(end-start)*665;
  const max=Math.max(1,...data.annualA.map(d=>d.publications),...data.annualB.map(d=>d.publications));
  function line(x1,y1,x2,y2,stroke){const n=document.createElementNS(ns,'line');for(const [k,v] of Object.entries({x1,y1,x2,y2,stroke}))n.setAttribute(k,v);svg.append(n);}
  function text(x,y,value){const n=document.createElementNS(ns,'text');n.setAttribute('x',x);n.setAttribute('y',y);n.textContent=value;svg.append(n);}
  for(let i=0;i<=4;i++){const y=235-i*50;line(60,y,725,y,'#dce4ee');text(4,y+5,Math.round(max*i/4).toLocaleString());}
  for(const year of [...new Set([start,2010,2015,2020,end])].filter(y=>y>=start&&y<=end).sort((a,b)=>a-b))text(x(year)-15,265,String(year));
  for(const [rows,color] of [[data.annualA,'#25537b'],[data.annualB,'#a36b00']]){
    const n=document.createElementNS(ns,'polyline');n.setAttribute('points',rows.map(d=>`${x(d.year)},${235-d.publications/max*200}`).join(' '));n.setAttribute('fill','none');n.setAttribute('stroke',color);n.setAttribute('stroke-width','3');svg.append(n);
    for(const d of rows){const dot=document.createElementNS(ns,'circle');dot.setAttribute('cx',x(d.year));dot.setAttribute('cy',235-d.publications/max*200);dot.setAttribute('r','3');dot.setAttribute('fill',color);const title=document.createElementNS(ns,'title');title.textContent=`${d.year}: ${d.publications.toLocaleString()} publications`;dot.append(title);svg.append(dot);}
  }
  root.append(svg);
  const legend=document.createElement('p');legend.className='comparison-legend';
  for(const [name,color] of [[leftName,'#25537b'],[rightName,'#a36b00']]){const span=document.createElement('span');span.style.color=color;span.textContent='● '+name;legend.append(span);}
  root.append(legend);
  const note=document.createElement('p');note.textContent=`${data.overlap.toLocaleString()} publications are shared by both selections and counted in each. 2026 is incomplete. Counts reflect the active time, field, topic, and search filters.`;root.append(note);
  function table(headers,rows){const table=document.createElement('table');const head=document.createElement('thead'),tr=document.createElement('tr');for(const v of headers){const th=document.createElement('th');th.scope='col';th.textContent=v;tr.append(th);}head.append(tr);table.append(head);const body=document.createElement('tbody');for(const row of rows){const tr=document.createElement('tr');for(const v of row){const td=document.createElement('td');td.textContent=v;tr.append(td);}body.append(tr);}table.append(body);return table;}
  const a=new Map(counts(data.a,'field').map(d=>[d.label,d.publications])),b=new Map(counts(data.b,'field').map(d=>[d.label,d.publications]));
  const fields=[...new Set([...a.keys(),...b.keys()])].sort((x,y)=>(a.get(y)||0)+(b.get(y)||0)-(a.get(x)||0)-(b.get(x)||0)).slice(0,10);
  const heading=document.createElement('h2');heading.textContent='Research field composition';root.append(heading);
  const fmt=(n,total)=>`${n.toLocaleString()} (${total?(100*n/total).toFixed(1):'0.0'}%)`;
  const wrap=document.createElement('div');wrap.className='comparison-table';wrap.append(table(['Primary field',leftName,rightName],fields.map(f=>[f,fmt(a.get(f)||0,data.a.length),fmt(b.get(f)||0,data.b.length)])));root.append(wrap);
  const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Annual counts as a table';details.append(summary,table(['Year',leftName,rightName],data.annualA.map((r,i)=>[String(r.year),r.publications.toLocaleString(),data.annualB[i].publications.toLocaleString()])));root.append(details);
  return root;
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
