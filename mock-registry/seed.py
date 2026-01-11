import argparse
import json
import random
import datetime

from main import app
from data import db, PatientRegistryRecord

FIRST_NAMES = [
    "John", "Jane", "Alice", "Bob", "Grace", "Michael", "Sarah", "David",
    "Peter", "Mary", "Paul", "Olivia", "Noah", "Liam", "Emma", "Ava",
    "Sophia", "Isabella", "Mason", "Ethan", "Lucas", "Mia", "Amelia", "Harper", "Charlotte"
]

LAST_NAMES = [
    "Doe", "Smith", "Kimani", "Mwangi", "Otieno", "Njoroge", "Wanjiru", "Kamau",
    "Mutua", "Karanja", "Omondi", "Ouma", "Owino", "Achieng", "Gichuhi", "Mwansa",
    "Nkosi", "Mensah", "Acheampong", "Boateng", "Okoye", "Okafor", "Adeyemi", "Balogun", "Ibrahim"
]

COUNTIES = ["Nairobi", "Kiambu", "Mombasa", "Kisumu", "Uasin Gishu", "Machakos"]
SUB_COUNTIES = ["Westlands", "Langata", "Ruaraka", "Kahawa", "Kileleshwa", "Embakasi"]
WARDS = ["Parklands", "Kangemi", "Kawangware", "Mabatini", "Imara Daima", "Karen"]

EMERGENCY_RELATIONS = ["Spouse", "Parent", "Sibling", "Friend", "Guardian"]


def random_dob(start_year=1950, end_year=2005):
    year = random.randint(start_year, end_year)
    month = random.randint(1, 12)
    day = random.randint(1, 28)
    return datetime.date(year, month, day)


def random_phone():
    return f"+2547{random.randint(10000000, 99999999)}"


def make_address():
    return {
        "county": random.choice(COUNTIES),
        "sub_county": random.choice(SUB_COUNTIES),
        "ward": random.choice(WARDS),
    }


def make_emergency_contact(i):
    name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
    return {
        "name": name,
        "relationship": random.choice(EMERGENCY_RELATIONS),
        "phone": random_phone(),
    }


def seed(count=25, clear=False):
    with app.app_context():
        # Ensure tables exist (useful for quick local seeding)
        db.create_all()

        if clear:
            print("Clearing existing registry records...")
            PatientRegistryRecord.query.delete()
            db.session.commit()

        existing_patient_ids = set(r.patient_id for r in PatientRegistryRecord.query.all())
        existing_national_ids = set(r.national_id for r in PatientRegistryRecord.query.all())

        inserted = 0
        attempts = 0
        max_attempts = count * 10

        while inserted < count and attempts < max_attempts:
            attempts += 1
            idx = inserted + 1
            first = random.choice(FIRST_NAMES)
            last = random.choice(LAST_NAMES)
            patient_id = f"PAT-{100000 + idx:06d}"
            national_id = f"{10000000 + idx}"

            # Ensure uniqueness (simple approach)
            if patient_id in existing_patient_ids or national_id in existing_national_ids:
                continue

            dob = random_dob()
            gender = random.choice(["MALE", "FEMALE"])
            phone = random_phone()
            email = f"{first.lower()}.{last.lower()}{idx}@example.com"
            address = make_address()
            emergency = make_emergency_contact(idx)

            rec = PatientRegistryRecord(
                patient_id=patient_id,
                national_id=national_id,
                first_name=first,
                last_name=last,
                date_of_birth=dob,
                gender=gender,
                phone=phone,
                email=email,
                address=json.dumps(address),
                emergency_contact=json.dumps(emergency),
            )

            db.session.add(rec)
            try:
                db.session.commit()
                existing_patient_ids.add(patient_id)
                existing_national_ids.add(national_id)
                inserted += 1
                print(f"Inserted: {patient_id} ({first} {last})")
            except Exception as e:
                db.session.rollback()
                print(f"Failed to insert {patient_id}: {e}")

        print(f"Seeding complete: inserted {inserted} record(s).")

#CLI for easy control of the amount of seed data needed
def parse_args():
    p = argparse.ArgumentParser(description="Seed the mock registry database with sample records")
    p.add_argument("-n", "--count", type=int, default=25, help="Number of records to insert (default: 25)")
    p.add_argument("-c", "--clear", action="store_true", help="Clear existing records before seeding")
    return p.parse_args()


if __name__ == "__main__":
    args = parse_args()
    seed(count=args.count, clear=args.clear)
