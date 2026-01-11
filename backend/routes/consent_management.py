from datetime import datetime

from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import request

from database import ConsentRecord, Patient, HealthCareFacility, User
from database import UserRole
from database import db

class NewConsent(Resource):
    
    @jwt_required()
    def post(self):
        user_id = get_jwt_identity()

        user = db.session.query(User).filter_by(user_id=user_id).first()

        if user:
            if user.role != UserRole.PATIENT:
                return {"error": "unouthorized"}, 401
            
            facility_name = request.json.get("facility_name")
            facility = db.session.query(HealthCareFacility).filter_by(name=facility_name).first()
            
            consent_type = request.json.get("consent_type")
            granted_at = db.func.now()
            expires_at = request.json.get("expires_at")
            purpose = request.json.get("purpose")
            patient_id = request.json.get("patient_id")
            granted_by = user.user_id

            new_consent = ConsentRecord(
                consent_type=consent_type,
                granted_at=granted_at,
                expires_at=datetime.fromisoformat(expires_at),
                purpose=purpose,
                patient_id=patient_id,
                granted_by=granted_by,
            )

            new_consent.facility = facility

            db.session.add(new_consent)
            db.session.commit()

            return new_consent.to_dict()
        
        return {"error": "not found"}, 404

