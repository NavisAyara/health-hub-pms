import os

from flask import Flask
from flask_restful import Api
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv

load_dotenv()

from database.models import db
from routes.auth import LoginRoute

app = Flask(__name__)

app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("MARIADB_URI")
app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY")
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")

db.init_app(app)

Migrate(app, db)

api = Api(app)

jwt = JWTManager(app)

api.add_resource(LoginRoute, "/login")


@app.errorhandler(404)
def resource_not_found(error):
    return {"error": "bad resource"}
