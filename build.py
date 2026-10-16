#!/usr/bin/env python3
"""Build the pep site (adapted from the boxcount.co build).

Each file in src/pages is a page body with a short front-matter block.
src/layout.html wraps every page, so the header and footer live in one place.
Everything in src/static is copied across untouched.
site.json holds the brand name, descriptor, domain, email and tagline, substituted as {{brand}} etc.

  python3 build.py            -> dist/     (full pages, for checking in a browser)
  python3 build.py --preview  -> preview/  (artifact preview: index page without its <html>/<head> wrapper)

Internal links keep .html so they work inside the artifact. Every push to main deploys dist/ to pep.works.
The full build also writes sitemap.xml and robots.txt; pages with `robots: noindex` are left out of the sitemap.
"""
import json, pathlib, re, shutil, sys

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "src"
preview = "--preview" in sys.argv
OUT = ROOT / ("preview" if preview else "dist")

site = json.loads((ROOT / "site.json").read_text(encoding="utf-8"))
# header lockup beside the word mark: the descriptor without its leading "The"
site.setdefault("lockup", re.sub(r"^The\s+", "", site["descriptor"]))
layout = (SRC / "layout.html").read_text(encoding="utf-8")


def brand(text):
    for k, v in site.items():
        text = text.replace("{{" + k + "}}", v)
    return text


def parse(text):
    m = re.match(r"---\n(.*?)\n---\n(.*)", text, re.S)
    meta = {}
    for line in m.group(1).splitlines():
        k, _, v = line.partition(":")
        meta[k.strip()] = v.strip()
    return meta, m.group(2)


def structured_data(slug):
    """JSON-LD for search engines. Organisation and website on every page, plus page-specific types."""
    base = f"https://{site['domain']}"
    rory = {"@type": "Person", "name": "Rory Natkiel", "jobTitle": "Founder, Box Count",
            "worksFor": {"@type": "Organization", "name": "Box Count", "url": "https://boxcount.co"}}
    simon = {"@type": "Person", "name": "Simon Spyer", "jobTitle": "Founder, Data Agents",
             "worksFor": {"@type": "Organization", "name": "Data Agents", "url": "https://data-agents.co.uk"}}
    graph = [
        {"@type": "Organization", "@id": f"{base}/#org", "name": site["brand"], "url": f"{base}/",
         "logo": f"{base}/assets/logo.png", "email": site["email"],
         "description": f"{site['descriptor']}: AI-based sponsorship strategy and evaluation, designed and built by Box Count and Data Agents.",
         "founder": [rory, simon]},
        {"@type": "WebSite", "@id": f"{base}/#website", "name": site["brand"], "url": f"{base}/",
         "publisher": {"@id": f"{base}/#org"}, "inLanguage": "en-GB"},
    ]
    if slug == "product":
        graph.append({"@type": "SoftwareApplication", "name": site["brand"], "url": f"{base}/product.html",
                      "applicationCategory": "BusinessApplication", "operatingSystem": "Web",
                      "description": "Sponsorship strategy and measurement software with two modules: a Strategy Module for objectives, KPI frameworks and partner fit, and a Measurement Module for performance against objectives and scenario modelling.",
                      "publisher": {"@id": f"{base}/#org"}})
    if slug == "founders":
        r = dict(rory, description="Founder of Box Count; co-founder and chair of the Sponsorship Effectiveness Forum; author of The Sponsorship Effect, Sponsorship Measurement: A Best Practice Guide and All To Play For (SEF × IPA).")
        s = dict(simon, description="Founder of Data Agents, an AI strategy and execution consultancy for marketing teams.")
        graph += [r, s]
    data = json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False)
    return f'<script type="application/ld+json">{data}</script>'


def render(meta, body):
    # Everything above <!--/masthead--> sits in the ink masthead with the header
    masthead, _, content = body.partition("<!--/masthead-->")
    if not content:
        masthead, content = "", body
    html = layout
    for key in ("title", "description", "path", "slug"):
        html = html.replace("{{" + key + "}}", meta.get(key, ""))
    robots = '<meta name="robots" content="noindex">\n' if meta.get("robots") == "noindex" else ""
    html = html.replace("{{robots}}", robots).replace("{{jsonld}}", structured_data(meta.get("slug")))
    if meta.get("slug") == "404":
        # served at any missing path, so relative links must resolve from the site root
        html = html.replace("<!--HEAD-->", '<!--HEAD-->\n<base href="/">', 1)
    html = html.replace("{{masthead}}", masthead.strip()).replace("{{content}}", content.strip())
    # mark the current page in the nav
    html = html.replace(f'data-nav="{meta.get("slug")}"', f'data-nav="{meta.get("slug")}" aria-current="page"')
    return brand(html)


def strip_wrapper(html):
    """The artifact gives its page its own document wrapper, so keep only head tags + body content."""
    head = re.search(r"<!--HEAD-->(.*?)<!--/HEAD-->", html, re.S).group(1)
    body = re.search(r"<body[^>]*>(.*)</body>", html, re.S).group(1)
    return head.strip() + "\n" + body.strip() + "\n"


if OUT.exists():
    shutil.rmtree(OUT)
shutil.copytree(SRC / "static", OUT)

indexable = []
for page in sorted((SRC / "pages").glob("*.html")):
    meta, body = parse(page.read_text(encoding="utf-8"))
    if meta.get("robots") != "noindex":
        indexable.append(meta["path"])
    html = render(meta, body)
    left = re.findall(r"\{\{\w+\}\}", html)
    if left:
        sys.exit(f"{page.name}: unfilled placeholders {sorted(set(left))}")
    if not preview:
        # real hosting and local files: the home link points at index.html (the artifact preview needs ./)
        html = html.replace('href="./"', 'href="index.html"')
    if preview and page.name == "index.html":
        html = strip_wrapper(html)
    (OUT / page.name).write_text(html, encoding="utf-8")
    print("built", page.name)

# search engines: sitemap of indexable pages (home first), and robots.txt pointing at it
if not preview:
    base = f"https://{site['domain']}"
    today = __import__("datetime").date.today().isoformat()
    urls = sorted(indexable, key=lambda p: (p != "/", p))
    entries = "\n".join(f"  <url><loc>{base}{p}</loc><lastmod>{today}</lastmod></url>" for p in urls)
    (OUT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + entries + "\n</urlset>\n", encoding="utf-8")
    (OUT / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {base}/sitemap.xml\n", encoding="utf-8")
    print("built sitemap.xml, robots.txt")
