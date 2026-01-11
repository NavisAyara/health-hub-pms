from flask import request, jsonify
from flask_restful import Resource
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

class LoginRoute(Resource):
    def post(self):
        username = request.json.get("username", None)
        password = request.json.get("password", None)

        if username != "test" or password != "test":
            return jsonify({"msg": "Bad username or password"}), 401
        
        access_token = create_access_token(identity=username)
        return jsonify(access_token=access_token)
