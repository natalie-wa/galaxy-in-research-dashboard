# Galaxy in Research dashboard

Interactive exploration of the October 2026 Galaxy-citing literature snapshot, built with Observable Framework. Includes a geographic map, optional institution overlay, scrolling publication cards, temporal and disciplinary summaries, and a searchable publication explorer.

## Development

Requires Node.js 20+ and Python 3.10+. CI uses Node.js 24 and Python 3.11.

```sh
npm ci
npm run data
npm test
npm run dev
```

Open the local URL printed by Framework. To build and validate the static site:

```sh
npm run build
npm run test:runtime
npm run test:pages
```

Output is generated in `dist/`. The first Framework build may require internet access for frontend libraries. Data preparation uses committed snapshots offline and Python's standard library. JavaScript dependencies are pinned in `package-lock.json`.

## Structure

| Path | Contents |
| --- | --- |
| `src/index.md` | Overview, map, literature cards, summaries |
| `src/papers.md` | Publication explorer and filtered downloads |
| `src/components/` | Shared filtering and interactive components |
| `src/theme.css`, `src/assets/` | Theme, fonts, logo, geographic geometry |
| `src/data/corpus.json` | Deterministic generated browser dataset |
| `data/source/` | Original publication and citation snapshots |
| `data/reference/` | Original aggregate tables for validation |
| `data/institutions/` | Location snapshot and API retrieval provenance |
| `scripts/` | Data preparation, metadata refresh, and build checks |
| `test/` | Automated tests |
| `docs/` | Methods, exclusions, asset provenance, and font license |

## Data and validation

The dashboard contains **14,469 publications** and **18,418 unique citation relationships** to 49 approved Galaxy reference papers. Six dated records through 2005 are excluded; two records without years remain. The snapshot ends on 16 October 2026, so 2026 is incomplete.

Year, research field, and title/DOI filters combine with country or institution selection. Filters transfer between views. Institution markers cover a fixed pool of the top 1,000 institutions, with display limits of 100, 300, or 1,000. Literature scrolling includes pause controls and respects reduced-motion settings.

See [METHODS.md](docs/METHODS.md) for counting rules and limitations, and [excluded_publications.csv](docs/excluded_publications.csv) for exclusions. Citation relationships do not independently establish platform use.

`npm test` checks deterministic dataset generation, reconciles four original aggregate tables, and tests filtering and interface interactions. `npm run test:runtime` verifies the compiled application's filters and navigation. GitHub Actions checks pull requests and updates to `main`. Successful updates to `main` publish the built site to GitHub Pages once Pages is enabled.

## Refreshing institution locations

Ordinary builds use the saved snapshot. To deliberately refresh from OpenAlex:

```sh
python3 scripts/fetch_institution_locations.py --limit 1000
npm run data
npm test
npm run build
npm run test:runtime
npm run test:pages
```

Review snapshot changes before committing. Retrieval records and checksums preserve provenance.

## Assets and release status

Asset sources and checksums are in [ASSETS.json](docs/ASSETS.json). The Atkinson Hyperlegible font license is included in `docs/Atkinson-OFL.txt`. Natural Earth geometry is public domain. Galaxy branding remains subject to applicable terms. No project code or data license has been selected.

This is a development draft. Browser visual and accessibility review and eventual Galaxy Hub integration remain to be completed. A standalone GitHub Pages deployment workflow is included. The source package's release conditions, including PI approval and data redistribution terms, remain to be resolved before public release.

## GitHub Pages preview

See [PUBLISHING.md](docs/PUBLISHING.md) for the initial repository and Pages setup. The workflow publishes only `dist/`; source snapshots remain in the repository. Publication metadata included in the built dashboard are accessible to site visitors. No separate hosting account or manually configured deployment token is needed.
