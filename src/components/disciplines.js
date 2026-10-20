/** HTML bars keep complete field names outside the plot's clipped SVG area. */
export function disciplineChart(rows) {
  const root=document.createElement('div');root.className='discipline-chart';root.setAttribute('role','list');root.setAttribute('aria-label','Publications by research field');
  const maximum=Math.max(1,...rows.map(d=>d.publications));
  if(!rows.length){const p=document.createElement('p');p.textContent='No fields in this selection.';root.append(p);}
  for(const row of rows){
    const item=document.createElement('div');item.className='discipline-row';item.setAttribute('role','listitem');
    const heading=document.createElement('div');heading.className='discipline-heading';
    const label=document.createElement('span');label.className='discipline-label';label.textContent=row.label;
    const count=document.createElement('strong');count.textContent=row.publications.toLocaleString();
    heading.append(label,count);
    const track=document.createElement('div');track.className='discipline-track';track.setAttribute('aria-hidden','true');
    const bar=document.createElement('div');bar.className='discipline-bar';bar.style.width=`${100*row.publications/maximum}%`;track.append(bar);
    item.append(heading,track);root.append(item);
  }
  return root;
}
