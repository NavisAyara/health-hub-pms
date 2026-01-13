import os
from datetime import timedelta

from flask import Flask
from flask_restful import Api
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

from database import db
from routes import LoginRoute, RegisterRoute, RefreshRoute
from routes import NewConsent, GetConsents, RevokeConsent, GetConsentByID, GetFacilityConsents
from routes import Facilities, PatientAccessLogs, AdminAccessLogs

app = Flask(__name__)

app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("MARIADB_URI")
app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY")

# JWT config
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=15)
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=7)

db.init_app(app)

Migrate(app, db, directory="database/migrations")
CORS(app)

api = Api(app)

jwt = JWTManager(app)

api.add_resource(LoginRoute, "/login")
api.add_resource(RegisterRoute, "/register")
api.add_resource(RefreshRoute, "/auth/token-refresh")

api.add_resource(NewConsent, "/api/consents")
api.add_resource(GetConsents, "/api/consents/patient/<url_id>")
api.add_resource(RevokeConsent, "/api/consents/<consent_id>/revoke")
api.add_resource(GetConsentByID, "/api/consents/check")
api.add_resource(GetFacilityConsents, "/api/consents/facility")
api.add_resource(Facilities, "/facilities")
api.add_resource(PatientAccessLogs, "/api/access-logs/user/<user_id>")
api.add_resource(AdminAccessLogs, "/api/admin/access-logs")


@app.errorhandler(404)
def resource_not_found(error):
    return {"error": "bad resource"}, 404
