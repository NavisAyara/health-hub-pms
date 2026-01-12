from datetime import datetime

from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import request, make_response

import requests, os
import random
import secrets

from database import ConsentRecord, Patient, HealthCareFacility, User, HealthCareWorker, AccessLog
from database import UserRole, Status, EventAction, ConsentType
from database import db

from utils import decrypt_id

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

            return new_consent.to_dict(rules=("-facility.healthcare_workers", ))
        
        return {"error": "not found"}, 404
    
class GetConsents(Resource):

    @jwt_required()
    def get(self, url_id):
        user_id = get_jwt_identity()

        user = db.session.query(User).filter_by(user_id=int(user_id)).first()

        if user.role == UserRole.PATIENT and url_id == user_id or user.role == UserRole.ADMIN:
            consents = db.session.query(ConsentRecord).filter_by(granted_by=user_id).all()

            response = make_response(
                [consent_record.to_dict(rules=("-facility.healthcare_workers", )) for consent_record in consents],
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

            return make_response(consent_record.to_dict(rules=("-facility.healthcare_workers", )), 200)
        
        else:
            return make_response({"error": "unauthorized"}, 401)


class GetConsentByID(Resource):

    @jwt_required()
    def get(self):
        user_id = get_jwt_identity()
        consent_id = request.args.get("consent_id")
        national_id = request.args.get("national_id")

        healthcare_worker = db.session.query(HealthCareWorker).filter_by(user_id=user_id).first()
        consent_record = db.session.query(ConsentRecord).filter_by(consent_id=int(consent_id)).first()

        if healthcare_worker and consent_record:
            consent_record = db.session.query(ConsentRecord).filter_by(patient_id=consent_record.patient.patient_id).first()
            if consent_record and consent_record.facility_id == healthcare_worker.facility_id:
                status = consent_record.to_dict(rules=("-facility.healthcare_workers", ))["status"]
            
                if status == "active":
                    patient_id_response = requests.get(
                        url=f"http://127.0.0.1:8080/api/registry/patients?national_id={national_id}",
                        headers={
                            "X-API-Key": os.getenv("REGISTRY_API_KEY")
                        })
                patient_data = patient_id_response.json()
                patient = db.session.query(Patient).filter_by(patient_id=patient_data["patient_id"]).first()

                for k, v in patient_data.items():
                    setattr(patient, k, v)

                if consent_record.consent_type == ConsentType.VIEW:
                    action = EventAction.VIEW
                elif consent_record.consent_type == ConsentType.SHARE:
                    action = EventAction.SHARE
                else:
                    action = EventAction.EDIT

                new_log = AccessLog(
                    result="ALLOWED" if status == "active" else "DENIED",
                    reason="Consent Check",
                    patient_id=consent_record.patient_id,
                    accessed_by=healthcare_worker.worker_id,
                    ip_address="192.168.1.1",
                    action=action
                )

                db.session.add(new_log)

                db.session.commit()
                return make_response({"data": patient.to_dict(rules=("-access_logs", "-consent_records"))}, 200)
            
            return make_response({"data": "not found"}, 404)

        if consent_record and healthcare_worker:
            new_log = AccessLog(
                result="DENIED",
                reason="No Active Consent",
                patient_id=consent_record.patient_id,
                accessed_by=healthcare_worker.worker_id,
                ip_address="192.168.1.1",
                action=action
            )

            db.session.add(new_log)

            db.session.commit()
        
        return make_response({"error": "unauthorized"}, 401)
