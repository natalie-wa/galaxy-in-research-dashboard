# Galaxy in Research

**Exploring more than two decades of Galaxy in the scientific literature**

Galaxy in Research is an interactive research dashboard examining the scholarly literature associated with the [Galaxy Project](https://galaxyproject.org/), an open platform for accessible, reproducible, and collaborative computational research.

The dashboard accompanies an ongoing scholarly Perspective examining Galaxy's development, geographic and institutional reach, disciplinary representation, and the contributions of the international Galaxy community.

**[Explore the live dashboard](https://natalie-wa.github.io/galaxy-in-research-dashboard/)**

## About the project

Since Galaxy's introduction in 2005, its associated scientific literature has grown to encompass thousands of publications across research disciplines and institutions worldwide.

Galaxy in Research makes this literature accessible through interactive visualizations and publication-level exploration. Rather than relying exclusively on aggregate statistics or a selected collection of papers, researchers can investigate the publications underlying the broader patterns.

The dashboard was developed from a bibliometric analysis of publications citing 49 eligible Galaxy reference papers, using records identified through OpenAlex, Semantic Scholar, OpenCitations, Europe PMC, and PubMed. The interactive analytical dataset is based on OpenAlex records and associated metadata.

### Dataset overview

| Metric | Value |
|---|---:|
| Analytical publications | 14,469 |
| Citation relationships | 18,418 |
| Eligible Galaxy reference publications | 49 |
| Countries represented through author affiliations | 157 |
| Distinct OpenAlex institutional identifiers | 8,236 |
| Research fields represented | 25 |
| Bibliographic snapshot | 16 October 2026 |

The analytical corpus excludes six citing publications dated 2005 or earlier. Two publications without an available publication year remain in the full dataset but are excluded from analyses requiring a known year.

These values describe a dated bibliographic record. Citation relationships do not necessarily indicate direct Galaxy software use, and author affiliations do not identify where computational analyses were conducted.

## Explore the literature

The dashboard provides several complementary ways to investigate the research record.

### Geographic and institutional representation

Explore the distribution of author affiliations through an interactive world map, with options to select individual countries and examine institutional participation.

Institution markers are available for a fixed pool of the 1,000 most frequently represented institutions, with display options for 100, 300, or 1,000 markers.

Country and institutional selections connect the geographic view to the underlying publications.

### Publication discovery

Browse and search publications by title or DOI, with filtering options for publication year, research field, topic, country, and institution.

Publication records provide links to the original research, allowing users to investigate studies relevant to their own interests.

### Temporal exploration

Examine the development of Galaxy-associated scholarship over time using annual and cumulative publication views.

An interactive timeline includes year controls, a slider, and optional playback. Publication records without a known year remain available through the appropriate undated or full-corpus views.

### Research fields and topics

Explore the disciplinary composition of publications using OpenAlex research-field classifications and associated research topics.

These categories describe bibliographic metadata and should not be interpreted as independently verified measures of Galaxy use within individual disciplines.

### Comparisons and shared views

The dashboard supports comparisons of selected countries or institutions, including publication counts, temporal patterns, shared publications, and disciplinary representation.

Filtered views can be shared through URLs, making it easier to return to a particular selection or communicate findings.

## Data sources and methodology

The analysis draws on five bibliographic discovery sources:

- OpenAlex
- Semantic Scholar
- OpenCitations
- Europe PMC
- PubMed

OpenAlex provides the primary analytical dataset because it offers a consistent source of publication, authorship, institutional affiliation, and disciplinary metadata.

The project distinguishes between publication identities and citation relationships. A publication may cite multiple eligible Galaxy references, and a publication with authors affiliated with several countries or institutions may contribute to multiple geographic or institutional counts.

The underlying data were processed using documented eligibility, deduplication, and reconciliation procedures.

The dashboard uses a frozen bibliographic snapshot through **16 October 2026**. Data for 2026 are incomplete and should not be compared directly with complete calendar years.

Further documentation is available in:

- [Methods and analytical definitions](docs/METHODS.md)
- [Excluded publications](docs/excluded_publications.csv)
- [Asset provenance](docs/ASSETS.json)

## Reproducibility and validation

The repository includes the data preparation scripts, source snapshots, generated browser dataset, supporting documentation, and automated tests used to build and validate the dashboard.

Validation procedures include deterministic dataset generation, reconciliation against established aggregate results, checks of filtering and interface behavior, and verification of the compiled application.

The analytical dataset is regenerated from committed source snapshots rather than requiring a new bibliographic search during ordinary builds.

The complete manuscript analysis, including statistical procedures and sensitivity assessments, is documented separately in the accompanying research materials.

## Repository organization

| Path | Description |
|---|---|
| `src/index.md` | Dashboard overview, geographic map, literature views, and summaries |
| `src/papers.md` | Publication explorer and filtered downloads |
| `src/compare.md` | Geographic and institutional comparisons |
| `src/components/` | Shared filtering and interactive components |
| `src/theme.css` | Dashboard styling |
| `src/assets/` | Visual assets, fonts, and geographic geometry |
| `src/data/corpus.json` | Generated dataset used by the browser application |
| `data/source/` | Original publication and citation snapshots |
| `data/reference/` | Aggregate reference tables used for validation |
| `data/institutions/` | Institutional location data and retrieval provenance |
| `scripts/` | Data preparation, metadata maintenance, and validation scripts |
| `test/` | Automated tests |
| `docs/` | Methods, exclusions, provenance, licensing documentation, and setup information |
| `.github/workflows/` | Automated validation and deployment workflows |

## Local development

The dashboard is built using [Observable Framework](https://observablehq.com/framework/).

**Requirements**

- Node.js 20 or newer
- Python 3.10 or newer

The automated CI environment uses Node.js 24 and Python 3.11.

To install dependencies, generate data, validate the project, and start the local development server:

```bash
npm ci
npm run data
npm test
npm run dev
```

Open the local URL printed by Observable Framework.

To generate and validate the production build:

```bash
npm run build
npm run test:runtime
npm run test:pages
```

The compiled site is generated in `dist/`.

Data preparation uses committed local snapshots and Python's standard library. JavaScript dependencies are pinned in `package-lock.json`. An initial Framework build may require internet access to obtain frontend dependencies.

## Refreshing institutional locations

Ordinary builds use the committed institutional location snapshot.

To deliberately refresh the location data from OpenAlex:

```bash
python3 scripts/fetch_institution_locations.py --limit 1000
npm run data
npm test
npm run build
npm run test:runtime
npm run test:pages
```

Review changes to the snapshot before committing. Retrieval records and checksums are preserved to support provenance and reproducibility.

## Deployment

The dashboard is publicly accessible through GitHub Pages:

**https://natalie-wa.github.io/galaxy-in-research-dashboard/**

GitHub Actions supports automated validation and deployment from the repository.

The publishing workflow deploys the generated `dist/` directory. Supporting research data and scripts remain available in the source repository, subject to the project's applicable redistribution conditions.

Additional setup and publishing information is documented in [PUBLISHING.md](docs/PUBLISHING.md).

## Project status and availability

Galaxy in Research is a publicly accessible research dashboard accompanying an ongoing manuscript examining more than two decades of Galaxy-associated scientific literature.

The dashboard is operational and available for exploration. The manuscript and accompanying research materials are undergoing scientific review and refinement.

The project has not yet received a final research software or data redistribution license. Decisions regarding licensing, reuse conditions, and any future integration with official Galaxy resources will be made in consultation with collaborators.

Asset origins and checksums are documented in [ASSETS.json](docs/ASSETS.json). The Atkinson Hyperlegible font license is included in `docs/Atkinson-OFL.txt`. Natural Earth geographic data are public domain. Galaxy branding remains subject to applicable terms.

## Interpretation and limitations

Galaxy in Research is designed to support exploration of bibliographic evidence, not to serve as a comprehensive measurement of Galaxy platform usage.

Several distinctions are important:

- A citation to a Galaxy reference publication does not independently establish that Galaxy was used to conduct the citing study.
- Author affiliations indicate institutional associations with publications, not the locations where analyses were performed.
- Geographic and institutional coverage depend on the completeness and accuracy of indexed metadata.
- OpenAlex research-field and topic classifications are bibliographic categories and may contain classification artifacts.
- The dashboard represents a dated snapshot rather than a continuously updated count of Galaxy-associated research.

These limitations are described further in the [methods documentation](docs/METHODS.md).

## Research and collaboration

Galaxy in Research was developed to make the scientific literature associated with Galaxy easier to discover, examine, and understand.

The broader research aims to document the scholarly history of Galaxy while recognizing the collective contributions of the scientists, developers, system administrators, educators, trainers, and other community members who have sustained the project.

The manuscript and associated resources are currently being developed and reviewed with collaborators. Publication information and finalized attribution will be added when available.
