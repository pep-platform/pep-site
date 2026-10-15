# pep website rebuild: working guide

The pep website, pep.works. Rory asks for changes in chat; Claude edits this repo, checks the result and pushes to `main`. **Every push to `main` deploys to GitHub Pages** (`.github/workflows/pages.yml` builds with `python3 build.py` and publishes `dist/`), with pep.works as the custom domain (`src/static/CNAME`). The domain's DNS is at GoDaddy and is managed by Simon; don't change DNS or Simon's old CMS. Show Rory a private preview first for anything bigger than a copy tweak.

## Workflow

1. `git pull --rebase origin main`.
2. Edit `src/` (and `site.json`) only. `dist/` and `preview/` are generated and git-ignored.
3. `python3 build.py` builds into `dist/` (full pages, for checking in a browser). `python3 build.py --preview` builds into `preview/` (same, but `index.html` without its `<html>/<head>` wrapper, because the artifact wraps the page itself).
4. Check every changed page in a browser (Playwright) at 1280px and 390px. Look, don't assume. Serve `dist/` over http (`python3 -m http.server`), since home links are `./`.
5. Publish `preview/` as one private multi-file artifact: `index.html` as the page, the other pages, CSS and JS as `files`, so links between pages work. Republish to the same artifact each time so Rory keeps one link: https://claude.ai/artifact/YYemQgua42rXHZ1XZYPxtS (pass it as `url` from a new conversation).
6. Commit as Rory and push. This deploys the live site within a couple of minutes:
   `git -c user.name="Rory Natkiel" -c user.email="rorynatkiel@gmail.com" commit -m "..."` then `git push origin HEAD:main`.
7. Tell Rory in a line or two what changed.

For new directions, show two or three mockups before building. Make the change asked for, not a wider redesign.

## Build approach

Mirrors boxcount.co (rory-lab/boxcount-site) and reuses its build script.

- `site.json` holds the product name, descriptor, domain, contact email and footer tagline. Pages and layout use them as `{{brand}}`, `{{descriptor}}`, `{{domain}}`, `{{email}}`, `{{tagline}}`. A rename is a one-line edit there.
- `src/layout.html` holds the shared head, header, nav and footer.
- `src/pages/*.html` has one file per page, with front matter (`title`, `description`, `path`, `slug`). Everything above `<!--/masthead-->` goes in the ink masthead with the header.
- `src/static/` is copied as-is (styles.css, site.js).
- Internal links keep `.html` so they work inside the artifact; the home link is `./`. Clean URLs can come later, with hosting.
- Archivo (variable, with the wdth axis) loads from Google Fonts. SVGs are inline. The site is self-contained so previews render.
- Product page screens (`.pf` frames, styles in styles.css, tabs and scenario logic in site.js) are rebuilt from the beta app on a fictional sample deal: Acme Shaving × Harbour City FC. Never name real properties (no NFL). The scenario channel-to-objective mapping is an approximation, not the product's logic.
- The early-access form posts to Formspree (`https://formspree.io/f/xkjokgpg`, in `action` and `data-endpoint`); site.js sends it by fetch with `Accept: application/json` and shows the result inline. `_gotcha` is the spam honeypot.

## Pages

| Page | Purpose |
|---|---|
| index | Hero, one platform, the objectives problem, the two modules, service as software, why this isn't just AI, CTA |
| product | Strategy Module and Measurement Module in detail |
| method | How the Box Count workflow and Data Agents' frameworks are encoded; knowledge modules; where the people come in |
| founders | Rory and Simon, why the two of them |
| early-access | Founding-cohort form (nav label "Request a demo") |
| privacy, terms | Legal (holding text; copy to come from the live site or Rory) |

## Brand: pep Identity System v3, "Flare Orange · Full Volume" (October 2026)

This replaces v1 completely. Never bring back v1's green, cream paper, Space Grotesk, Inter or dot icon. The source is `pep identity v3.pdf`; it was written as the build reference for the beta app, and the website uses its marketing register.

- **Idea:** one colour fills the surface. One typeface, set wide and heavy. Hard edges, no ornament.
- **Word mark:** there is no symbol; the word mark is the identity.
  - Lowercase "pep" in Archivo 900, width 125, tracked to −0.045em.
  - Never outlined, rotated, gradiented, letterspaced, capitalised or put in a container.
  - Crop it at display scale. Clear space equals the cap height, on the uncropped sides only.
  - Minimum size is 44px wide. Below that, use the cropped "p" tile, which is for favicons, avatars and app icons only.
  - App icon: square, never rounded by us. The "p" is oversized and cropped left and bottom.
- **Colour:**
  - Flare Orange `#FF6B00` (`--pep-accent`), Ink `#0B0B0B` (`--pep-ink`), White `#FFFFFF` (`--pep-surface`).
  - Orange states only: hover `#FF8533`, active `#D95A00`, selected `#FFF0E5`. No other tints.
  - Orange is never used at reduced opacity, as a gradient, or as a large background behind body copy.
  - Neutrals: elevated dark `#141414`, border on dark `#2A2A2A`, secondary text `#6E6E6E`, disabled `#9E9E9E`, rules on light `#E4E4E4`, subtle fill `#F4F4F4`.
  - Semantic colours (positive `#0A7C5A`, negative `#C51A1A`, warning `#8A6A00`, info `#1B3CF5`) are for interface and product mock-ups only. Never in brand communications, never filling a surface, never next to orange at the same weight.
