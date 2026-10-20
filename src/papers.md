---
title: Explore the publications
toc: false
---

```js
import {filterWorks} from './components/metrics.js';
const corpus = await FileAttachment('./data/corpus.json').json();
const works = corpus.works;
const params = new URLSearchParams(window.location.search);
const regionNames = new Intl.DisplayNames(['en'],{type:'region'});
const countryName = code => {try{return regionNames.of(code);}catch{return code;}};
const years = ['All years', ...new Set(works.map(d=>d.year).filter(d=>d!==null).sort((a,b)=>b-a)), 'Missing year'];
const fields = ['All fields', ...new Set(works.map(d=>d.field).sort())];
const institutionOptions = ['All institutions', ...corpus.institution_locations.map(d=>d.id).sort((a,b)=>(corpus.institutions[a]||a).localeCompare(corpus.institutions[b]||b))];
const institutionName = id=>corpus.institution_locations.find(d=>d.id===id)?.name||corpus.institutions[id]||id;
const countries = ['All countries', ...new Set(works.flatMap(d=>d.countries).sort())];
```

<header class="brand-header"><a href="https://galaxyproject.org" aria-label="Galaxy Project home"><img src="./assets/galaxy-logo.svg" alt="Galaxy" /></a><nav aria-label="Dashboard navigation"><a href="./papers.html">All publications</a></nav></header>

<div class="hero"><div><div class="eyebrow">Galaxy in Research</div><h1>Explore <span>the publications</span></h1><p>Search the literature, sort the results, and follow the research.</p></div><div class="snapshot">Through 16 October 2026</div></div>

```js
const overviewHref = './?'+new URLSearchParams({year:String(year),field,query,country,institution});
display(html`<nav class="view-tabs" aria-label="Dashboard views"><a href=${overviewHref}>Overview</a><a href="./papers.html" aria-current="page">Explore the publications</a></nav>`);
```

<div class="filter-bar"><div>${yearInput}</div><div>${countryInput}</div><div>${institutionInput}</div><div>${fieldInput}</div><div>${searchInput}</div></div>

```js
const yearInput = Inputs.select(years,{label:'Publication year',format:d=>String(d),value:years.find(d=>String(d)===params.get('year'))??'All years'});
const countryInput = Inputs.select(countries,{label:'Country',format:d=>d==='All countries'?d:countryName(d),value:countries.includes(params.get('country'))?params.get('country'):'All countries'});
const institutionInput = Inputs.select(institutionOptions,{label:'Institution',format:d=>d==='All institutions'?d:institutionName(d),value:institutionOptions.includes(params.get('institution'))?params.get('institution'):'All institutions'});
const fieldInput = Inputs.select(fields,{label:'Research field',value:fields.includes(params.get('field'))?params.get('field'):'All fields'});
const searchInput = Inputs.text({label:'Find a paper',placeholder:'Search title or DOI',value:params.get('query')||''});
```

```js
const year = Generators.input(yearInput);
const country = Generators.input(countryInput);
const institution = Generators.input(institutionInput);
const field = Generators.input(fieldInput);
const query = Generators.input(searchInput);
```

```js
const selected = filterWorks(works,{year,country,field,query,institution});
```

<div class="section-top"><div><h2>${selected.length.toLocaleString()} publications</h2><p>${institution==='All institutions'?'Click a column heading to sort.':institutionName(institution)}</p></div><div class="download-button">${download}</div></div>
<div class="papers-table">${paperTable}</div>

```js
const paperTable = Inputs.table(selected.map(d=>({title:d.title,year:d.year,field:d.field,countries:d.countries.map(countryName).join('; '),link:d.doi?'https://doi.org/'+d.doi:d.url})),{columns:['title','year','field','countries','link'],header:{title:'Publication',year:'Year',field:'Research field',countries:'Countries',link:'Read'},format:{year:d=>d===null?'—':String(d),link:d=>html`<a href=${d} target="_blank" rel="noopener noreferrer">Read ↗</a>`},rows:20,sort:'year',reverse:true});
const download = Inputs.button('Download selection ↓',{reduce:()=>{const blob=new Blob([JSON.stringify(selected,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='galaxy-in-research-selection.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}});
```

<footer class="brand-footer"><div><strong>Galaxy in Research</strong> · <a href="https://galaxyproject.org">Galaxy Project ↗</a></div></footer>
