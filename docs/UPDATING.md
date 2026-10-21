# Update the existing dashboard repository

The current repository and GitHub Pages address can remain unchanged. This update is based on upstream commit `bc262d07657876753f3331aa2966726bb1c7c147`.

## Create a review branch in GitHub Desktop

1. Select your existing `galaxy-in-research-dashboard` repository.
2. Choose **Fetch origin**, then **Pull origin** if offered. Check that you have no uncommitted work before copying this update.
3. Choose **Current Branch → New Branch**, enter `feature/research-exploration`, and create it from `main`.
4. Choose **Repository → Show in Finder**. Keep that existing repository window open.
5. Unzip this updated package in a separate folder. Open its `galaxy-in-research-dashboard` folder in another Finder window.
6. Press **Command + Shift + .** to show hidden files. Copy the contents of the downloaded project folder into the existing repository folder, replacing matching files or folders. Copy contents directly into the repository root; do not nest another project folder. Preserve the existing `.git` folder. This package does not include a `.git` folder.
7. Review the changes in GitHub Desktop. If you have made other dashboard changes since the baseline commit, review the overlapping files before replacing them.

## Preview and validate

Open Terminal in the repository folder and run:

```sh
npm ci
npm test
npm run build
npm run test:runtime
npm run test:pages
npm run dev
```

Open the local address shown by Framework to review the dashboard. The feature branch does not change the live Pages site.

## Publish the update

1. In GitHub Desktop, enter `Add timeline, topics, sharing, and comparisons` as the commit summary and commit the changes.
2. Click **Publish branch**, then **Create Pull Request**.
3. Target your own repository's `main` branch and describe the changes. The existing workflow checks the pull request without deployment.
4. Review the preview and passing checks, then merge the pull request when ready. A push to `main` triggers the existing GitHub Pages deployment.
5. Wait for **Validate and publish dashboard** to pass, then refresh the same website URL. Verify map controls, timeline, share links, comparisons, and publication links in the published site.

If a change needs to be reversed after publication, revert the merged update in GitHub and allow the Pages workflow to redeploy. Keep the previous commits and data snapshot in repository history.
