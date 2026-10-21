import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {filterWorks} from '../src/components/metrics.js';
import {timeline,viewHref,shareView,comparisonData,comparisonView,topicExplorer} from '../src/components/exploration.js';
const dom=new JSDOM('<html><body></body></html>',{url:'https://example.org/repo/',pretendToBeVisual:true});
globalThis.window=dom.window;globalThis.document=dom.window.document;globalThis.Event=dom.window.Event;
const works=[
 {key:'a',year:2006,title:'A',doi:'',field:'Biology',topic:'t1',topic_name:'Topic one',countries:['US','DE'],institutions:['i1','i2']},
 {key:'b',year:2025,title:'B',doi:'',field:'Biology',topic:'t2',topic_name:'Topic two',countries:['US'],institutions:['i1']},
 {key:'c',year:2026,title:'C',doi:'',field:'Medicine',topic:'t1',topic_name:'Topic one',countries:['DE'],institutions:['i2']},
 {key:'d',year:null,title:'D',doi:'',field:'Unclassified',topic:'',topic_name:'Unclassified topic',countries:['DE'],institutions:['i2']}
];
test('cumulative time excludes unknown and future dates while intersecting topic and place',()=>{
 assert.deepEqual(filterWorks(works,{year:2025,period:'cumulative'}).map(w=>w.key),['a','b']);
 assert.deepEqual(filterWorks(works,{year:2025,period:'cumulative',topic:'t1',country:'DE'}).map(w=>w.key),['a']);
 assert.equal(filterWorks(works,{year:'All years',period:'cumulative'}).length,4);
 assert.deepEqual(filterWorks(works,{topic:'Missing topic'}).map(w=>w.key),['d']);
});
test('timeline keeps plain years, synchronizes slider and select, and cleans up playback',async()=>{
 const t=timeline([2006,2025,2026],{interval:10});
 const s=t.querySelector('[aria-label="Timeline year"]'),y=t.querySelector('[aria-label="Publication year"]');
 assert.ok([...y.options].every(o=>!o.textContent.includes(',')));
 s.value='2025';s.dispatchEvent(new Event('input',{bubbles:true}));assert.deepEqual(t.value,{year:2025,period:'year'});assert.equal(y.value,'2025');
 const mode=t.querySelector('[aria-label="Time window"]');mode.value='cumulative';mode.dispatchEvent(new Event('change'));assert.equal(t.value.period,'cumulative');
 t.querySelector('button').click();await new Promise(r=>setTimeout(r,40));assert.equal(t.value.year,2026);assert.equal(t.querySelector('button').getAttribute('aria-pressed'),'false');t.dispose();
 const t2=timeline([2006,2007,2026],{interval:10});t2.querySelector('button').click();t2.dispose();const before=t2.value.year;await new Promise(r=>setTimeout(r,30));assert.equal(t2.value.year,before);
});
test('shared links preserve all meaningful filters and encoded topic names without credentials or autoplay',()=>{
 const href=viewHref('./compare.html',{year:2025,period:'cumulative',topic:'https://openalex.org/T1',query:'RNA & DNA',kind:'institution',left:'i1',right:'i2',overlay:'true',limit:100,token:'secret',play:true});
 const url=new URL(href,window.location.href);assert.equal(url.pathname,'/repo/compare.html');
 for(const [key,value] of Object.entries({year:'2025',period:'cumulative',query:'RNA & DNA',topic:'https://openalex.org/T1',left:'i1',right:'i2',kind:'institution',overlay:'true',limit:'100'}))assert.equal(url.searchParams.get(key),value);
 assert.equal(url.searchParams.has('token'),false);assert.equal(url.searchParams.has('play'),false);
});
test('share control has a manual-copy fallback and exposes the correct repository URL',async()=>{
 const control=shareView('./?year=2025&period=cumulative');await control.querySelector('button').onclick();
 const input=control.querySelector('input');assert.equal(input.hidden,false);assert.equal(input.value,'https://example.org/repo/?year=2025&period=cumulative');
});
test('comparison counts overlapping papers once per group and ignores single-place overview filters',()=>{
 const d=comparisonData(works,{kind:'country',left:'US',right:'DE',country:'FR'});
 assert.equal(d.a.length,2);assert.equal(d.b.length,3);assert.equal(d.overlap,1);
 const inst=comparisonData(works,{kind:'institution',left:'i1',right:'i2',year:2025,period:'cumulative',topic:'t1'});
 assert.equal(inst.a.length,1);assert.equal(inst.b.length,1);assert.equal(inst.overlap,1);assert.ok(inst.annualA.every(d=>d.year<=2025));
 assert.equal(comparisonData(works,{left:'US',right:'DE',year:2025}).annualA.length,1);
 assert.equal(comparisonData(works,{left:'US',right:'DE',year:'Missing year'}).annualA.length,0);
 const empty=comparisonData(works,{left:'XX',right:'US'});
 const view=comparisonView(empty,{leftName:'Empty',rightName:'US'});assert.ok(!view.textContent.includes('NaN'));assert.ok(!view.querySelector('polyline').getAttribute('points').includes('NaN'));
});
test('topic cards preserve active filters, include full names, and identify missing metadata',()=>{
 const root=topicExplorer(works,{year:2025,institution:'i1'});const links=root.querySelectorAll('a');assert.equal(links.length,2);assert.match(root.textContent,/Topic one/);assert.match(root.textContent,/1 publications without a topic/);
 const params=new URL(links[0].href).searchParams;assert.equal(params.get('year'),'2025');assert.equal(params.get('institution'),'i1');assert.equal(params.get('topic'),'t1');
});
test('generated topics and counts are preserved in the reproducible corpus',()=>{
 const corpus=JSON.parse(fs.readFileSync(new URL('../src/data/corpus.json',import.meta.url)));
 assert.equal(corpus.works.length,14469);assert.ok(corpus.works.every(w=>typeof w.topic==='string'&&typeof w.topic_name==='string'));
});
