import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {sortedPublications,publicationBrowser} from '../src/components/publications.js';
const dom=new JSDOM('<html><body></body></html>');globalThis.document=dom.window.document;globalThis.Event=dom.window.Event;
const works=Array.from({length:23},(_,i)=>({key:String(i),title:`Publication ${String(i).padStart(2,'0')}`,year:i===0?null:2006+i,doi:`10.1/${i}`,url:'https://openalex.org/W1',type:'article',field:'Biology',topic_name:'Genomics',countries:['US'],institutions:['i1']}));
test('publication ordering is deterministic, leaves unknown years last, and preserves source order',()=>{
 assert.equal(sortedPublications(works)[0].key,'22');assert.equal(sortedPublications(works,'oldest')[0].key,'1');
 assert.equal(sortedPublications(works,'oldest').at(-1).key,'0');assert.equal(sortedPublications(works,'title')[0].key,'0');assert.equal(works[0].key,'0');
});
test('publication pagination covers results exactly and resets to page one on filter changes',()=>{
 const state={};const root=publicationBrowser(works,{selectionState:state,filterKey:'all'});
 assert.equal(root.querySelectorAll('article').length,10);assert.equal(root.value.page,1);
 root.querySelector('[aria-label="Next page of publications"]').click();assert.equal(root.value.page,2);
 root.querySelector('[aria-label="Next page of publications"]').click();assert.equal(root.querySelectorAll('article').length,3);
 assert.equal(root.querySelector('[aria-label="Next page of publications"]').disabled,true);
 const same=publicationBrowser(works,{selectionState:state,filterKey:'all'});assert.equal(same.value.page,3);
 const changed=publicationBrowser(works.slice(0,11),{selectionState:state,filterKey:'year'});assert.equal(changed.value.page,1);
 const empty=publicationBrowser([]);assert.equal(empty.querySelectorAll('article').length,0);assert.equal(empty.querySelector('[aria-label="Next page of publications"]').disabled,true);
});
test('publication details and links are accessible without rendering thousands of rows',()=>{
 const root=publicationBrowser(works,{countryName:c=>'United States',institutionName:id=>'Example University',selectionState:{sort:'title'}});
 assert.equal(root.querySelectorAll('article').length,10);
 const first=root.querySelector('article');assert.equal(first.querySelector('details').open,false);assert.match(first.textContent,/Example University/);assert.match(first.textContent,/United States/);
 assert.equal(first.querySelector('h2 a').href,'https://doi.org/10.1/0');assert.equal(first.querySelector('h2 a').rel,'noopener noreferrer');
 const size=root.querySelector('[aria-label="Per page"]');size.value='25';size.dispatchEvent(new Event('change'));assert.equal(root.querySelectorAll('article').length,23);
 const sort=root.querySelector('[aria-label="Sort results"]');sort.value='oldest';sort.dispatchEvent(new Event('change'));assert.equal(root.querySelector('h2 a').textContent,'Publication 01');assert.equal(root.value.page,1);
});
