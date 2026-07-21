"""
auth_store.py
Minimal local auth - no external dependencies (uses Python's built-in
hashlib so there's nothing extra to install on Windows).

Users are stored in data/users.json with salted password hashes.
Sessions are kept in memory (token -> user_id) - they reset if the
backend restarts, which just means logging in again. That's fine for
a personal/local tool.
"""
import json
import secrets
import hashlib
import uuid
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)
USERS_FILE = DATA_DIR / "users.json"

_sessions = {}  # token -> user_id


def _load_users() -> dict:
    if USERS_FILE.exists():
        return json.load(open(USERS_FILE))
    return {}


def _save_users(users: dict):
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=2)


def _hash_password(password: str, salt_hex: str = None):
    salt_hex = salt_hex or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode(), bytes.fromhex(salt_hex), 100_000
    ).hex()
    return digest, salt_hex


def signup(username: str, password: str) -> dict:
    username = username.strip()
    if len(username) < 3:
        raise ValueError("Username must be at least 3 characters.")
    if len(password) < 4:
        raise ValueError("Password must be at least 4 characters.")

    users = _load_users()
    if username in users:
        raise ValueError("That username is already taken.")

    digest, salt = _hash_password(password)
    user_id = str(uuid.uuid4())[:8]
    users[username] = {"user_id": user_id, "password_hash": digest, "salt": salt}
    _save_users(users)

    token = secrets.token_hex(24)
    _sessions[token] = user_id
    return {"token": token, "user_id": user_id, "username": username}


def login(username: str, password: str) -> dict:
    username = username.strip()
    users = _load_users()
    user = users.get(username)
    if not user:
        raise ValueError("Incorrect username or password.")

    digest, _ = _hash_password(password, user["salt"])
    if digest != user["password_hash"]:
        raise ValueError("Incorrect username or password.")

    token = secrets.token_hex(24)
    _sessions[token] = user["user_id"]
    return {"token": token, "user_id": user["user_id"], "username": username}


def get_user_id(token: str):
    return _sessions.get(token)
