from enum import Enum

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import MetaData

metadata = MetaData()

db = SQLAlchemy(metadata=metadata)

class UserRole(Enum):
    PATIENT = "patient"
    HEALTHCARE_WORKER = "healthcare_worker"
    ADMIN = "admin"


class FacilityType(Enum):
    HOSPITAL = "hospital"
    CLINIC = "clinic"
    PHARMACY = "pharmacy"


class EventAction(Enum):
    VIEW = "view"
    EDIT = "edit"
    SHARE = "share"


class ConsentType(Enum):
    VIEW = "view"
    EDIT = "edit"
    SHARE = "share"


class Status(Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    REVOKED = "revoked"


class User(db.Model):
    __tablename__ = "users"

    user_id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(20))
    password_hash = db.Column(db.String(200))
    role = db.Column(db.Enum(UserRole), default=UserRole.PATIENT)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    last_login = db.Column(db.DateTime, nullable=True)


class Patient(db.Model):
    __tablename__ = "patients"

    patient_id = db.Column(db.Integer, primary_key=True)
    national_id_encrypted = db.Column(db.String(50))
    first_name = db.Column(db.String(18))
    last_name = db.Column(db.String(18))
    date_of_birth = db.Column(db.Date)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"))
    
    user = db.relationship("User", backref="patient")
    access_logs = db.relationship("AccessLog", back_populates="patient")
    consent_records = db.relationship("ConsentRecord", back_populates="patient")


class HealthCareFacility(db.Model):
    __tablename__ = "healthcare_facilities"

    facility_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20))
    facility_type = db.Column(db.Enum(FacilityType), default=FacilityType.HOSPITAL)
    license_number = db.Column(db.String(20))
    location = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    healthcare_workers = db.relationship("HealthCareWorker", back_populates="healthcare_facility")
    consent_records = db.relationship("ConsentRecord", back_populates="facility")


class HealthCareWorker(db.Model):
    __tablename__ = "healthcare_workers"

    worker_id = db.Column(db.Integer, primary_key=True)
    license_number = db.Column(db.String(20))
    job_title = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"))
    facility_id = db.Column(db.Integer, db.ForeignKey("healthcare_facilities.facility_id"))

    healthcare_facility = db.relationship("HealthCareFacility", back_populates="healthcare_workers")
    user = db.relationship("User", backref="healthcare_worker")
    access_logs = db.relationship("AccessLog", back_populates="healthcare_worker")


class ConsentRecord(db.Model):
    __tablename__ = "consent_records"

    consent_id = db.Column(db.Integer, primary_key=True)
    consent_type = db.Column(db.Enum(ConsentType), default=ConsentType.VIEW)
    granted_at = db.Column(db.DateTime, nullable=True)
    expires_at = db.Column(db.DateTime, nullable=True)
    purpose = db.Column(db.Text(100))
    status = db.Column(db.Enum(Status))

    patient_id = db.Column(db.Integer, db.ForeignKey("patients.patient_id"))
    facility_id = db.Column(db.Integer, db.ForeignKey("healthcare_facilities.facility_id"))
    granted_by = db.Column(db.Integer, db.ForeignKey("users.user_id"))

    facility = db.relationship("HealthCareFacilities", back_populates="consent_records")
    patient = db.relationship("Patient", back_populates="consent_records")


class AccessLog(db.Model):
    __tablename__ = "access_logs"

    log_id = db.Column(db.Integer, primary_key=True)
    action = db.Column(db.Enum(EventAction))
    result = db.Column(db.Enum("ALLOWED", "DENIED"))
    reason = db.Column(db.Text(100))
    timestamp = db.Column(db.DateTime, server_default=db.func.now())
    ip_address = db.Column(db.String(12))

    patient_id = db.Column(db.Integer, db.ForeignKey("patients.patient_id"))
    accessed_by = db.Column(db.Integer, db.ForeignKey("healthcare_workers.worker_id"))

    patient = db.relationship("Patient", back_populates="access_logs")
    healthcare_worker = db.relationship("HealthCareWorker", back_populates="access_logs")
