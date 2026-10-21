export function filterWorks(works, {year = 'All years', country = 'All countries', field = 'All fields', category = 'All categories', query = '', institution = 'All institutions', period = 'year', topic = 'All topics'} = {}) {
  const needle = query.trim().toLowerCase();
  return works.filter(d => (year === 'All years' || (year === 'Missing year' ? d.year === null : (period === 'cumulative' ? d.year !== null && d.year <= Number(year) : d.year === Number(year)))) &&
    (country === 'All countries' || d.countries.includes(country)) &&
    (institution === 'All institutions' || d.institutions.includes(institution)) &&
    (field === 'All fields' || d.field === field) &&
    (topic === 'All topics' || (topic === 'Missing topic' ? !d.topic : d.topic === topic)) &&
    (category === 'All categories' || d.categories.includes(category)) &&
    (!needle || `${d.title} ${d.doi}`.toLowerCase().includes(needle)));
}
export function counts(works, column) {
  const totals = new Map();
  for (const d of works) for (const value of new Set(Array.isArray(d[column]) ? d[column] : [d[column]])) {
    totals.set(value, (totals.get(value) ?? 0) + 1);
  }
  return Array.from(totals, ([label, publications]) => ({label, publications})).sort((a,b) => b.publications-a.publications || String(a.label).localeCompare(String(b.label)));
}
export function annual(works) {
  const totals = new Map(counts(works.filter(d => d.year >= 2006 && d.year <= 2026), 'year').map(d => [d.label,d.publications]));
  return Array.from({length:21},(_,i) => ({year:2006+i, publications:totals.get(2006+i) ?? 0}));
}
