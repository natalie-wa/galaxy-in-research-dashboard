/** A small rolling window scrolls through the entire selection without rendering
 * thousands of cards. CSS supplies smooth motion; each iteration recycles a card.
 */
export function paperCarousel(works, {invalidate}={}) {
  const root=document.createElement('section');root.className='paper-carousel';root.setAttribute('aria-label','Explore research publications');
  const toolbar=document.createElement('div');toolbar.className='carousel-toolbar';
  const label=document.createElement('span');label.className='carousel-position';
  const controls=document.createElement('div');controls.className='carousel-buttons';
  const previous=document.createElement('button');previous.type='button';previous.textContent='←';previous.setAttribute('aria-label','Previous publications');
  const play=document.createElement('button');play.type='button';play.setAttribute('aria-label','Pause automatic scrolling');
  const next=document.createElement('button');next.type='button';next.textContent='→';next.setAttribute('aria-label','Next publications');
  controls.append(previous,play,next);toolbar.append(label,controls);
  const rail=document.createElement('div');rail.className='paper-rail';
  const track=document.createElement('div');track.className='paper-track';rail.append(track);
  const papers=[...works].sort((a,b)=>(b.year??0)-(a.year??0)||a.title.localeCompare(b.title));
  let offset=0,paused=Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  function createCard(d){
    const card=document.createElement('article');card.className='paper-card';
    const meta=document.createElement('div');meta.className='paper-meta';meta.textContent=`${d.year??'Year unavailable'} · ${d.type || 'Publication'}`;
    const title=document.createElement('h3');const link=document.createElement('a');link.href=d.doi?'https://doi.org/'+d.doi:d.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=d.title;title.append(link);
    const field=document.createElement('p');field.className='paper-field';field.textContent=d.field;
    const footer=document.createElement('a');footer.href=link.href;footer.target='_blank';footer.rel='noopener noreferrer';footer.className='paper-link';footer.textContent='Read publication ↗';
    card.append(meta,title,field,footer);return card;
  }
  function render(){
    track.replaceChildren();
    const size=papers.length>3?5:papers.length;
    for(let i=0;i<size;i++)track.append(createCard(papers[(offset+i)%papers.length]));
    label.textContent=papers.length?`${papers.length.toLocaleString()} papers · continuously exploring the selection`:'No papers match this selection';
    root.dataset.scrolling=String(!paused&&papers.length>3);
    play.textContent=paused?'Play':'Pause';play.setAttribute('aria-pressed',String(!paused));play.setAttribute('aria-label',paused?'Start automatic scrolling':'Pause automatic scrolling');
    previous.disabled=next.disabled=play.disabled=papers.length<=3;
  }
  function restart(){track.style.animation='none';void track.offsetWidth;track.style.animation='';}
  function move(step){if(!papers.length)return;offset=(offset+step+papers.length)%papers.length;render();restart();}
  track.addEventListener('animationiteration',event=>{if(event.target===track&&!paused)move(1);});
  previous.onclick=()=>{paused=true;move(-1);};next.onclick=()=>{paused=true;move(1);};
  play.onclick=()=>{paused=!paused;root.dataset.scrolling=String(!paused);play.textContent=paused?'Play':'Pause';play.setAttribute('aria-pressed',String(!paused));play.setAttribute('aria-label',paused?'Start automatic scrolling':'Pause automatic scrolling');};
  function visibility(){root.dataset.hidden=String(document.hidden);}
  document.addEventListener('visibilitychange',visibility);visibility();
  invalidate?.then(()=>{root.dataset.scrolling='false';document.removeEventListener('visibilitychange',visibility);});
  render();root.append(toolbar,rail);return root;
}
