# Deploying the pep site

The site deploys automatically. Every push to `main` runs `.github/workflows/pages.yml`, which builds the site with `python3 build.py` and publishes `dist/` to GitHub Pages. The repo is public (GitHub Pages is free for public repos).

- GitHub Pages address: https://rory-lab.github.io/pep-site/ (redirects to pep.works once the domain is live)
- Custom domain: pep.works, set in the repo's Settings, Pages, and in `src/static/CNAME`

## DNS (Simon, at GoDaddy)

Replace the records for the website only. Leave every MX, TXT (SPF, DKIM, DMARC) and other record exactly as it is, so email is unaffected.

| Type | Name | Value |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | rory-lab.github.io |

Remove any other A or CNAME records on `@` and `www` that point at the old CMS. Once DNS resolves (usually within an hour), tick "Enforce HTTPS" in the repo's Settings, Pages.

## Still to do

- Request a demo form: connected to Formspree (form `xkjokgpg`, managed in Rory's Formspree account).
- Privacy and Terms: replace the holding text.
