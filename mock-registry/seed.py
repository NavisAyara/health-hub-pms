import json
from datetime import datetime
from main import db, app
from data import PatientRegistryRecord

# COMPLETE 20-PATIENT DATA
patients_data = [
    {"patient_id": "PAT-100001", "national_id": "31245678", "first_name": "Samuel", "last_name": "Muchiri", "date_of_birth": "1985-03-12", "gender": "male", "phone": "+254711223344", "email": "sam.muchiri@example.com", "address": {"county": "Nairobi", "sub_county": "Westlands", "ward": "Parklands"}, "emergency_contact": {"name": "Grace Muchiri", "relationship": "Spouse", "phone": "+254722334455"}},
    {"patient_id": "PAT-100002", "national_id": "28456789", "first_name": "Sarah", "last_name": "Ochieng", "date_of_birth": "1992-07-25", "gender": "female", "phone": "+254733445566", "email": "sarah.o@example.com", "address": {"county": "Kisumu", "sub_county": "Kisumu Central", "ward": "Kondele"}, "emergency_contact": {"name": "Peter Ochieng", "relationship": "Father", "phone": "+254711998877"}},
    {"patient_id": "PAT-100003", "national_id": "35678912", "first_name": "Musa", "last_name": "Hassan", "date_of_birth": "1978-11-02", "gender": "male", "phone": "+254700112233", "email": "musa.h@example.com", "address": {"county": "Mombasa", "sub_county": "Mvita", "ward": "Old Town"}, "emergency_contact": {"name": "Amina Hassan", "relationship": "Sister", "phone": "+254700554433"}},
    {"patient_id": "PAT-100004", "national_id": "21987654", "first_name": "Faith", "last_name": "Wanjiku", "date_of_birth": "1995-05-18", "gender": "female", "phone": "+254722556677", "email": "faith.w@example.com", "address": {"county": "Kiambu", "sub_county": "Thika", "ward": "Township"}, "emergency_contact": {"name": "John Wanjiku", "relationship": "Brother", "phone": "+254722998877"}},
    {"patient_id": "PAT-100005", "national_id": "30123456", "first_name": "David", "last_name": "Njoroge", "date_of_birth": "1988-09-30", "gender": "male", "phone": "+254711001122", "email": "d.njoroge@example.com", "address": {"county": "Nakuru", "sub_county": "Nakuru East", "ward": "Biashara"}, "emergency_contact": {"name": "Mary Njoroge", "relationship": "Mother", "phone": "+254711223399"}},
    {"patient_id": "PAT-100006", "national_id": "27654321", "first_name": "Mercy", "last_name": "Chelagat", "date_of_birth": "1990-01-15", "gender": "female", "phone": "+254733998877", "email": "m.chela@example.com", "address": {"county": "Uasin Gishu", "sub_county": "Ainabkoi", "ward": "Kapsoya"}, "emergency_contact": {"name": "Kipchumba Chelagat", "relationship": "Husband", "phone": "+254733112233"}},
    {"patient_id": "PAT-100007", "national_id": "33445566", "first_name": "Kevin", "last_name": "Otieno", "date_of_birth": "1983-12-10", "gender": "male", "phone": "+254700445566", "email": "k.otieno@example.com", "address": {"county": "Kisumu", "sub_county": "Kisumu West", "ward": "Ojola"}, "emergency_contact": {"name": "Rose Otieno", "relationship": "Spouse", "phone": "+254700119988"}},
    {"patient_id": "PAT-100008", "national_id": "29887766", "first_name": "Beatrice", "last_name": "Mutua", "date_of_birth": "1994-04-22", "gender": "female", "phone": "+254722112233", "email": "b.mutua@example.com", "address": {"county": "Machakos", "sub_county": "Machakos Town", "ward": "Muputi"}, "emergency_contact": {"name": "Mutua Musyoka", "relationship": "Father", "phone": "+254722554433"}},
    {"patient_id": "PAT-100009", "national_id": "32112233", "first_name": "Isaac", "last_name": "Kiprono", "date_of_birth": "1975-08-05", "gender": "male", "phone": "+254711334455", "email": "i.kip@example.com", "address": {"county": "Kericho", "sub_county": "Ainamoi", "ward": "Kapkugerwet"}, "emergency_contact": {"name": "Jane Kiprono", "relationship": "Spouse", "phone": "+254711990011"}},
    {"patient_id": "PAT-100010", "national_id": "24556677", "first_name": "Lydia", "last_name": "Achieng", "date_of_birth": "1991-02-28", "gender": "female", "phone": "+254733776655", "email": "lydia.a@example.com", "address": {"county": "Siaya", "sub_county": "Bondo", "ward": "Yimbo East"}, "emergency_contact": {"name": "Mark Achieng", "relationship": "Brother", "phone": "+254733009988"}},
    {"patient_id": "PAT-100011", "national_id": "36778899", "first_name": "Joseph", "last_name": "Kamau", "date_of_birth": "1980-06-14", "gender": "male", "phone": "+254700889900", "email": "j.kamau@example.com", "address": {"county": "Murang'a", "sub_county": "Kandara", "ward": "Ng'araria"}, "emergency_contact": {"name": "Alice Kamau", "relationship": "Spouse", "phone": "+254700123456"}},
    {"patient_id": "PAT-100012", "national_id": "22334455", "first_name": "Esther", "last_name": "Mwangi", "date_of_birth": "1996-10-10", "gender": "female", "phone": "+254722445566", "email": "e.mwangi@example.com", "address": {"county": "Nyeri", "sub_county": "Nyeri Central", "ward": "Gatitu"}, "emergency_contact": {"name": "Paul Mwangi", "relationship": "Father", "phone": "+254722987654"}},
    {"patient_id": "PAT-100013", "national_id": "34556677", "first_name": "Brian", "last_name": "Kibet", "date_of_birth": "1987-01-20", "gender": "male", "phone": "+254711556677", "email": "b.kibet@example.com", "address": {"county": "Bomet", "sub_county": "Bomet East", "ward": "Merigi"}, "emergency_contact": {"name": "Sarah Kibet", "relationship": "Mother", "phone": "+254711665544"}},
    {"patient_id": "PAT-100014", "national_id": "25667788", "first_name": "Nancy", "last_name": "Wairimu", "date_of_birth": "1993-03-05", "gender": "female", "phone": "+254733221100", "email": "n.wairimu@example.com", "address": {"county": "Laikipia", "sub_county": "Laikipia East", "ward": "Nanyuki"}, "emergency_contact": {"name": "George Wairimu", "relationship": "Spouse", "phone": "+254733889900"}},
    {"patient_id": "PAT-100015", "national_id": "37889900", "first_name": "Victor", "last_name": "Maina", "date_of_birth": "1982-11-25", "gender": "male", "phone": "+254700332211", "email": "v.maina@example.com", "address": {"county": "Nyandarua", "sub_county": "Ol Kalou", "ward": "Kaimbaga"}, "emergency_contact": {"name": "Lucy Maina", "relationship": "Spouse", "phone": "+254700556677"}},
    {"patient_id": "PAT-100016", "national_id": "20112233", "first_name": "Alice", "last_name": "Nekesa", "date_of_birth": "1997-07-12", "gender": "female", "phone": "+254722667788", "email": "a.nekesa@example.com", "address": {"county": "Bungoma", "sub_county": "Kanduyi", "ward": "Musikoma"}, "emergency_contact": {"name": "Simiyu Nekesa", "relationship": "Brother", "phone": "+254722001122"}},
    {"patient_id": "PAT-100017", "national_id": "38990011", "first_name": "Geoffrey", "last_name": "Barasa", "date_of_birth": "1979-05-30", "gender": "male", "phone": "+254711667788", "email": "g.barasa@example.com", "address": {"county": "Kakamega", "sub_county": "Lurambi", "ward": "Butsotso East"}, "emergency_contact": {"name": "Milicent Barasa", "relationship": "Spouse", "phone": "+254711332211"}},
    {"patient_id": "PAT-100018", "national_id": "23445566", "first_name": "Joyce", "last_name": "Mumbua", "date_of_birth": "1994-09-08", "gender": "female", "phone": "+254733112233", "email": "j.mumbua@example.com", "address": {"county": "Kitui", "sub_county": "Kitui Central", "ward": "Township"}, "emergency_contact": {"name": "Stephen Mutisya", "relationship": "Fiancé", "phone": "+254733445566"}},
    {"patient_id": "PAT-100019", "national_id": "39001122", "first_name": "Daniel", "last_name": "Cheruiyot", "date_of_birth": "1984-02-14", "gender": "male", "phone": "+254700778899", "email": "d.cheru@example.com", "address": {"county": "Narok", "sub_county": "Narok North", "ward": "Melili"}, "emergency_contact": {"name": "Phyllis Cheruiyot", "relationship": "Spouse", "phone": "+254700998877"}},
    {"patient_id": "PAT-100020", "national_id": "26778899", "first_name": "Purity", "last_name": "Kawira", "date_of_birth": "1992-12-01", "gender": "female", "phone": "+254722009988", "email": "p.kawira@example.com", "address": {"county": "Meru", "sub_county": "Imenti Central", "ward": "Abothuguchi Central"}, "emergency_contact": {"name": "James Kirimi", "relationship": "Father", "phone": "+254722110022"}}
]

def seed_registry():
    with app.app_context():
        print("Starting seeding process...")
        db.session.query(PatientRegistryRecord).delete()

        for p in patients_data:
            new_record = PatientRegistryRecord(
                patient_id=p['patient_id'],
                national_id=p['national_id'],
                first_name=p['first_name'],
                last_name=p['last_name'],
                date_of_birth=datetime.strptime(p['date_of_birth'], '%Y-%m-%d').date(),
                gender=p['gender'].upper(),
                phone=p['phone'],
                email=p['email'],
                # Dumping full objects to strings for db.Text
                address=json.dumps(p['address']),
                emergency_contact=json.dumps(p['emergency_contact'])
            )
            db.session.add(new_record)
        
        db.session.commit()
        print(f"Success: Seeded {len(patients_data)} patients.")

if __name__ == "__main__":
    seed_registry()