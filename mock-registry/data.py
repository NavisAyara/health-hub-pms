from flask_sqlalchemy import SQLAlchemy
from sqlalchemy_serializer import SerializerMixin

db = SQLAlchemy()

class PatientRegistryRecord(db.Model, SerializerMixin):
    __tablename__ = "registry_records"

    patient_id = db.Column(db.String(20), primary_key=True)
    national_id = db.Column(db.String(20))
    first_name = db.Column(db.String(18))
    last_name = db.Column(db.String(18))
    date_of_birth = db.Column(db.Date)
    gender = db.Column(db.Enum("MALE", "FEMALE"), nullable=False)
    phone = db.Column(db.String(12))
    email = db.Column(db.Text)
    address = db.Column(db.Text)
    emergency_contact = db.Column(db.String(20))