- **Type:** Archivo variable, one family for everything. Width does the heavy lifting.
  - Display XL: 96/88, 900, wdth 125, −.045em. Marketing only, never below 40px.
  - Display L: 64/60, 800, wdth 118, −.035em. Hero lines and section openers.
  - H1: 40/44, 800, wdth 100, −.02em.
  - H2: 28/32, 700, −.015em.
  - H3: 20/26, 700, −.01em.
  - Body L: 18/28, 400. Body: 16/24, 400.
  - Label: 13/16, 600, .12em, uppercase. Nothing smaller than 13px.
  - Numerals are always tabular. Metrics may be orange; labels never are.
- **Layout:**
  - 4px base. Spacing steps are 4, 8, 12, 16, 24, 32, 48, 64 and 96, with nothing in between.
  - `border-radius: 0` on everything.
  - Rules instead of shadows: 1px `#E4E4E4` separates rows, 2px ink closes a section, 3px orange opens one. No drop shadows, glows or gradients anywhere.
  - Colour fills the surface edge to edge (the cover is ink, with an orange mark and white display type).
- **Motion:** flat and fast. State changes take 120ms; enter and exit take 200ms. Easing is `cubic-bezier(.2,0,0,1)`, using translate and opacity only. No bounce, spring or scale on hover.
- **Components:**
  - Buttons are 48, 40 or 32px high, with one primary orange action per view.
  - Hover changes colour only.
  - Focus is a 2px ink ring at 3px offset on light surfaces, and orange on dark ones.
  - Status chips are square and bordered.
  - Tables use 56px rows and tabular figures.
- **Product previews** (useful on the site to show the product):
  - Black chrome, a white work surface, and orange only for the primary action and the one number each screen is about.
  - Dark surfaces are for partner-facing outputs: reports, decks, share cards.
  - Charts have one orange series; everything comparative is `#E4E4E4`. Direct labels instead of legends, and a single ink baseline with no other gridlines.
  - Use the identity's sample data style, with fictional partners (Northgate Energy, Halden Bank).
- **Voice:**
  - Short and declarative, "like a coach, not a consultant".
  - The register to aim for: "Put some pep in your sponsorships." "Stop guessing. Start proving."
  - Never "Leverage AI-powered partnership intelligence", and no exclamation marks.
  - The brand is confident and lightly playful; product outputs stay sober.
- **Rory's standing rules override the identity doc:**
  - No eyebrows (small labels above headings), even though the identity uses uppercase labels that way. Uppercase labels are fine for form fields, table headers and metric labels, never above a heading.
  - Bullets are hollow orange circles, never dashes (Rory's choice, October 2026).

## Positioning and copy

- **What pep is**, in Rory's words: an AI-based, end-to-end sponsorship strategy and evaluation platform, designed and built by Rory Natkiel (Box Count) and Simon Spyer (Data Agents).
- **Service as software:** practitioners stay in the loop. Make that clear without being overt about "you get us". The live copy reads as self-serve, which Rory doesn't want.
- **Long positioning:** pep is rigorous, full-lifecycle and transparent.
  - Rigorous: built on marketing science, objectives first. No AVE, no media-value theatre.
  - Full-lifecycle: from prospecting and proposal through deal setup, performance and renewal.
  - Transparent: both sides of the deal see how every number is produced.
- **Modules:**
  - Strategy Module (Box Count): objectives, KPI frameworks, partner fit, prospecting, effectiveness-led pitch proposals.
  - Measurement Module (Data Agents): live and batch data, performance against objectives, scenario modelling.
- Each module is bought alone or combined, self-serve or managed.
- **Audiences:** rights holders (the year-one sales focus is UK premium rights holders), brands and agencies. Not only sport: arts, music, festivals and events too.
- **Naming constraints:**
  - Don't use "sponsorship effectiveness" as the descriptor.
  - Nothing that evokes Guardiola.
  - Until the new name arrives, the descriptor on the live site is "The Partnership Effectiveness Platform".
- **House style:**
  - UK English, no em dashes.
  - Never "authentic", "engagement", "in other words", or "that matters" as a standalone sentence.
  - No structural signposting. Evidence-led, precise, no repetition or padding.
- **Rory's credentials, as he words them:**
  - Founder of Box Count; co-founder and chair of the Sponsorship Effectiveness Forum.
  - Author of The Sponsorship Effect (SEF, 2025, 92 global case studies), Sponsorship Measurement: A Best Practice Guide, and All To Play For (SEF × IPA, October 2026, the first report on sports sponsorship ever published by the IPA).
  - IPA Advanced Effectiveness Practitioner.
  - 15+ years in senior strategy roles at Iris and Sid Lee Sport, with sponsors including adidas, Lidl, Tommy Hilfiger and OPPO.

## Open decisions (from the October 2026 copy)

1. Single evaluation block ("Try it on one deal"): left off until the £300 query is live and the price decision is made.
2. "Less than half of sponsorships…" stat on Home: needs a citable source, or a replacement.
3. Net-zero AI: off the site until the scheme is confirmed; it can return as a footer note.
4. Founders: confirm "Chair" (the copy uses All To Play For for the SEF × IPA report).

## Known issues on the live site (fixed in this rebuild)

- Founders: "Sponsorship Effectiveness Fundamentals" wrongly called a joint SEF × IPA publication; missing space in "in 2026After 15 years".
- Method: the typo "sponsorshio", and an unfinished line about Simon's work at Data Agents.
- Home: the net-zero AI section still says "[insert scheme]".
- Live contact: hello@pep.works. This will change with the rename.
