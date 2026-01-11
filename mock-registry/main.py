from flask import Flask, request, make_response
from flask_migrate import Migrate
from flask_cors import CORS

from dotenv import load_dotenv
load_dotenv()

import os
from functools import wraps

from data import db, PatientRegistryRecord

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"

CORS(app)

db.init_app(app)

Migrate(app, db)

def api_key_required(f):
    @wraps(f)
    def decorator(*args, **kwargs):
        api_key = request.headers.get("X-API-Key")
        if not api_key:
            return make_response({"message": "API key is missing!"}, 401)
        
        stored_key = os.getenv("AUTHORIZED_API_KEY")

        if not stored_key == api_key:
            return make_response({"message": "Invalid API key!"}, 401)
        
        # allow user to access the resource
        return f(*args, **kwargs)

@api_key_required
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
