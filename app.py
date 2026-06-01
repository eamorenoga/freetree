from flask import Flask, render_template


app = Flask(__name__)


@app.route("/")
def show_links():
    links = [
        {"name": "Python", "url": "https://www.python.org/"},
        {"name": "Flask", "url": "https://flask.palletsprojects.com/"},
        {"name": "Wikipedia", "url": "https://www.wikipedia.org/"},
    ]
    return render_template("links.html", links=links)


if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)
