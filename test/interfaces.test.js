import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {paperCarousel} from '../src/components/papers.js';
import {disciplineChart} from '../src/components/disciplines.js';
const dom=new JSDOM('<!doctype html><html><body></body></html>',{pretendToBeVisual:true});
globalThis.document=dom.window.document;globalThis.window=dom.window;globalThis.Event=dom.window.Event;
const source=fs.readFileSync(new URL('../src/components/map.js',import.meta.url),'utf8').replace("'npm:d3@7.9.0'",JSON.stringify(new URL('../node_modules/d3/src/index.js',import.meta.url).href));
const {researchMap,featureCode}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const world=JSON.parse(fs.readFileSync(new URL('../src/assets/world.geojson',import.meta.url)));
const corpus=JSON.parse(fs.readFileSync(new URL('../src/data/corpus.json',import.meta.url)));
test('map matches every corpus country to a country feature',()=>{
 const codes=new Set(world.features.map(featureCode));
 const countries=new Set(corpus.works.flatMap(d=>d.countries));
 assert.deepEqual([...countries].filter(d=>!codes.has(d)),[]);
});
test('map selection and reset dispatch selected country',()=>{
 const map=researchMap(world,[{label:'US',publications:20},{label:'DE',publications:5}]);
 let updates=0;map.addEventListener('input',()=>updates++);
 const dropdown=map.querySelector('select');dropdown.value='DE';dropdown.dispatchEvent(new dom.window.Event('change'));
 assert.equal(map.value,'DE');assert.equal(map.querySelectorAll('[aria-pressed="true"]').length,1);
 // Test the same click handler used by pointer selection without requiring SVG browser layout.
 const us=[...map.querySelectorAll('.country')].find(d=>d.__data__.properties.ISO_A2_EH==='US');
 us.dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true}));assert.equal(map.value,'US');assert.equal(dropdown.value,'US');assert.equal(updates,2);
 for(const p of map.querySelectorAll('.country'))assert.ok(!/NaN/.test(p.getAttribute('d')));

});
test('empty map remains renderable and offers reset selection',()=>{
 const map=researchMap(world,[]);assert.equal(map.value,'All countries');assert.equal(map.querySelector('select').options.length,1);
});
test('paper carousel moves through results, links to DOI, and handles empty results',()=>{
 const works=corpus.works.slice(0,8);const carousel=paperCarousel(works);
 const first=carousel.querySelector('h3').textContent;
 carousel.querySelector('[aria-label="Next publications"]').click();assert.notEqual(carousel.querySelector('h3').textContent,first);
 assert.equal(carousel.querySelectorAll('article').length,5);
 for(const a of carousel.querySelectorAll('article a'))assert.match(a.href,/^https:\/\/(doi\.org|openalex\.org)\//);
 assert.match(paperCarousel([]).textContent,/No papers match/);
});
test('year dropdown and table explicitly use plain year strings',()=>{
 const page=fs.readFileSync(new URL('../src/index.md',import.meta.url),'utf8');
 assert.ok(page.includes('timeline(years'));
 assert.ok(fs.readFileSync(new URL('../src/papers.md',import.meta.url),'utf8').includes('format:d=>String(d)'));
});

test('dashboard excludes all dated records through 2005 and retains unknown years',()=>{
 assert.equal(corpus.works.length,14469);
 assert.ok(corpus.works.every(d=>d.year===null||d.year>=2006));
 assert.equal(corpus.works.filter(d=>d.year===null).length,2);
 assert.equal(corpus.manifest.exclusions.length,6);
 assert.equal(corpus.manifest.citation_relationships,18418);
 assert.ok(corpus.manifest.exclusions.every(d=>!corpus.works.some(w=>w.key===d.key)));
});
test('discipline labels remain complete outside SVG clipping',()=>{
 const label='Biochemistry, Genetics and Molecular Biology';
 const chart=disciplineChart([{label,publications:1234}]);
 assert.equal(chart.querySelector('.discipline-label').textContent,label);
 assert.equal(chart.querySelector('strong').textContent,'1,234');
 assert.equal(chart.querySelector('svg'),null);
 assert.equal(disciplineChart([]).querySelectorAll('.discipline-row').length,0);
});
test('institution locations are finite, matched to corpus IDs, and use corpus counts',()=>{
 const ids=new Set(corpus.works.flatMap(d=>d.institutions));
 assert.equal(corpus.institution_locations.length,1000);
 for(const d of corpus.institution_locations){
  assert.ok(ids.has(d.id));assert.ok(Number.isFinite(d.latitude)&&Math.abs(d.latitude)<=90);assert.ok(Number.isFinite(d.longitude)&&Math.abs(d.longitude)<=180);
  assert.equal(d.snapshot_publications,corpus.works.filter(w=>w.institutions.includes(d.id)).length);
 }
});
test('institution overlay toggles and respects the chosen limit',()=>{
 const institutions=corpus.institution_locations.map(d=>({...d,publications:d.snapshot_publications}));
 const map=researchMap(world,[{label:'US',publications:100}],{institutions});
 document.body.append(map);
 const checkbox=map.querySelector('[aria-label="Show institutions"]');
 assert.equal(map.querySelectorAll('.institution-marker').length,0);
 checkbox.click();assert.equal(map.querySelectorAll('.institution-marker').length,300);
 const limit=map.querySelector('[aria-label="Number of institutions to display"]');
 limit.value='100';limit.dispatchEvent(new Event('change'));assert.equal(map.querySelectorAll('.institution-marker').length,100);
 for(const dot of map.querySelectorAll('.institution-marker')){assert.ok(Number.isFinite(Number(dot.getAttribute('cx'))));assert.ok(Number.isFinite(Number(dot.getAttribute('cy'))));assert.equal(dot.closest('a'),null);}
 checkbox.click();assert.equal(map.querySelectorAll('.institution-marker').length,0);map.remove();
});

test('literature scrolling is automatic, recyclable, and pausable',()=>{
 const carousel=paperCarousel(corpus.works.slice(0,8));
 assert.equal(carousel.dataset.scrolling,'true');
 const before=carousel.querySelector('h3').textContent;
 carousel.querySelector('.paper-track').dispatchEvent(new Event('animationiteration'));
 assert.notEqual(carousel.querySelector('h3').textContent,before);
 carousel.querySelector('[aria-label="Pause automatic scrolling"]').click();
 assert.equal(carousel.dataset.scrolling,'false');
 const pausedTitle=carousel.querySelector('h3').textContent;
 carousel.querySelector('.paper-track').dispatchEvent(new Event('animationiteration'));
 assert.equal(carousel.querySelector('h3').textContent,pausedTitle);
});
test('dense paper table has its own view and footer disclaimer is absent',()=>{
 const overview=fs.readFileSync(new URL('../src/index.md',import.meta.url),'utf8');
 const papers=fs.readFileSync(new URL('../src/papers.md',import.meta.url),'utf8');
 assert.ok(!overview.includes('publicationBrowser('));assert.ok(papers.includes('publicationBrowser('));
 assert.ok(overview.includes('explorerHref'));assert.ok(papers.includes('overviewHref'));
 for(const page of [overview,papers])assert.ok(!page.includes('Citations do not establish platform use'));
});

test('institution dot selects affiliated papers, persists across filters, and clears',()=>{
 const locations=corpus.institution_locations.slice(0,4).map(d=>({...d,publications:d.snapshot_publications}));
 const selectionState={value:null};
 const map=researchMap(world,[{label:'US',publications:100}],{institutions:locations,selectionState});
 document.body.append(map);
 const toggle=map.querySelector('[aria-label="Show institutions"]');if(!toggle.checked)toggle.click();
 const dot=map.querySelector('.institution-marker');const id=dot.__data__.id;
 dot.dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true}));
 assert.equal(map.value,'institution:'+id);assert.equal(selectionState.value,map.value);
 assert.equal(dot.getAttribute('aria-pressed'),'true');assert.equal(dot.closest('a'),null);
 const second=researchMap(world,[],{institutions:[],selectionState});
 assert.equal(second.value,map.value); // An empty filtered subset must not erase the selection.
 second.querySelector('[aria-label="Clear institution filter"]').click();
 assert.equal(second.value,'All countries');assert.equal(selectionState.value,'All countries');
 dot.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
 assert.equal(map.value,'All countries');
 map.remove();
});

