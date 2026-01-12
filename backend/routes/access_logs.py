from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import jsonify, make_response
from database import db, AccessLog, User, Patient, UserRole

def make_standard_response(success: bool, message: str = None, data=None, status: int = 200):
    payload = {"success": success}
    if message:
        payload["message"] = message
    if data is not None:
        payload["data"] = data
    return make_response(jsonify(payload), status)

class PatientAccessLogs(Resource):
    
    @jwt_required()
    def get(self, user_id):
        current_user_id = get_jwt_identity()

        # Authorization check: Ensure the requester is accessing their own logs or is an admin
        # Note: The route parameter is user_id. We should check if current_user_id matches user_id
        # If I am a patient, I should only see my logs.
        
        user = db.session.query(User).filter_by(user_id=int(user_id)).first()
        
        if not user:
            return make_standard_response(False, "user_not_found", status=404)

        if str(current_user_id) != str(user_id):
             # You could allow admins to see specific patient logs here too if desired, 
             # but sticking to strict ownership for now unless they use the admin all-logs endpoint.
             # Actually, checking if the requester is an admin to allow access is good practice.
            requester = db.session.query(User).filter_by(user_id=current_user_id).first()
            if not requester or requester.role != UserRole.ADMIN:
                return make_standard_response(False, "unauthorized", status=401)

        if user.role != UserRole.PATIENT:
             return make_standard_response(False, "user_is_not_patient", status=400)
        
        patient = user.patient
        if not patient:
            return make_standard_response(False, "patient_record_not_found", status=404)

        logs = db.session.query(AccessLog).filter_by(patient_id=patient.patient_id).order_by(AccessLog.timestamp.desc()).all()
        
        # Serialize
        data = [log.to_dict() for log in logs]
        return make_standard_response(True, data=data)

class AdminAccessLogs(Resource):
    
    @jwt_required()
    def get(self):
        current_user_id = get_jwt_identity()
        user = db.session.query(User).filter_by(user_id=current_user_id).first()

        if not user or user.role != UserRole.ADMIN:
            return make_standard_response(False, "unauthorized", status=401)
        
        logs = db.session.query(AccessLog).order_by(AccessLog.timestamp.desc()).all()
        data = [log.to_dict() for log in logs]
        
        return make_standard_response(True, data=data)
