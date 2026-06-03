import json
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup
from flask import Flask, redirect, render_template, request, url_for


app = Flask(__name__)

UNAVAILABLE_TEXT = "No disponible"
DATA_FILE = Path(__file__).with_name("links.json")

DEFAULT_LINKS = [
    {
        "name": "Python",
        "url": "https://www.python.org/",
        "title": UNAVAILABLE_TEXT,
        "description": UNAVAILABLE_TEXT,
        "image_url": UNAVAILABLE_TEXT,
    },
    {
        "name": "Flask",
        "url": "https://flask.palletsprojects.com/",
        "title": UNAVAILABLE_TEXT,
        "description": UNAVAILABLE_TEXT,
        "image_url": UNAVAILABLE_TEXT,
    },
    {
        "name": "Wikipedia",
        "url": "https://www.wikipedia.org/",
        "title": UNAVAILABLE_TEXT,
        "description": UNAVAILABLE_TEXT,
        "image_url": UNAVAILABLE_TEXT,
    },
]


def load_links():
    if not DATA_FILE.exists():
        return DEFAULT_LINKS.copy()

    try:
        with DATA_FILE.open(encoding="utf-8") as links_file:
            saved_links = json.load(links_file)
    except (json.JSONDecodeError, OSError):
        return DEFAULT_LINKS.copy()

    return [normalize_link(saved_link) for saved_link in saved_links]


def normalize_link(link):
    return {
        "name": link.get("name", UNAVAILABLE_TEXT),
        "url": link.get("url", ""),
        "title": link.get("title", UNAVAILABLE_TEXT),
        "description": link.get("description", UNAVAILABLE_TEXT),
        "image_url": link.get("image_url", UNAVAILABLE_TEXT),
    }


def save_links():
    with DATA_FILE.open("w", encoding="utf-8") as links_file:
        json.dump(links, links_file, ensure_ascii=True, indent=2)


def get_meta_content(soup, *selectors):
    for selector in selectors:
        meta_tag = soup.select_one(selector)
        if meta_tag and meta_tag.get("content"):
            return meta_tag["content"].strip()

    return UNAVAILABLE_TEXT


def fetch_link_metadata(site_url):
    metadata = {
        "title": UNAVAILABLE_TEXT,
        "description": UNAVAILABLE_TEXT,
        "image_url": UNAVAILABLE_TEXT,
    }

    try:
        response = requests.get(site_url, timeout=5)
        response.raise_for_status()
    except requests.RequestException:
        return metadata

    soup = BeautifulSoup(response.text, "html.parser")

    metadata["title"] = get_meta_content(
        soup,
        'meta[property="og:title"]',
        'meta[name="twitter:title"]',
    )
    if metadata["title"] == UNAVAILABLE_TEXT and soup.title and soup.title.string:
        metadata["title"] = soup.title.string.strip() or UNAVAILABLE_TEXT

    metadata["description"] = get_meta_content(
        soup,
        'meta[name="description"]',
        'meta[property="og:description"]',
        'meta[name="twitter:description"]',
    )
    metadata["image_url"] = get_meta_content(
        soup,
        'meta[property="og:image"]',
        'meta[name="twitter:image"]',
        'meta[itemprop="image"]',
    )
    if metadata["image_url"] != UNAVAILABLE_TEXT:
        metadata["image_url"] = urljoin(site_url, metadata["image_url"])

    return metadata


def build_link(site_name, site_url):
    return {"name": site_name, "url": site_url, **fetch_link_metadata(site_url)}


links = load_links()


@app.route("/")
def show_links():
    return render_template("index.html", links=links, unavailable_text=UNAVAILABLE_TEXT)


@app.route("/add", methods=["POST"])
def add_link():
    site_name = request.form.get("site_name", "").strip()
    site_url = request.form.get("site_url", "").strip()

    if site_name and site_url:
        links.append(build_link(site_name, site_url))
        save_links()

    return redirect(url_for("show_links"))


@app.route("/delete/<int:link_index>", methods=["POST"])
def delete_link(link_index):
    if 0 <= link_index < len(links):
        links.pop(link_index)
        save_links()

    return redirect(url_for("show_links"))


@app.route("/edit/<int:link_index>")
def edit_link(link_index):
    if not 0 <= link_index < len(links):
        return redirect(url_for("show_links"))

    return render_template("edit.html", link=links[link_index], link_index=link_index)


@app.route("/edit/<int:link_index>", methods=["POST"])
def update_link(link_index):
    site_name = request.form.get("site_name", "").strip()
    site_url = request.form.get("site_url", "").strip()

    if 0 <= link_index < len(links) and site_name and site_url:
        links[link_index] = build_link(site_name, site_url)
        save_links()

    return redirect(url_for("show_links"))


if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)
