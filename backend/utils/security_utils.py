import os

from cryptography.fernet import Fernet
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY=os.getenv("CRYPTOGRAPHY_KEY")
cipher = Fernet(SECRET_KEY)

def encrypt_id(national_id):
    # IDs are usually strings; Fernet needs bytes
    id_bytes = national_id.encode('utf-8')
    encrypted_id = cipher.encrypt(id_bytes)
    return encrypted_id.decode('utf-8')

def decrypt_id(encrypted_id_string):
    # Convert string back to bytes to decrypt
    encrypted_bytes = encrypted_id_string.encode('utf-8')
    decrypted_bytes = cipher.decrypt(encrypted_bytes)
    return decrypted_bytes.decode('utf-8')
