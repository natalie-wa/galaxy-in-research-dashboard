---
title: Explore the publications
toc: false
---

```js
import {filterWorks} from './components/metrics.js';
import {viewHref, shareView} from './components/exploration.js';
import {publicationBrowser} from './components/publications.js';
const corpus = await FileAttachment('./data/corpus.json').json();
const works = corpus.works;
const params = new URLSearchParams(window.location.search);
const browserState={sort:params.get('sort'),page:Number(params.get('page')),size:Number(params.get('size'))};
const regionNames = new Intl.DisplayNames(['en'],{type:'region'});
const countryName = code => {try{return regionNames.of(code);}catch{return code;}};
const years = ['All years', ...new Set(works.map(d=>d.year).filter(d=>d!==null).sort((a,b)=>b-a)), 'Missing year'];
const topics=['All topics',...new Set(works.filter(d=>d.topic).map(d=>d.topic)),'Missing topic'];
const topicNames=new Map(works.filter(d=>d.topic).map(d=>[d.topic,d.topic_name]));
const fields = ['All fields', ...new Set(works.map(d=>d.field).sort())];
const institutionOptions = ['All institutions', ...Object.keys(corpus.institutions).sort((a,b)=>(corpus.institutions[a]||a).localeCompare(corpus.institutions[b]||b))];
const institutionName = id=>corpus.institution_locations.find(d=>d.id===id)?.name||corpus.institutions[id]||id;
const countries = ['All countries', ...new Set(works.flatMap(d=>d.countries).sort())];
```

<header class="brand-header"><a href="https://galaxyproject.org" aria-label="Galaxy Project home"><img src="./assets/galaxy-logo.svg" alt="Galaxy" /></a><nav aria-label="Dashboard navigation"><a href="./papers.html">All publications</a></nav></header>

<div class="hero publications-hero"><div><h1>Explore <span>the publications</span></h1><p>Search the literature, sort the results, and follow the research.</p></div></div>

```js
const state={year,period,field,topic,query,country,institution,...resultSettings};
const overviewHref = viewHref('./',state);
const compareHref = viewHref('./compare.html',state);
display(html`<nav class="view-tabs" aria-label="Dashboard views"><a href=${overviewHref}>Overview</a><a href="./papers.html" aria-current="page">Explore the publications</a><a href=${compareHref}>Compare</a></nav>`);
```

<div class="publications-workspace">
<div class="publications-search"><div>${searchInput}</div><a href="./papers.html" class="reset-publications">Reset search &amp; filters</a></div>
<details class="publications-refine">
<summary>Filter publications <span>${year === 'All years' ? 'All years' : period === 'cumulative' && year !== 'Missing year' ? '2006–'+year : String(year)} · ${country==='All countries'?country:countryName(country)} · ${institution==='All institutions'?institution:institutionName(institution)}${field!=='All fields'?' · '+field:''}${topic!=='All topics'?' · '+(topicNames.get(topic)||topic):''}</span></summary>
<div class="filter-bar publication-filter-grid"><div>${yearInput}</div><div>${periodInput}</div><div>${countryInput}</div><div>${institutionInput}</div><div>${fieldInput}</div><div>${topicInput}</div></div>
</details>
<div class="publication-results-heading"><h2>${selected.length.toLocaleString()} publications</h2><div class="publication-actions">${share}<div class="download-button">${download}</div></div></div>
${paperResults}
</div>

```js
const yearInput = Inputs.select(years,{label:'Publication year',format:d=>String(d),value:years.find(d=>String(d)===params.get('year'))??'All years'});
const periodInput=Inputs.select(['year','cumulative'],{label:'Time window',format:d=>d==='year'?'That year':'Cumulative',value:params.get('period')==='cumulative'?'cumulative':'year'});
const topicInput = Inputs.select(topics,{label:'Research topic',format:d=>topicNames.get(d)||d,value:topics.includes(params.get('topic'))?params.get('topic'):'All topics'});
const countryInput = Inputs.select(countries,{label:'Country',format:d=>d==='All countries'?d:countryName(d),value:countries.includes(params.get('country'))?params.get('country'):'All countries'});
const institutionInput = Inputs.select(institutionOptions,{label:'Institution',format:d=>d==='All institutions'?d:institutionName(d),value:institutionOptions.includes(params.get('institution'))?params.get('institution'):'All institutions'});
const fieldInput = Inputs.select(fields,{label:'Research field',value:fields.includes(params.get('field'))?params.get('field'):'All fields'});
const searchInput = Inputs.text({label:'Find a paper',placeholder:'Search title or DOI',value:params.get('query')||''});
```

```js
const year=Generators.input(yearInput);
const period=Generators.input(periodInput);
```

```js
const topic=Generators.input(topicInput);
const country = Generators.input(countryInput);
const institution = Generators.input(institutionInput);
const field = Generators.input(fieldInput);
const query = Generators.input(searchInput);
```

```js
const selected = filterWorks(works,{year,period,country,field,topic,query,institution});
```

```js
const paperResults=publicationBrowser(selected,{countryName,institutionName,selectionState:browserState,filterKey:JSON.stringify({year,period,country,field,topic,query,institution})});
```

```js
const resultSettings=Generators.input(paperResults);
```

```js
const share=shareView(viewHref('./papers.html',state));
const download = Inputs.button('Download JSON',{reduce:()=>{const blob=new Blob([JSON.stringify(selected,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='galaxy-in-research-selection.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}});
```

<footer class="brand-footer"><div><strong>Galaxy in Research</strong> · <a href="https://galaxyproject.org">Galaxy Project ↗</a></div></footer>
