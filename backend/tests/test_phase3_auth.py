"""AnySpot Phase 3a backend tests - Emergent Google Auth & route gating."""
import os
import uuid
from datetime import datetime, timezone, timedelta
import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
API = f"{BASE_URL}/api"


# ============ /api/auth/session ============
class TestAuthSession:
    def test_invalid_session_id_returns_401(self, anon_client):
        r = anon_client.post(f"{API}/auth/session", json={"session_id": "bogus_xyz_123"})
        assert r.status_code == 401, r.text

    def test_missing_session_id_returns_422(self, anon_client):
        r = anon_client.post(f"{API}/auth/session", json={})
        # Pydantic validation -> 422
        assert r.status_code in (400, 422)


# ============ /api/auth/me ============
class TestAuthMe:
    def test_unauth_returns_401(self, anon_client):
        r = anon_client.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_invalid_token_returns_401(self, anon_client):
        r = anon_client.get(f"{API}/auth/me", headers={"Authorization": "Bearer doesnotexist"})
        assert r.status_code == 401

    def test_valid_token_returns_user(self, primary_client, primary_user):
        r = primary_client.get(f"{API}/auth/me")
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["user_id"] == primary_user["user_id"]
        assert "email" in data
        assert "name" in data
        assert "picture" in data
        assert isinstance(data["credits"], int)
        assert "created_at" in data
        assert "_id" not in data

    def test_expired_session_returns_401(self, mongo, anon_client):
        uid = f"TEST_user_exp_{uuid.uuid4().hex[:8]}"
        token = f"TEST_expired_{uuid.uuid4().hex}"
        mongo.users.insert_one({
            "user_id": uid, "email": f"{uid}@x.com", "name": "E", "picture": "",
            "credits": 5, "created_at": datetime.now(timezone.utc).isoformat(),
        })
        mongo.user_sessions.insert_one({
            "user_id": uid, "session_token": token,
            "expires_at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        try:
            r = anon_client.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {token}"})
            assert r.status_code == 401
        finally:
            mongo.users.delete_one({"user_id": uid})
            mongo.user_sessions.delete_one({"session_token": token})


# ============ /api/auth/logout ============
class TestAuthLogout:
    def test_logout_deletes_session(self, mongo, anon_client):
        # build a throwaway session inline (since logout consumes the token)
        uid = f"TEST_user_lo_{uuid.uuid4().hex[:8]}"
        token = f"TEST_lo_{uuid.uuid4().hex}"
        mongo.users.insert_one({
            "user_id": uid, "email": f"{uid}@x.com", "name": "L", "picture": "",
            "credits": 5, "created_at": datetime.now(timezone.utc).isoformat(),
        })
        mongo.user_sessions.insert_one({
            "user_id": uid, "session_token": token,
            "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        try:
            hdr = {"Authorization": f"Bearer {token}"}
            # me works
            assert anon_client.get(f"{API}/auth/me", headers=hdr).status_code == 200
            # logout
            r = anon_client.post(f"{API}/auth/logout", headers=hdr)
            assert r.status_code == 200
            # session row deleted
            assert mongo.user_sessions.find_one({"session_token": token}) is None
            # me now 401
            assert anon_client.get(f"{API}/auth/me", headers=hdr).status_code == 401
        finally:
            mongo.users.delete_one({"user_id": uid})
            mongo.user_sessions.delete_many({"session_token": token})


# ============ Protected member endpoints ============
PROTECTED_GET = ["/me", "/bookings"]


class TestMemberAuthGate:
    @pytest.mark.parametrize("path", PROTECTED_GET)
    def test_get_unauth_401(self, anon_client, path):
        r = anon_client.get(f"{API}{path}")
        assert r.status_code == 401, f"{path}: {r.status_code}"

    def test_post_booking_unauth_401(self, anon_client):
        r = anon_client.post(f"{API}/bookings", json={"class_id": "x"})
        assert r.status_code == 401

    def test_cancel_unauth_401(self, anon_client):
        r = anon_client.post(f"{API}/bookings/x/cancel")
        assert r.status_code == 401

    def test_me_uses_authed_user(self, primary_client, primary_user):
        r = primary_client.get(f"{API}/me")
        assert r.status_code == 200
        assert r.json()["user_id"] == primary_user["user_id"]


# ============ Partner protected ============
PARTNER_GET = ["/partner/overview", "/partner/studios", "/partner/classes"]


class TestPartnerAuthGate:
    @pytest.mark.parametrize("path", PARTNER_GET)
    def test_partner_get_unauth_401(self, anon_client, path):
        r = anon_client.get(f"{API}{path}")
        assert r.status_code == 401, f"{path}: {r.status_code}"

    def test_partner_post_unauth_401(self, anon_client):
        r = anon_client.post(f"{API}/partner/classes", json={
            "studio_id": "x", "title": "x", "category": "Yoga", "start_time": "2030-01-01T00:00:00+00:00",
        })
        assert r.status_code == 401

    def test_partner_patch_unauth_401(self, anon_client):
        r = anon_client.patch(f"{API}/partner/classes/x", json={"title": "x"})
        assert r.status_code == 401

    def test_partner_delete_unauth_401(self, anon_client):
        r = anon_client.delete(f"{API}/partner/classes/x")
        assert r.status_code == 401

    def test_partner_overview_authed(self, primary_client):
        r = primary_client.get(f"{API}/partner/overview")
        assert r.status_code == 200
        assert r.json()["total_studios"] == 4


# ============ Public endpoints stay open ============
class TestPublicEndpoints:
    def test_studios_no_auth(self, anon_client):
        r = anon_client.get(f"{API}/studios")
        assert r.status_code == 200
        assert len(r.json()) == 4

    def test_classes_no_auth(self, anon_client):
        r = anon_client.get(f"{API}/classes")
        assert r.status_code == 200

    def test_studio_detail_no_auth(self, anon_client):
        sid = anon_client.get(f"{API}/studios").json()[0]["id"]
        r = anon_client.get(f"{API}/studios/{sid}")
        assert r.status_code == 200
        r2 = anon_client.get(f"{API}/studios/{sid}/classes")
        assert r2.status_code == 200


# ============ Booking isolation between users ============
class TestBookingIsolation:
    def test_users_dont_see_each_others_bookings(self, primary_client, secondary_client, anon_client):
        # pick a class with spots
        classes = anon_client.get(f"{API}/classes").json()
        target = next(c for c in classes if c["spots_left"] > 0 and c["credits"] <= 24)
        # primary books
        r1 = primary_client.post(f"{API}/bookings", json={"class_id": target["id"]})
        assert r1.status_code == 200
        # secondary's list does NOT contain it
        sec_list = secondary_client.get(f"{API}/bookings").json()
        assert all(b["class_id"] != target["id"] for b in sec_list)
        # primary sees their own booking
        prim_list = primary_client.get(f"{API}/bookings").json()
        assert any(b["class_id"] == target["id"] for b in prim_list)


# ============ Booking flow uses authed user ============
class TestAuthedBookingFlow:
    def test_book_cancel_credit_lifecycle(self, primary_client, anon_client, primary_user):
        me0 = primary_client.get(f"{API}/me").json()
        classes = anon_client.get(f"{API}/classes").json()
        target = next(c for c in classes if c["spots_left"] > 0 and c["credits"] <= me0["credits"])

        b = primary_client.post(f"{API}/bookings", json={"class_id": target["id"]})
        assert b.status_code == 200
        booking = b.json()
        assert booking["user_id"] == primary_user["user_id"]
        assert booking["status"] == "confirmed"

        # credits deducted on authed user
        me1 = primary_client.get(f"{API}/me").json()
        assert me1["credits"] == me0["credits"] - target["credits"]

        # duplicate -> 400
        dup = primary_client.post(f"{API}/bookings", json={"class_id": target["id"]})
        assert dup.status_code == 400

        # cancel -> refund
        c = primary_client.post(f"{API}/bookings/{booking['id']}/cancel")
        assert c.status_code == 200
        me2 = primary_client.get(f"{API}/me").json()
        assert me2["credits"] == me0["credits"]

    def test_cancel_promotes_other_user_waitlist(self, primary_client, secondary_client, secondary_user, mongo, anon_client):
        # create a TEST class with capacity=1 via partner endpoint (auth as primary)
        studio_id = anon_client.get(f"{API}/studios").json()[0]["id"]
        start = (datetime.now(timezone.utc) + timedelta(days=7, hours=10)).isoformat()
        created = primary_client.post(f"{API}/partner/classes", json={
            "studio_id": studio_id, "title": "TEST_PromoteAuth", "category": "Yoga",
            "start_time": start, "duration_min": 60, "credits": 2, "capacity": 1,
        }).json()
        cid = created["id"]
        try:
            # primary books -> confirmed (spots_left=0)
            b = primary_client.post(f"{API}/bookings", json={"class_id": cid}).json()
            assert b["status"] == "confirmed"
            # secondary books -> waitlist (server logic)
            b2 = secondary_client.post(f"{API}/bookings", json={"class_id": cid}).json()
            assert b2["status"] == "waitlist"
            sec_me0 = secondary_client.get(f"{API}/me").json()
            # primary cancels -> secondary's waitlist promoted
            primary_client.post(f"{API}/bookings/{b['id']}/cancel")
            promoted = mongo.bookings.find_one({"id": b2["id"]})
            assert promoted["status"] == "confirmed"
            # secondary credits deducted now
            sec_me1 = secondary_client.get(f"{API}/me").json()
            assert sec_me1["credits"] == sec_me0["credits"] - 2
        finally:
            primary_client.delete(f"{API}/partner/classes/{cid}")
