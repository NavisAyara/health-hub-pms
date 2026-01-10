import os

from flask import Flask
from flask_restful import Api
from flask_migrate import Migrate
from dotenv import load_dotenv

load_dotenv()

from database.models import db

app = Flask(__name__)

app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("SQLALCHEMY_DATABASE_URI")

db.init_app(app)

Migrate(app, db)

api = Api(app)
