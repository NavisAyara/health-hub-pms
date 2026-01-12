import json
from datetime import datetime, timedelta
from app import app
from database.models import (
    User, Patient, HealthCareFacility, HealthCareWorker, 
    ConsentRecord, AccessLog, UserRole, FacilityType, 
    ConsentType, Status, EventAction,
    db
)

from utils import encrypt_id

import bcrypt

def seed_main_backend():
    with app.app_context():

        # Order matters for deletion due to Foreign Keys
        db.session.query(AccessLog).delete()
        db.session.query(ConsentRecord).delete()
        db.session.query(HealthCareWorker).delete()
        db.session.query(HealthCareFacility).delete()
        db.session.query(Patient).delete()
        db.session.query(User).delete()

        # Create Facilities
        hosp = HealthCareFacility(
            facility_id="FAC-001", name="HealthHub Clinic", 
            facility_type=FacilityType.CLINIC, license_number="LIC-999", 
            location="Nairobi"
        )
        hosp2 = HealthCareFacility(
            facility_id="FAC-002", name="Kenyatta National", 
            facility_type=FacilityType.HOSPITAL, license_number="LIC-888", 
            location="Nairobi"
        )
        pharm = HealthCareFacility(
            facility_id="FAC-003", name="GoodLife Pharmacy", 
            facility_type=FacilityType.PHARMACY, license_number="LIC-777", 
            location="Kisumu"
        )
        db.session.add_all([hosp, hosp2, pharm])

        pw_hash = bcrypt.hashpw("Test123!".encode('utf-8'), bcrypt.gensalt(10)).decode('utf-8')

        admins = [
            User(email="admin@test.com", password_hash=pw_hash, role=UserRole.ADMIN),
            User(email="audit@test.com", password_hash=pw_hash, role=UserRole.ADMIN)
        ]
        
        patient_users = [
            User(email="patient@test.com", password_hash=pw_hash, role=UserRole.PATIENT),  # Sarah - index 0
            User(email="sam@test.com", password_hash=pw_hash, role=UserRole.PATIENT),      # Samuel - index 1
            User(email="musa@test.com", password_hash=pw_hash, role=UserRole.PATIENT),     # Musa - index 2
            User(email="faith@test.com", password_hash=pw_hash, role=UserRole.PATIENT),    # Faith - index 3
            User(email="david@test.com", password_hash=pw_hash, role=UserRole.PATIENT),    # David - index 4
        ]

        worker_users = [
            User(email=f"worker{i}@test.com", password_hash=pw_hash, role=UserRole.HEALTHCARE_WORKER) 
            for i in range(1, 9)
        ]
        worker_users[0].email = "doctor@test.com"

        db.session.add_all(admins + patient_users + worker_users)
        db.session.commit()

        # Create patient profiles - mapping correctly to user accounts
        patient_data = [
            {"id": "PAT-100002", "nid": "28456789", "fn": "Sarah", "ln": "Ochieng", "dob": (1992, 7, 25), "user_idx": 0},
            {"id": "PAT-100001", "nid": "31245678", "fn": "Samuel", "ln": "Muchiri", "dob": (1985, 3, 12), "user_idx": 1},
            {"id": "PAT-100003", "nid": "35678912", "fn": "Musa", "ln": "Hassan", "dob": (1978, 11, 2), "user_idx": 2},
            {"id": "PAT-100004", "nid": "21987654", "fn": "Faith", "ln": "Wanjiku", "dob": (1995, 5, 18), "user_idx": 3},
            {"id": "PAT-100005", "nid": "30123456", "fn": "David", "ln": "Njoroge", "dob": (1988, 9, 30), "user_idx": 4},
        ]

        patients = []
        for data in patient_data:
            encrypted_nid = encrypt_id(data["nid"])
            p = Patient(
                patient_id=data["id"],
                user_id=patient_users[data["user_idx"]].user_id,
                first_name=data["fn"],
                last_name=data["ln"],
                national_id_encrypted=encrypted_nid,
                date_of_birth=datetime(*data["dob"]).date()
            )
            patients.append(p)

        db.session.add_all(patients)
        db.session.commit()

        # Create healthcare workers
        workers = []
        for i, u in enumerate(worker_users):
            fac = hosp if i < 4 else (hosp2 if i < 7 else pharm)
            w = HealthCareWorker(
                user_id=u.user_id, facility_id=fac.facility_id,
                license_number=f"W-00{i}", job_title="Physician"
            )
            workers.append(w)
        db.session.add_all(workers)
        db.session.commit()

        # Create consent records
        consents = [
            # Active Consent for Sarah at HealthHub
            ConsentRecord(
                patient_id="PAT-100002", facility_id="FAC-001", 
                consent_type=ConsentType.VIEW, status=Status.ACTIVE,
                granted_by=patient_users[0].user_id, purpose="Routine Checkup",
                granted_at=datetime.now(), expires_at=datetime.now() + timedelta(days=30)
            ),
            # Revoked Consent for testing
            ConsentRecord(
                patient_id="PAT-100002", facility_id="FAC-002", 
                consent_type=ConsentType.EDIT, status=Status.REVOKED,
                granted_by=patient_users[0].user_id, purpose="Old Surgery"
            ),
            # Expired Consent
            ConsentRecord(
                patient_id="PAT-100001", facility_id="FAC-003", 
                consent_type=ConsentType.SHARE, status=Status.EXPIRED,
                granted_by=patient_users[1].user_id, purpose="Past Prescription",
                expires_at=datetime.now() - timedelta(days=1)
            )
        ]
        db.session.add_all(consents)

        # Create Access Logs
        logs = []
        for i in range(20):
            res = "ALLOWED" if i % 2 == 0 else "DENIED"
            logs.append(AccessLog(
                patient_id="PAT-100002", accessed_by=workers[0].worker_id,
                action=EventAction.VIEW, result=res,
                reason="Consent Check" if res == "ALLOWED" else "No Active Consent",
                ip_address="192.168.1.1"
            ))
        db.session.add_all(logs)

        db.session.commit()
        print("Main Backend successfully seeded!")

if __name__ == "__main__":
    seed_main_backend()