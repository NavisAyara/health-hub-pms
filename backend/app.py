import os
from datetime import timedelta

from flask import Flask
from flask_restful import Api
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv

load_dotenv()

from database.models import db
from routes.auth import LoginRoute, RegisterRoute

app = Flask(__name__)

app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("MARIADB_URI")
app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY")
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=15)
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=7)

db.init_app(app)

Migrate(app, db)

api = Api(app)

jwt = JWTManager(app)

api.add_resource(LoginRoute, "/login")
api.add_resource(RegisterRoute, "/register")


@app.errorhandler(404)
def resource_not_found(error):
    return {"error": "bad resource"}
