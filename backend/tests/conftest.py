"""Shared fixtures for AnySpot Phase 3 auth tests."""
import os
import uuid
from datetime import datetime, timezone, timedelta
import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
API = f"{BASE_URL}/api"
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")


@pytest.fixture(scope="session")
def mongo():
    client = MongoClient(MONGO_URL)
    yield client[DB_NAME]
    client.close()


def _mk_user_session(mongo, credits=24, prefix="primary"):
    uid = f"TEST_user_{prefix}_{uuid.uuid4().hex[:8]}"
    token = f"TEST_session_{prefix}_{uuid.uuid4().hex}"
    mongo.users.insert_one({
        "user_id": uid,
        "email": f"{uid}@example.com",
        "name": f"Test {prefix.title()}",
        "picture": "",
        "credits": credits,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    mongo.user_sessions.insert_one({
        "user_id": uid,
        "session_token": token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return uid, token


@pytest.fixture
def primary_user(mongo):
    uid, token = _mk_user_session(mongo, credits=24, prefix="primary")
    yield {"user_id": uid, "token": token}
    mongo.users.delete_one({"user_id": uid})
    mongo.user_sessions.delete_many({"user_id": uid})
    mongo.bookings.delete_many({"user_id": uid})


@pytest.fixture
def secondary_user(mongo):
    uid, token = _mk_user_session(mongo, credits=24, prefix="secondary")
    yield {"user_id": uid, "token": token}
    mongo.users.delete_one({"user_id": uid})
    mongo.user_sessions.delete_many({"user_id": uid})
    mongo.bookings.delete_many({"user_id": uid})


def client_for(token):
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
    return s


@pytest.fixture
def primary_client(primary_user):
    return client_for(primary_user["token"])


@pytest.fixture
def secondary_client(secondary_user):
    return client_for(secondary_user["token"])


@pytest.fixture
def anon_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s
