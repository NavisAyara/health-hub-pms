from datetime import datetime

from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import request, make_response, jsonify

import requests, os
import logging
from sqlalchemy.exc import SQLAlchemyError

logger = logging.getLogger(__name__)

from database import ConsentRecord, Patient, HealthCareFacility, User, HealthCareWorker, AccessLog
from database import UserRole, Status, EventAction, ConsentType
from database import db

def make_standard_response(success: bool, message: str = None, data=None, status: int = 200):
    payload = {"success": success}
    if message:
        payload["message"] = message
    if data is not None:
        payload["data"] = data
    return make_response(jsonify(payload), status)

class NewConsent(Resource):
    
    @jwt_required()
    def post(self):
        user_id = get_jwt_identity()

        user = db.session.query(User).filter_by(user_id=user_id).first()

        if not user:
            return make_standard_response(False, "not_found", status=404)

        if user.role != UserRole.PATIENT:
            return make_standard_response(False, "unauthorized", status=401)
            
        facility_name = request.json.get("facility_name")
        facility = db.session.query(HealthCareFacility).filter_by(name=facility_name).first()
        if not facility:
            return make_standard_response(False, "facility_not_found", status=404)

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
        try:
            db.session.commit()
        except SQLAlchemyError:
            db.session.rollback()
            logger.exception("Database transaction failed while creating consent record")
            return make_standard_response(False, "database_transaction_failed", status=500)

        return make_standard_response(True, data=new_consent.to_dict(rules=("-facility.healthcare_workers", )), status=201)
    
class GetConsents(Resource):

    @jwt_required()
    def get(self, url_id):
        user_id = get_jwt_identity()

        user = db.session.query(User).filter_by(user_id=int(user_id)).first()
        if not user:
            return make_standard_response(False, "not_found", status=404)

        if user.role == UserRole.ADMIN:
            # If admin, fetch by the patient_id passed in URL
            consents = db.session.query(ConsentRecord).filter_by(patient_id=url_id).all()
            data = [consent_record.to_dict(rules=("-facility.healthcare_workers", )) for consent_record in consents]
            return make_standard_response(True, data=data)

        if user.role == UserRole.PATIENT and user.patient and str(url_id) == str(user.patient.patient_id):
            consents = db.session.query(ConsentRecord).filter_by(granted_by=user_id).all()
            data = [consent_record.to_dict(rules=("-facility.healthcare_workers", )) for consent_record in consents]
            return make_standard_response(True, data=data)

        return make_standard_response(False, "unauthorized", status=401)
        

class RevokeConsent(Resource):        

    @jwt_required()
    def patch(self, consent_id):
        user_id = get_jwt_identity()
        consent_record = db.session.query(ConsentRecord).filter_by(consent_id=consent_id).first()

        if not consent_record:
            return make_standard_response(False, "not_found", status=404)

        if consent_record.granted_by != int(user_id):
            return make_standard_response(False, "unauthorized", status=401)

        consent_record.status = Status.REVOKED
        try:
            db.session.commit()
        except SQLAlchemyError:
            db.session.rollback()
            logger.exception("Database transaction failed while revoking consent")
            return make_standard_response(False, "database_transaction_failed", status=500)

        return make_standard_response(True, data=consent_record.to_dict(rules=("-facility.healthcare_workers", )))


