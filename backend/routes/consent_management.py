from datetime import datetime

from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import request, make_response

from database import ConsentRecord, Patient, HealthCareFacility, User, HealthCareWorker
from database import UserRole, Status
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

class GetConsents(Resource):

    @jwt_required()
    def get(self, url_id):
        user_id = get_jwt_identity()

        user = db.session.query(User).filter_by(user_id=int(user_id)).first()

        if user.role == UserRole.PATIENT and url_id == user_id or user.role == UserRole.ADMIN:
            consents = db.session.query(ConsentRecord).filter_by(granted_by=user_id).all()

            response = make_response(
                [consent_record.to_dict() for consent_record in consents],
                200
            )

            return response

        else:
            return make_response({"error": "unauthorized"}, 401)
        

class RevokeConsent(Resource):        

    @jwt_required()
    def patch(self, consent_id):
        user_id = get_jwt_identity()
        consent_record = db.session.query(ConsentRecord).filter_by(consent_id=consent_id).first()

        if consent_record and consent_record.granted_by == int(user_id):
            consent_record.status = Status.REVOKED
            db.session.commit()

            return make_response(consent_record.to_dict(), 200)
        
        else:
            return make_response({"error": "unauthorized"}, 401)


class GetConsentByID(Resource):

    @jwt_required()
    def get(self):
        user_id = get_jwt_identity()

        consent_id = request.args.get("consent_id")

        healthcare_worker = db.session.query(HealthCareWorker).filter_by(user_id=user_id).first()

        if healthcare_worker:
            consent_record = db.session.query(ConsentRecord).filter_by(consent_id=int(consent_id)).first()
            if consent_record and consent_record.facility_id == healthcare_worker.facility_id:
                response = make_response(consent_record.to_dict())

                return response
            
            return make_response({"data": "not found"}, 404)
        
        return make_response({"error": "unauthorized"}, 401)
