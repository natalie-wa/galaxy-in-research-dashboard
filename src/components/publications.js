export function sortedPublications(works,sort='newest') {
  return [...works].sort((a,b)=>{
    if(sort==='title')return a.title.localeCompare(b.title)||a.key.localeCompare(b.key);
    if(a.year===null&&b.year!==null)return 1;
    if(b.year===null&&a.year!==null)return -1;
    return (sort==='oldest'?(a.year??0)-(b.year??0):(b.year??0)-(a.year??0))||a.title.localeCompare(b.title)||a.key.localeCompare(b.key);
  });
}
export function publicationBrowser(works,{countryName=code=>code,institutionName=id=>id,selectionState={},filterKey=''}={}) {
  if(selectionState.filterKey!==undefined&&selectionState.filterKey!==filterKey)selectionState.page=1;
  selectionState.filterKey=filterKey;
  const root=document.createElement('section');root.className='publication-browser';root.setAttribute('aria-label','Publication results');
  const toolbar=document.createElement('div');toolbar.className='publication-tools';
  const makeSelect=(label,options)=>{const l=document.createElement('label');l.textContent=label;const s=document.createElement('select');s.setAttribute('aria-label',label);for(const [value,name] of options){const o=document.createElement('option');o.value=String(value);o.textContent=name;s.append(o);}l.append(s);return [l,s];};
  const [sortLabel,sort]=makeSelect('Sort results',[['newest','Newest first'],['oldest','Oldest first'],['title','Title A–Z']]);sort.value=['newest','oldest','title'].includes(selectionState.sort)?selectionState.sort:'newest';
  const [sizeLabel,size]=makeSelect('Per page',[[10,'10'],[25,'25'],[50,'50']]);size.value=[10,25,50].includes(Number(selectionState.size))?String(selectionState.size):'10';
  const position=document.createElement('span');position.className='publication-position';position.setAttribute('role','status');toolbar.append(position,sortLabel,sizeLabel);
  const list=document.createElement('div');list.className='publication-results';list.tabIndex=0;list.setAttribute('role','region');list.setAttribute('aria-label','Scrollable publication results');
  const pager=document.createElement('div');pager.className='publication-pagination';
  const previous=document.createElement('button');previous.type='button';previous.textContent='← Previous';previous.setAttribute('aria-label','Previous page of publications');
  const next=document.createElement('button');next.type='button';next.textContent='Next →';next.setAttribute('aria-label','Next page of publications');
  const pageLabel=document.createElement('span');pager.append(previous,pageLabel,next);
  let page=Math.max(1,Number(selectionState.page)||1);
  function render(){
    const rows=sortedPublications(works,sort.value),perPage=Number(size.value),pages=Math.max(1,Math.ceil(rows.length/perPage));page=Math.min(page,pages);list.replaceChildren();
    const start=(page-1)*perPage;
    for(const work of rows.slice(start,start+perPage)){
      const article=document.createElement('article');article.className='publication-result';
      const meta=document.createElement('div');meta.className='publication-result-meta';meta.textContent=`${work.year===null?'Year unknown':work.year} · ${work.type||'Publication'} · ${work.field}`;
      const title=document.createElement('h2'),link=document.createElement('a');link.href=work.doi?'https://doi.org/'+work.doi:work.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=work.title;title.append(link);
      const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Publication details';details.append(summary);
      const dl=document.createElement('dl');
      for(const [name,value] of [['Research topic',work.topic_name||'Unclassified topic'],['Countries',work.countries.length?work.countries.map(countryName).join('; '):'Not recorded'],['Institutions',work.institutions.length?work.institutions.map(institutionName).join('; '):'Not recorded'],['DOI',work.doi||'Not recorded']]){
        const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=name;dd.textContent=value;dl.append(dt,dd);
      }
      details.append(dl);article.append(meta,title,details);list.append(article);
    }
    if(!rows.length){const empty=document.createElement('p');empty.className='empty';empty.textContent='No publications match. Try a broader search or reset the filters.';list.append(empty);}
    position.textContent=rows.length?`${(start+1).toLocaleString()}–${Math.min(start+perPage,rows.length).toLocaleString()} of ${rows.length.toLocaleString()}`:'0 results';
    pageLabel.textContent=rows.length?`Page ${page.toLocaleString()} of ${pages.toLocaleString()}`:'No pages';previous.disabled=page<=1||!rows.length;next.disabled=page>=pages||!rows.length;
    Object.assign(selectionState,{page,size:perPage,sort:sort.value});root.value={page,size:perPage,sort:sort.value};
    root.dispatchEvent(new Event('input',{bubbles:true}));
  }
  sort.onchange=()=>{page=1;render();list.scrollTop=0;};size.onchange=()=>{page=1;render();list.scrollTop=0;};
  previous.onclick=()=>{page--;render();list.scrollTop=0;};next.onclick=()=>{page++;render();list.scrollTop=0;};
  root.append(toolbar,list,pager);render();return root;
}
