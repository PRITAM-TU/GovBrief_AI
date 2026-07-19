"""
GovBrief AI — AES-256 Encryption Service for Document Vault
"""
import os
import base64
import hashlib
from pathlib import Path
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
from Crypto.Random import get_random_bytes
from config import settings

# Derive a 32-byte key from the SECRET_KEY
_KEY = hashlib.sha256(settings.SECRET_KEY.encode()).digest()


def encrypt_file(source_path: str, dest_path: str) -> str:
    """Encrypt a file using AES-256-CBC and save to dest_path."""
    iv = get_random_bytes(16)
    cipher = AES.new(_KEY, AES.MODE_CBC, iv)
    with open(source_path, "rb") as f:
        data = f.read()
    encrypted = cipher.encrypt(pad(data, AES.block_size))
    with open(dest_path, "wb") as f:
        f.write(iv + encrypted)  # Prepend IV
    return dest_path


def decrypt_file(source_path: str) -> bytes:
    """Decrypt an AES-256-CBC encrypted file and return raw bytes."""
    with open(source_path, "rb") as f:
        raw = f.read()
    iv = raw[:16]
    encrypted = raw[16:]
    cipher = AES.new(_KEY, AES.MODE_CBC, iv)
    return unpad(cipher.decrypt(encrypted), AES.block_size)


def encrypt_and_store(file_bytes: bytes, original_filename: str, user_id: int) -> dict:
    """Encrypt uploaded file bytes and store securely. Returns storage info."""
    import uuid
    ext = Path(original_filename).suffix
    stored_name = f"vault_{user_id}_{uuid.uuid4().hex}{ext}.enc"
    stored_path = Path(settings.UPLOAD_DIR) / stored_name

    # Write plaintext temp, encrypt, remove temp
    temp_path = Path(settings.UPLOAD_DIR) / f"temp_{uuid.uuid4().hex}"
    temp_path.write_bytes(file_bytes)
    encrypt_file(str(temp_path), str(stored_path))
    temp_path.unlink()

    return {
        "stored_filename": stored_name,
        "file_size": len(file_bytes),
    }
