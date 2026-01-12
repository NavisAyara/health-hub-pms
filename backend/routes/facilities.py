from flask_restful import Resource
from database.models import HealthCareFacility

class Facilities(Resource):
    def get(self):
        facilities = HealthCareFacility.query.all()
        return [{"id": f.facility_id, "name": f.name} for f in facilities], 200
