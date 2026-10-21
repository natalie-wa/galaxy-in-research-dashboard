---
title: Compare research footprints
toc: false
---

```js
import {timeline, viewHref, shareView, comparisonData, comparisonView} from './components/exploration.js';
const corpus=await FileAttachment('./data/corpus.json').json();
const works=corpus.works;
const params=new URLSearchParams(window.location.search);
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
<div class="hero"><div><div class="eyebrow">Galaxy in Research</div><h1>Compare <span>research footprints</span></h1><p>Explore publication trends and research fields side by side.</p></div><div class="snapshot">Through 16 October 2026</div></div>

```js
const state={year,period,field,topic,query,kind,left,right};
display(html`<nav class="view-tabs" aria-label="Dashboard views"><a href=${viewHref('./',state)}>Overview</a><a href=${viewHref('./papers.html',state)}>Explore the publications</a><a href="./compare.html" aria-current="page">Compare</a></nav>`);
```

<div class="filter-bar"><div>${kindInput}</div><div>${leftInput}</div><div>${rightInput}</div></div>
${yearInput}
<div class="filter-bar"><div>${fieldInput}</div><div>${topicInput}</div><div>${searchInput}</div></div>

```js
const kindInput=Inputs.select(['country','institution'],{label:'Compare',format:d=>d==='country'?'Countries':'Institutions',value:params.get('kind')==='institution'?'institution':'country'});
const yearInput=timeline(years,{year:params.get('year')||'All years',period:params.get('period'),invalidate:invalidation});
const fieldInput=Inputs.select(fields,{label:'Research field',value:fields.includes(params.get('field'))?params.get('field'):'All fields'});
const topicInput=Inputs.select(topics,{label:'Research topic',format:d=>topicNames.get(d)||d,value:topics.includes(params.get('topic'))?params.get('topic'):'All topics'});
const searchInput=Inputs.text({label:'Find a paper',placeholder:'Search title or DOI',value:params.get('query')||''});
```

```js
const kind=Generators.input(kindInput);
const time=Generators.input(yearInput);
```

```js
const year=time.year;
const period=time.period;
const field=Generators.input(fieldInput);
const topic=Generators.input(topicInput);
const query=Generators.input(searchInput);
```

```js
const options=kind==='country'?countries:Object.keys(corpus.institutions).sort((a,b)=>institutionName(a).localeCompare(institutionName(b)));
const name=kind==='country'?countryName:institutionName;
const leftInput=Inputs.select(options,{label:'First selection',format:name,value:options.includes(params.get('left'))?params.get('left'):kind==='country'?'US':options[0]});
const rightInput=Inputs.select(options,{label:'Second selection',format:name,value:options.includes(params.get('right'))?params.get('right'):kind==='country'?'DE':options[1]});
```

```js
const left=Generators.input(leftInput);
const right=Generators.input(rightInput);
```

```js
const data=comparisonData(works,{year,period,field,topic,query,kind,left,right});
display(shareView(viewHref('./compare.html',state)));
display(comparisonView(data,{leftName:name(left),rightName:name(right)}));
```

<footer class="brand-footer"><div><strong>Galaxy in Research</strong> · <a href="https://galaxyproject.org">Galaxy Project ↗</a></div></footer>
