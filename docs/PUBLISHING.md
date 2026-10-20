# Publish a GitHub Pages preview

This project includes the complete build and deployment workflow. No repository name or username needs to be hard-coded. Relative assets and explicit `.html` publication links support a GitHub project URL.

## 1. Create your repository

Use `galaxy-in-research-dashboard` as the repository name, or choose another name. Upload the unzipped project contents, including `.github/`, to the repository root. `package.json`, `observablehq.config.js`, `src/`, and `.github/` should be directly in that root, not inside another folder.

A public repository and preview make their data publicly accessible. Use public visibility only when the data are ready for public release. Private repository Pages availability depends on your GitHub plan, and a private repository does not by itself make the website private.

### Using GitHub Desktop

1. Download and open GitHub Desktop and sign in.
2. Choose **File → Add Local Repository** and select the unzipped project folder.
3. If it is not a Git repository yet, choose **create a repository here**. Check that the local path is the existing project folder. Leave license and Git ignore templates unset; this project already includes its ignore rules.
4. Commit the files if they are not yet committed, then choose **Publish repository**. Select your own account and desired visibility.
5. Confirm the default branch is `main`.

### Using Terminal instead

On GitHub, create an empty repository in your own account. Do not initialize it with a README, license, or ignore file. Copy its repository URL. In Terminal, enter the unzipped project directory and run:

```sh
git init -b main
git add .
git commit -m "Add Galaxy in Research dashboard"
git remote add origin YOUR_REPOSITORY_URL
git push -u origin main
```

Replace `YOUR_REPOSITORY_URL` with the URL you copied. GitHub authentication must be configured on your computer. Ordinary account passwords do not authenticate Git pushes; GitHub Desktop is an alternative if authentication is not set up.

## 2. Enable Pages

1. Open the repository on GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **GitHub Actions**. Do not choose deployment from a branch.
4. Open **Actions → Validate and publish dashboard → Run workflow**, select `main`, and run it.

The initial push may start the workflow before Pages is enabled. If it fails at **Configure GitHub Pages**, enable Pages and rerun the workflow. No editing of workflow code is necessary.

## 3. Share and review

After the workflow succeeds, open the link in the `github-pages` deployment or in **Settings → Pages**. For a normal project repository, the address is:

```text
https://YOUR-USERNAME.github.io/YOUR-REPOSITORY-NAME/
```

Check the overview, map, institution selection, publication explorer, return navigation, and downloads at the published URL before sharing it with the team. This live review complements automated checks.

## Updates and controls

- Push changes to `main` to validate and publish an update.
- Pull requests run checks without publishing.
- **Actions → Validate and publish dashboard → Run workflow** republishes manually.
- The workflow uses GitHub's built-in token and Pages environment; no personal access token or external hosting account is required for deployment.
- Only generated files in `dist/` are deployed. Generated output, dependencies, caches, and environment files are ignored by Git.
- Pages publishes the committed data snapshot. It does not automatically retrieve new publications or institution locations.
- To remove the live preview, use **Settings → Pages → Unpublish site**, and disable the publishing workflow to prevent a later push from publishing it again.

For GitHub environment protection, restrict the `github-pages` environment to deployment from `main` if that restriction is not already configured.

## References

- https://observablehq.github.io/framework/deploying
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
