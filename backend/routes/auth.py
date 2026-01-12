from flask import request, jsonify, make_response
from flask_restful import Resource
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required
from flask_jwt_extended import get_jwt_identity
from flask_bcrypt import Bcrypt
import requests
import os

from dotenv import load_dotenv
load_dotenv()

import logging
from sqlalchemy.exc import SQLAlchemyError

logger = logging.getLogger(__name__)

from utils import encrypt_id

from database import User, Patient, HealthCareWorker, HealthCareFacility, db
from database import UserRole

bcrypt = Bcrypt()

def standardized_response(success: bool, message: str = None, data=None, status: int = 200):
    payload = {"success": success}
    if message:
        payload["message"] = message
    if data is not None:
        payload["data"] = data
    return make_response(jsonify(payload), status)

class RegisterRoute(Resource):
    def post(self):
        role = request.json.get("role")
        password = request.json.get("password")
        national_id = request.json.get("national_id")
        national_id_encrypted = encrypt_id(national_id)
        password_hash = bcrypt.generate_password_hash(password, rounds=10)

        if role == "ADMIN":
            return standardized_response(False, "admin_creation_restricted", status=401)

        new_user = User(
            email=request.json.get("email"),
            password_hash=password_hash.decode("utf-8"),
            role=role
        )

        db.session.add(new_user)
        # flush so we can use new_user.user_id without committing yet
        db.session.flush()

        if role == "PATIENT":
            # query the central registry to get the patient ID
            patient_id_response = requests.get(
                url=f"http://127.0.0.1:8080/api/registry/patients?national_id={national_id_encrypted}",
                headers={
                    "X-API-Key": os.getenv("REGISTRY_API_KEY")
                })
            patient_id = patient_id_response.json().get("patient_id")
            new_patient = Patient(
                national_id_encrypted=national_id_encrypted,
                user_id=new_user.user_id,
                patient_id=patient_id
            )

            db.session.add(new_patient)

        elif role == "HEALTHCARE_WORKER":
            facility = db.session.query(HealthCareFacility).filter_by(name=request.json.get("facility_name")).first()
            if facility:
                new_healthcare_worker = HealthCareWorker(
                    license_number=request.json.get("license_number"),
                    job_title=request.json.get("job_title"),
                    user_id=new_user.user_id,
                    facility_id=facility.facility_id,
                )

                db.session.add(new_healthcare_worker)
            else:
                db.session.rollback()
                return standardized_response(False, "facility_not_found", status=404)
        else:
            db.session.rollback()
            return standardized_response(False, "user_role_does_not_exist", status=400)

        try:
            db.session.commit()
        except SQLAlchemyError:
            db.session.rollback()
            logger.exception("Database transaction failed while creating user")
            return standardized_response(False, "database_transaction_failed", status=500)

        if role == "PATIENT":
            return standardized_response(True, data=new_user.to_dict(rules=("-healthcare_worker", )), status=201)
        elif role == "HEALTHCARE_WORKER":
            return standardized_response(True, data=new_user.to_dict(rules=("-patient", )), status=201)

class LoginRoute(Resource):
    def post(self):
        email = request.json.get("email", None)
        password = request.json.get("password", None)

        user = db.session.query(User).filter_by(email=email).first()

        if user and bcrypt.check_password_hash(user.password_hash, str(password).encode("utf-8")):
            access_token = create_access_token(identity=str(user.user_id))
            refresh_token = create_refresh_token(identity=str(user.user_id))
            user.last_login = db.func.now()
            try:
                db.session.commit()
            except SQLAlchemyError:
                db.session.rollback()
                logger.exception("Database transaction failed while updating last_login")
                return standardized_response(False, "database_transaction_failed", status=500)

            if user.role == UserRole.PATIENT:
                current_user = user.to_dict(rules=("-healthcare_worker", ))
                return standardized_response(True, data={"access_token": access_token, "refresh_token": refresh_token, "user": current_user})
            elif user.role == UserRole.HEALTHCARE_WORKER:
                return standardized_response(True, data={"access_token": access_token, "refresh_token": refresh_token})

        return standardized_response(False, "invalid_credentials", status=401)
    
class RefreshRoute(Resource):
    method_decorators = [jwt_required(refresh=True)]

    def post(self):
        identity = get_jwt_identity()
        access_token = create_access_token(identity=identity)
        return standardized_response(True, data={"access_token": access_token})
