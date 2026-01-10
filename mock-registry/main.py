from flask import Flask, request, make_response
from flask_migrate import Migrate
from flask_cors import CORS

from data import db, PatientRegistryRecord

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"

CORS(app)

db.init_app(app)

Migrate(app, db)

@app.route("/api/registry/patients")
def patient_data():
    received_id = request.args.get("national_id")

    patient = db.session.query(PatientRegistryRecord).filter_by(national_id=received_id).first()

    if patient:
        response = make_response(
            patient.to_dict()
        )

        return response
    
    response = make_response({"data": "not found!"}, 404)
    response.headers["Content-Type"] = "json"

    return response

@app.errorhandler(404)
def not_found_handler(error):
    response = make_response({"data": "not found"}, 404)
    response.headers["Content-Type"] = "json"

    return response
