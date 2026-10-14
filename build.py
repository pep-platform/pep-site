#!/usr/bin/env python3
"""Build the pep site (adapted from the boxcount.co build).

Each file in src/pages is a page body with a short front-matter block.
src/layout.html wraps every page, so the header and footer live in one place.
Everything in src/static is copied across untouched.
site.json holds the brand name, descriptor, domain, email and tagline, substituted as {{brand}} etc.

  python3 build.py            -> dist/     (full pages, for checking in a browser)
  python3 build.py --preview  -> preview/  (artifact preview: index page without its <html>/<head> wrapper)

Internal links keep .html so they work inside the artifact. Nothing here deploys anywhere.
"""
import json, pathlib, re, shutil, sys

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "src"
preview = "--preview" in sys.argv
OUT = ROOT / ("preview" if preview else "dist")

site = json.loads((ROOT / "site.json").read_text(encoding="utf-8"))
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


def render(meta, body):
    # Everything above <!--/masthead--> sits in the ink masthead with the header
    masthead, _, content = body.partition("<!--/masthead-->")
    if not content:
        masthead, content = "", body
    html = layout
    for key in ("title", "description", "path", "slug"):
        html = html.replace("{{" + key + "}}", meta.get(key, ""))
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

for page in sorted((SRC / "pages").glob("*.html")):
    meta, body = parse(page.read_text(encoding="utf-8"))
    html = render(meta, body)
    left = re.findall(r"\{\{\w+\}\}", html)
    if left:
        sys.exit(f"{page.name}: unfilled placeholders {sorted(set(left))}")
    if preview and page.name == "index.html":
        html = strip_wrapper(html)
    (OUT / page.name).write_text(html, encoding="utf-8")
    print("built", page.name)
