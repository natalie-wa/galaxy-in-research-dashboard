import {test} from 'node:test';
import assert from 'node:assert/strict';
import {filterWorks,counts,annual} from '../src/components/metrics.js';
const works=[{title:'RNA analysis',doi:'10.1/a',year:2026,countries:['US','DE'],institutions:['I1'],field:'Biology',categories:['Core']},{title:'Missing metadata',doi:'',year:null,countries:[],institutions:[],field:'Unclassified',categories:['Core']},{title:'Earlier record',doi:'10.1/b',year:2002,countries:['US'],institutions:['I2'],field:'Biology',categories:['Tools']}];
test('combined filters intersect and DOI search is case insensitive',()=>{assert.equal(filterWorks(works,{country:'DE',field:'Biology',query:'10.1/A'}).length,1);assert.equal(filterWorks(works,{country:'DE',category:'Tools'}).length,0);});
test('missing years remain selectable',()=>assert.equal(filterWorks(works,{year:'Missing year'})[0].title,'Missing metadata'));
test('country filter retains coauthor countries',()=>assert.deepEqual(counts(filterWorks(works,{country:'DE'}),'countries').map(d=>d.label),['DE','US']));
test('missing countries do not become a country and per-publication duplicates count once',()=>assert.deepEqual(counts([{countries:['US','US']},{countries:[]}],'countries'),[{label:'US',publications:1}]));
test('time range omits missing and earlier years, preserves zero years and partial 2026',()=>{const a=annual(works);assert.equal(a.length,21);assert.equal(a.reduce((n,d)=>n+d.publications,0),1);assert.equal(a.at(-1).publications,1);});
test('empty selections return zero annual counts',()=>assert.equal(annual([]).reduce((n,d)=>n+d.publications,0),0));

test('institution filtering intersects with year and search and retains coauthor affiliations',()=>{
 assert.equal(filterWorks(works,{institution:'I1',year:2026,query:'RNA'}).length,1);
 assert.equal(filterWorks(works,{institution:'I1',year:2025}).length,0);
 assert.equal(filterWorks(works,{institution:'missing'}).length,0);
});
