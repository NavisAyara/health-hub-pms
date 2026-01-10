from flask import Flask
from flask_migrate import Migrate
from flask_cors import CORS

from data import db

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"

CORS(app)

db.init_app(app)

Migrate(app, db)

@app.route("/")
def home():
    return {"dang": "sup"}

