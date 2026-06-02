from flask import Flask, redirect, render_template, request, url_for


app = Flask(__name__)

links = [
    {"name": "Python", "url": "https://www.python.org/"},
    {"name": "Flask", "url": "https://flask.palletsprojects.com/"},
    {"name": "Wikipedia", "url": "https://www.wikipedia.org/"},
]


@app.route("/")
def show_links():
    return render_template("index.html", links=links)


@app.route("/add", methods=["POST"])
def add_link():
    site_name = request.form.get("site_name", "").strip()
    site_url = request.form.get("site_url", "").strip()

    if site_name and site_url:
        links.append({"name": site_name, "url": site_url})

    return redirect(url_for("show_links"))


if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)