class GetConsentByID(Resource):

    @jwt_required()
    def get(self):
        user_id = get_jwt_identity()
        consent_id = request.args.get("consent_id")
        national_id = request.args.get("national_id")

        healthcare_worker = db.session.query(HealthCareWorker).filter_by(user_id=user_id).first()
        if not healthcare_worker:
            return make_standard_response(False, "unauthorized", status=401)
        
        consent_record = None # The consent record granted BY the patient

        # If consent_id is provided, use the old logic (but slightly improved path)
        if consent_id: 
            consent_record_meta = db.session.query(ConsentRecord).filter_by(consent_id=int(consent_id)).first()
            if not consent_record_meta:
                 return make_standard_response(False, "not_found", status=404)
            # load consent for the patient linked to this consent_record
            consent_record = db.session.query(ConsentRecord).filter_by(patient_id=consent_record_meta.patient.patient_id).first()
        
        # If no consent_id, try to find patient via national_id
        elif national_id:
             # 1. Get patient_id from registry
            patient_id_response = requests.get(
                url=f"{os.getenv('MOCK_REGISTRY_URL', 'http://127.0.0.1:8080')}/api/registry/patients?national_id={national_id}",
                headers={
                    "X-API-Key": os.getenv("REGISTRY_API_KEY")
                })
            
            if patient_id_response.status_code != 200:
                 return make_standard_response(False, "patient_not_found_in_registry", status=404)
            
            registry_data = patient_id_response.json()
            patient_id = registry_data.get("patient_id")

            # 2. Find consent for this patient at this facility
            # LIMITATION: Only picks the first one found.
            consent_record = db.session.query(ConsentRecord).join(HealthCareFacility).filter(
                ConsentRecord.patient_id == patient_id,
                ConsentRecord.facility_id == healthcare_worker.facility_id
            ).first()

        if not consent_record or consent_record.facility_id != healthcare_worker.facility_id:
            return make_standard_response(False, "no_valid_consent_found", status=404)

        status = consent_record.to_dict(rules=("-facility.healthcare_workers", ))["status"]

        # fetch patient data from registry if consent is active
        patient_data = None
        if status == "active":
             # Optimization: reuse registry_data if we have it and it matches (optional, but cleaner to re-fetch or use logic)
             # For simplicity to match existing flow structure:
            if national_id: # We have national_id in args
                patient_id_response = requests.get(
                    url=f"{os.getenv('MOCK_REGISTRY_URL', 'http://127.0.0.1:8080')}/api/registry/patients?national_id={national_id}",
                    headers={
                        "X-API-Key": os.getenv("REGISTRY_API_KEY")
                    })
                patient_data = patient_id_response.json()

        patient = None
        if patient_data:
            patient = db.session.query(Patient).filter_by(patient_id=patient_data.get("patient_id")).first()
            if patient:
                for k, v in patient_data.items():
                    setattr(patient, k, v)

        # determine action from consent type
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
        try:
            db.session.commit()
        except SQLAlchemyError:
            db.session.rollback()
            logger.exception("Database transaction failed while logging access")
            return make_standard_response(False, "database_transaction_failed", status=500)

        if status == "active" and patient:
            patient_response = patient.to_dict(rules=("-access_logs", "-consent_records"))
            # Append all data from registry to the response so frontend gets everything it needs
            if patient_data:
                patient_response.update(patient_data)
            return make_standard_response(True, data=patient_response)

        return make_standard_response(False, "consent_not_active", status=403)


class GetFacilityConsents(Resource):

    @jwt_required()
    def get(self):
        user_id = get_jwt_identity()

        user = db.session.query(User).filter_by(user_id=int(user_id)).first()
        if not user or user.role != UserRole.HEALTHCARE_WORKER:
            return make_standard_response(False, "unauthorized", status=401)
        
        healthcare_worker = user.healthcare_worker
        if not healthcare_worker:
            return make_standard_response(False, "worker_profile_not_found", status=404)

        consents = db.session.query(ConsentRecord).filter_by(facility_id=healthcare_worker.facility_id).all()
        
        # Enhanced serialization to include patient details if available locally
        data = []
        for c in consents:
            c_dict = c.to_dict(rules=("-facility.healthcare_workers", ))
            # If we want to show patient name, we need to join or fetch. 
            if c.patient and c.patient.user:
                 c_dict['patient_name'] = f"{c.patient.first_name} {c.patient.last_name}"
            data.append(c_dict)

        return make_standard_response(True, data=data)
