from flask import request, jsonify, make_response
from flask_restful import Resource
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required
from flask_jwt_extended import get_jwt_identity
from flask_bcrypt import Bcrypt

from utils import encrypt_id

from database import User, Patient, HealthCareWorker, HealthCareFacility, db

bcrypt = Bcrypt()

class RegisterRoute(Resource):
    def post(self):
        role = request.json.get("role")
        password = request.json.get("password")
        national_id = request.json.get("national_id")
        national_id_encrypted = encrypt_id(national_id)
        password_hash = bcrypt.generate_password_hash(password, rounds=10)
        if role != "ADMIN":
            new_user = User(
                email=request.json.get("email"),
                password_hash=password_hash.decode("utf-8"),
                role=role
            )

            db.session.add(new_user)
            db.session.commit()

            if role == "PATIENT":
                new_patient = Patient(
                    national_id_encrypted=national_id_encrypted,
                    user_id=new_user.user_id
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
                response = make_response({"msg": "user role does not exist"})
                return response
            
            db.session.commit()
            match role:
                case "PATIENT":
                    response = make_response(new_user.to_dict(rules=("-healthcare_worker", )), 201)
                case "HEALTHCARE_WORKER":
                    response = make_response(new_user.to_dict(rules=("-patient", )))
            
            return response

        elif role == "ADMIN":
            response = make_response(
                {"msg": "contact an active admin for admin account creation"},
                401
            )

            return response

class LoginRoute(Resource):
    def post(self):
        email = request.json.get("email", None)
        password = request.json.get("password", None)

        if email != "test" or password != "test":
            return jsonify({"msg": "Bad username or password"}), 401
        
        access_token = create_access_token(identity=email)
        refresh_token = create_refresh_token(identity=email)
        return jsonify(access_token=access_token, refresh_token=refresh_token)
    
class RefreshRoute(Resource):
    method_decorators = [jwt_required(refresh=True)]

    def post(self):
        identity = get_jwt_identity()
        access_token = create_access_token(identity=identity)
        return jsonify(access_token=access_token)
