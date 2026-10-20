# Dashboard data definitions

## Population and dated exclusions

The original D49_approved analytical definition includes 14,475 publication identities and 18,424 unique citation relationships to 49 Galaxy reference papers, from the OpenAlex snapshot through 16 October 2026. The preparation script first reconstructs this original population and validates all counts in the four supplied temporal, geographic, disciplinary, and institutional aggregate tables.

The dashboard excludes six records dated at or before 2005, comprising five pre-2005 records and one 2005 record identified during corpus review as unrelated to Galaxy. The dashboard therefore contains **14,469 publications and 18,418 unique citation relationships**. The two records with unknown publication years remain included. Exact exclusions are in excluded_publications.csv and in the generated manifest. Original source files and manuscript aggregates remain unchanged.

Identity uses the supplied normalized DOI key, or OpenAlex work ID where DOI is absent. Publication versions can remain separate. Three repeated eligible edge rows in the source table count only once. Citation metadata alone do not establish that a publication used Galaxy.

## Counts and filters

Country and institution counts use a distinct set per publication, so repeated authors from the same institution count once, while papers with multiple affiliations contribute to each institution or country. These groups overlap. Country means any-author country metadata, not corresponding-author geography. Missing metadata remain in the publication total.

Research field is the primary OpenAlex field, with missing assignments explicitly labeled Unclassified. Automated classifications can be misleading; the manuscript flags a Decision Sciences classification artifact. Cited-reference categories describe the references cited, not confirmed tools or workflows in the paper.

Year, field, and text filters intersect. These filters control the map's country shading and institution counts. Selecting a country on the map then filters the paper carousel, other summaries, and table; the map retains global context. The temporal chart spans 2006–2026, omitting the two unknown years. The year 2026 is incomplete.

## Institution overlay

The candidate location pool is the top 1,000 institutions by publication count in the retained full corpus, with institution ID breaking ties. Coordinates are retrieved by exact identifier from the OpenAlex institutions API. All 1,000 returned finite in-range latitude and longitude values. Request URLs, timestamps, raw API responses, and a reduced location snapshot are retained under data/institutions/. The snapshot's checksum is recorded in the generated manifest.

These are API-supplied geographic coordinates, often city-level rather than exact buildings; they are not independently surveyed or randomly jittered. No author-institution pairing is inferred from flattened source columns.

Within that fixed pool, marker counts and ranking follow the map's year, field, and search filters. Display limits are 100, 300, and 1,000. Marker size reflects publication count. Hover or focus displays the institution name, city, and count. Institution dots do not link out. Selecting a dot filters papers by the exact institutional identifier, intersecting the year, field, and search filters. It replaces a country-only selection. The indicator can be cleared by clicking again or using Clear institution. The map does not claim to display every institution in a small filtered subset, since candidates are selected from the full corpus's leading 1,000.

Normal data processing and builds use the saved snapshot without querying OpenAlex. To intentionally refresh geography, run scripts/fetch_institution_locations.py, then regenerate and validate. The fetch script is a separate network operation.

## Reproduction and scope

Run npm ci, npm run data, npm test, npm run build, and npm run test:runtime. Node dependencies are pinned in package-lock.json; Python data preparation uses the standard library. Input checksums identify the exact snapshots. A stale generated dataset fails the checks. The compiled Observable runtime is tested with actual input generators and DOM controls; browser visual review remains separate.

Later multi-source recovery work remains outside the primary dashboard population. This dashboard revision does not silently change manuscript results. Methods documentation is retained here rather than displayed as a dashboard page.
