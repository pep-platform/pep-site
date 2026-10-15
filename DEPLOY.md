# Deploying the pep site

`python3 build.py` builds the finished site into `dist/`: plain HTML, CSS, JS and two images. It runs on any static host with no server code, and opens locally by double-clicking `dist/index.html`.

## Before it goes live

- **Request a demo form:** not connected. Add a Formspree (or similar) endpoint to `data-endpoint=""` in `src/pages/early-access.html`, then rebuild.
- **Privacy and Terms:** holding text only. Add the real copy.
- **Name:** still "pep". The rename is one line in `site.json`, though the closing line "Put some pep in your partnership." will need rewriting.
- **Domain:** canonical URLs point at `https://pep.works` (from `site.json`).

## Option 1: GitHub Pages

1. Push this repo to GitHub (for example rory-lab/pep-site).
2. Run `python3 build.py` and commit the `dist/` folder (remove `dist/` from `.gitignore` first), or add a build workflow.
3. In the repo: Settings, Pages, deploy from the branch, folder `/dist` (or move `dist/` to `/docs`, which Pages supports directly).
4. Add `pep.works` as the custom domain and point the domain's DNS at GitHub Pages as GitHub instructs.

## Option 2: Cloudflare Pages or Netlify (what boxcount.co uses)

Connect the GitHub repo, set the build command to `python3 build.py` and the output folder to `dist`. Every push to `main` then rebuilds and deploys. Add `pep.works` as the custom domain.

Moving the domain off Simon's current CMS needs coordinating with him.