test('map tools live below the canvas and shared zero-result country selections survive',()=>{
 const map=researchMap(world,[],{initialCountry:'US',colorMax:5000,selectionState:{value:null}});
 assert.equal(map.value,'US');assert.equal(map.querySelector('[aria-label="Select a country"]').value,'US');
 assert.equal(map.querySelector('.map-canvas .institution-panel'),null);
 assert.ok(map.querySelector('.map-toolbar .institution-panel'));
 assert.ok(map.querySelector('.map-toolbar .map-legend'));
 assert.match(map.querySelector('.legend-numbers').textContent,/5,000/);
});

test('reset all clears institution selection, markers, and persistent map state',()=>{
 const selectionState={value:'institution:'+corpus.institution_locations[0].id,overlayEnabled:true,overlayLimit:100};
 const locations=corpus.institution_locations.slice(0,3).map(d=>({...d,publications:d.snapshot_publications}));
 const map=researchMap(world,[{label:'US',publications:20}],{institutions:locations,selectionState});
 assert.ok(map.querySelectorAll('.institution-marker').length>0);
 map.resetAll();
 assert.equal(map.value,'All countries');assert.equal(selectionState.value,'All countries');
 assert.equal(selectionState.overlayEnabled,false);assert.equal(selectionState.overlayLimit,300);
 assert.equal(map.querySelectorAll('.institution-marker').length,0);
 assert.equal(map.querySelector('[aria-label="Show institutions"]').checked,false);
 assert.equal(map.querySelector('[aria-label="Select a country"]').value,'All countries');
});
