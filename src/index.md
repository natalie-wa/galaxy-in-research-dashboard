---
title: Galaxy in Research
toc: false
---

```js
import * as Plot from 'npm:@observablehq/plot@0.6.17';
import {filterWorks, counts, annual} from './components/metrics.js';
import {researchMap} from './components/map.js';
import {paperCarousel} from './components/papers.js';
import {disciplineChart} from './components/disciplines.js';
const corpus = await FileAttachment('./data/corpus.json').json();
const world = await FileAttachment('./assets/world.geojson').json();
const works = corpus.works;
const mapState = {value:null};
const params = new URLSearchParams(window.location.search);
const regionNames = new Intl.DisplayNames(['en'], {type:'region'});
const countryName = code => {try {return regionNames.of(code);} catch {return code;}};
const years = ['All years', ...Array.from(new Set(works.map(d=>d.year).filter(d=>d!==null))).sort((a,b)=>b-a), 'Missing year'];
const fields = ['All fields', ...new Set(works.map(d=>d.field).sort())];
```

<header class="brand-header"><a href="https://galaxyproject.org" aria-label="Galaxy Project home"><img src="./assets/galaxy-logo.svg" alt="Galaxy" /></a><nav aria-label="Dashboard navigation"><a href="./papers.html">All publications</a></nav></header>

<div class="hero"><div><div class="eyebrow">A global community of discovery</div><h1>Galaxy in <span>Research</span></h1><p>Explore the places, people, and publications connected through Galaxy.</p></div><div class="snapshot">Through 16 October 2026</div></div>

```js
const explorerHref = './papers.html?'+new URLSearchParams({year:String(year),field,query,country,institution});
display(html`<nav class="view-tabs" aria-label="Dashboard views"><a href="./" aria-current="page">Overview</a><a href=${explorerHref}>Explore the publications</a></nav>`);
```

<div class="filter-bar">
<div>${yearInput}</div><div>${fieldInput}</div><div>${searchInput}</div>
</div>

```js
const yearInput = Inputs.select(years, {label:'Publication year', format:d=>String(d), value:years.find(d=>String(d)===params.get('year'))??'All years'});
const fieldInput = Inputs.select(fields, {label:'Research field', value:fields.includes(params.get('field'))?params.get('field'):'All fields'});
const searchInput = Inputs.text({label:'Find a paper', placeholder:'Search title or DOI', value:params.get('query')||''});
```

```js
const year = Generators.input(yearInput);
const field = Generators.input(fieldInput);
const query = Generators.input(searchInput);
```

```js
const base = filterWorks(works, {year,field,query});
const allCountryCounts = counts(base, 'countries');
const baseInstitutionCounts = new Map(counts(base, 'institutions').map(d=>[d.label,d.publications]));
const mapInstitutions = corpus.institution_locations.map(d=>({...d,publications:baseInstitutionCounts.get(d.id)||0})).filter(d=>d.publications>0).sort((a,b)=>b.publications-a.publications||a.id.localeCompare(b.id));
const map = researchMap(world, allCountryCounts, {institutions:mapInstitutions,initialCountry:params.get('country')||'All countries',initialInstitution:params.get('institution')||'All institutions',selectionState:mapState});
```

```js
const mapSelection = Generators.input(map);
```

```js
const institution = mapSelection.startsWith('institution:')?mapSelection.slice(12):'All institutions';
const country = institution==='All institutions'?mapSelection:'All countries';
const selected = filterWorks(base, {country,institution});
const countryCounts = counts(selected, 'countries');
const institutionCounts = counts(selected, 'institutions');
const currentPlace = institution!=='All institutions'?(corpus.institution_locations.find(d=>d.id===institution)?.name||corpus.institutions[institution]||'Selected institution'):country==='All countries'?'Around the world':countryName(country);
```

<div class="stats">
<div class="stat"><strong>${selected.length.toLocaleString()}</strong><span>Citing publications</span></div>
<div class="stat"><strong>${countryCounts.length.toLocaleString()}</strong><span>Countries represented</span></div>
<div class="stat"><strong>${institutionCounts.length.toLocaleString()}</strong><span>Institutions represented</span></div>
<div class="stat"><strong>${new Set(selected.filter(d=>d.field!=='Unclassified').map(d=>d.field)).size}</strong><span>Research fields</span></div>
</div>

<div class="section-top" id="world"><div><h2>Research without borders</h2><p>Select a country or institution dot to discover its publications. Zoom in and drag to explore.</p></div><span class="section-label">${allCountryCounts.length} countries · ${base.length.toLocaleString()} publications</span></div>

<div class="map-shell">${map}</div>
<p class="map-caption">Publications by author country. Colors reflect the filters above; selecting a country or institution filters the views below.</p>

<div class="section-top" id="papers"><div><div class="eyebrow">Discover the literature</div><h2>${currentPlace}</h2><p>Browse the papers, then follow a link to read more.</p></div><span class="section-label">${selected.length.toLocaleString()} publications</span></div>

```js
display(paperCarousel(selected, {invalidate:invalidation}));
if(!selected.length) display(html`<p class="empty" role="status">No papers match these filters. Broaden the selection or clear your search.</p>`);
```

<div class="chart-grid">
<div class="chart-card">

## Research over time

```js
const temporal = annual(selected);
display(Plot.plot({height:235,width:620,marginLeft:50,style:{fontFamily:'Atkinson, sans-serif',fontSize:13},x:{label:null,tickFormat:d=>String(d),ticks:6},y:{label:null,grid:true},marks:[Plot.ruleY([0]),Plot.rectY(temporal,{x:'year',y:'publications',interval:1,fill:d=>d.year===2026?'#d19e00':'#25537b',tip:true})]}));
```

<p>Gold marks the partial year 2026. ${selected.length-temporal.reduce((n,d)=>n+d.publications,0)} records have missing years.</p>

</div>
<div class="chart-card">

## Across disciplines

```js
display(disciplineChart(counts(selected,'field').slice(0,7)));
```

<p>Top primary OpenAlex fields in this selection.</p>

</div>
</div>

<footer class="brand-footer"><div><strong>Galaxy in Research</strong> · <a href="https://galaxyproject.org">Galaxy Project ↗</a></div></footer>
