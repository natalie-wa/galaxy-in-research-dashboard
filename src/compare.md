---
title: Compare research footprints
toc: false
---

```js
import {viewHref, shareView, comparisonData, comparisonView} from './components/exploration.js';
const corpus=await FileAttachment('./data/corpus.json').json();
const works=corpus.works;
const params=new URLSearchParams(window.location.search);
const comparisonState={view:params.get('view')==='fields'?'fields':'trends'};
const years=[...new Set(works.map(d=>d.year).filter(d=>d!==null))];
const fields=['All fields',...new Set(works.map(d=>d.field).sort())];
const topics=['All topics',...new Set(works.filter(d=>d.topic).map(d=>d.topic)),'Missing topic'];
const topicNames=new Map(works.filter(d=>d.topic).map(d=>[d.topic,d.topic_name]));
const regionNames=new Intl.DisplayNames(['en'],{type:'region'});
const countryName=code=>{try{return regionNames.of(code);}catch{return code;}};
const countries=[...new Set(works.flatMap(d=>d.countries))].sort((a,b)=>countryName(a).localeCompare(countryName(b)));
const institutionName=id=>corpus.institutions[id]||id;
```

<header class="brand-header"><a href="https://galaxyproject.org" aria-label="Galaxy Project home"><img src="./assets/galaxy-logo.svg" alt="Galaxy" /></a><nav aria-label="Dashboard navigation"><a href="./papers.html">All publications</a></nav></header>
<div class="hero compare-hero"><div><h1>Compare <span>research footprints</span></h1><p>Choose two countries or institutions. Compare their publication trends or research fields.</p></div></div>

```js
const state={year,period,field,topic,query,kind,left,right,view:chartMode};
display(html`<nav class="view-tabs" aria-label="Dashboard views"><a href=${viewHref('./',state)}>Overview</a><a href=${viewHref('./papers.html',state)}>Explore the publications</a><a href="./compare.html" aria-current="page">Compare</a></nav>`);
```

<div class="compare-workspace">
<div class="filter-bar compare-pickers"><div>${kindInput}</div><div>${leftInput}</div><div>${rightInput}</div></div>
<details class="compare-refine">
<summary>Refine comparison <span>${year === 'All years' ? 'All years' : period === 'cumulative' && year !== 'Missing year' ? '2006–'+year : String(year)} · ${field} · ${topicNames.get(topic)||topic}${query ? ' · Search active' : ''}</span></summary>
<div class="filter-bar compare-filter-grid"><div>${yearInput}</div><div>${periodInput}</div><div>${fieldInput}</div><div>${topicInput}</div><div>${searchInput}</div></div>
</details>
${comparison}
<div class="compare-actions">${share}<a href="./compare.html" class="reset-comparison">Reset comparison</a></div>
</div>

```js
const kindInput=Inputs.select(['country','institution'],{label:'Compare',format:d=>d==='country'?'Countries':'Institutions',value:params.get('kind')==='institution'?'institution':'country'});
const yearOptions=['All years',...years.sort((a,b)=>b-a),'Missing year'];
const yearInput=Inputs.select(yearOptions,{label:'Publication year',format:d=>String(d),value:yearOptions.find(d=>String(d)===params.get('year'))??'All years'});
const periodInput=Inputs.select(['year','cumulative'],{label:'Time window',format:d=>d==='year'?'That year':'Cumulative',value:params.get('period')==='cumulative'?'cumulative':'year'});
const fieldInput=Inputs.select(fields,{label:'Research field',value:fields.includes(params.get('field'))?params.get('field'):'All fields'});
const topicInput=Inputs.select(topics,{label:'Research topic',format:d=>topicNames.get(d)||d,value:topics.includes(params.get('topic'))?params.get('topic'):'All topics'});
const searchInput=Inputs.text({label:'Find a paper',placeholder:'Search title or DOI',value:params.get('query')||''});
```

```js
const kind=Generators.input(kindInput);
const year=Generators.input(yearInput);
const period=Generators.input(periodInput);
```

```js
const field=Generators.input(fieldInput);
const topic=Generators.input(topicInput);
const query=Generators.input(searchInput);
```

```js
const options=kind==='country'?countries:Object.keys(corpus.institutions).sort((a,b)=>institutionName(a).localeCompare(institutionName(b)));
const name=kind==='country'?countryName:institutionName;
const leftInput=Inputs.select(options,{label:'First selection',format:name,value:options.includes(params.get('left'))?params.get('left'):kind==='country'?'US':corpus.institution_locations[0]?.id||options[0]});
const rightInput=Inputs.select(options,{label:'Second selection',format:name,value:options.includes(params.get('right'))?params.get('right'):kind==='country'?'DE':corpus.institution_locations[1]?.id||options[1]});
```

```js
const left=Generators.input(leftInput);
const right=Generators.input(rightInput);
```

```js
const data=comparisonData(works,{year,period,field,topic,query,kind,left,right});
const comparison=comparisonView(data,{leftName:name(left),rightName:name(right),selectionState:comparisonState,sameSelection:left===right});
```

```js
const chartMode=Generators.input(comparison);
```

```js
const share=shareView(viewHref('./compare.html',state));
```

<footer class="brand-footer"><div><strong>Galaxy in Research</strong> · <a href="https://galaxyproject.org">Galaxy Project ↗</a></div></footer>
