"""AnySpot Phase 2 backend tests - Partner endpoints & waitlist semantics."""
import os
from datetime import datetime, timezone, timedelta
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://vitality-mvp.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def s():
    return requests.Session()


@pytest.fixture(scope="module")
def studio_id(s):
    studios = s.get(f"{API}/partner/studios").json()
    assert len(studios) >= 1
    return studios[0]["id"]


# ---- /api/partner/studios ----
def test_partner_studios_4(s):
    r = s.get(f"{API}/partner/studios")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 4
    for d in data:
        assert "_id" not in d


# ---- /api/partner/overview ----
def test_partner_overview_shape(s):
    r = s.get(f"{API}/partner/overview")
    assert r.status_code == 200
    d = r.json()
    for k in [
        "reservations_week", "reservations_month", "credits_week", "credits_month",
        "active_classes", "total_studios", "top_classes", "upcoming_roster",
    ]:
        assert k in d, f"missing {k}"
    assert d["total_studios"] == 4
    assert isinstance(d["top_classes"], list)
    assert isinstance(d["upcoming_roster"], list)
    assert d["active_classes"] >= 0


# ---- /api/partner/classes ----
def test_partner_classes_upcoming(s):
    r = s.get(f"{API}/partner/classes", params={"upcoming": "true"})
    assert r.status_code == 200
    data = r.json()
    assert len(data) > 0
    now_iso = datetime.now(timezone.utc).isoformat()
    for c in data:
        assert c["start_time"] >= now_iso


# ---- POST create class ----
def test_partner_create_class_appears_in_classes(s, studio_id):
    start = (datetime.now(timezone.utc) + timedelta(days=2, hours=3)).isoformat()
    payload = {
        "studio_id": studio_id,
        "title": "TEST_PartnerNew",
        "category": "Yoga",
        "description": "test",
        "duration_min": 50,
        "credits": 2,
        "start_time": start,
        "capacity": 10,
    }
    r = s.post(f"{API}/partner/classes", json=payload)
    assert r.status_code == 200, r.text
    c = r.json()
    assert c["title"] == "TEST_PartnerNew"
    assert c["spots_left"] == 10
    assert c["capacity"] == 10
    assert c["studio_id"] == studio_id

    # appears in /api/classes
    listed = s.get(f"{API}/classes", params={"search": "TEST_PartnerNew"}).json()
    assert any(x["id"] == c["id"] for x in listed)

    # cleanup
    s.delete(f"{API}/partner/classes/{c['id']}")


# ---- PATCH update capacity delta ----
def test_partner_update_capacity_delta(s, studio_id):
    start = (datetime.now(timezone.utc) + timedelta(days=3, hours=2)).isoformat()
    create = s.post(f"{API}/partner/classes", json={
        "studio_id": studio_id, "title": "TEST_Cap", "category": "Yoga",
        "start_time": start, "duration_min": 60, "credits": 2, "capacity": 5,
    }).json()
    cid = create["id"]
    assert create["spots_left"] == 5

    # Increase capacity by 3 -> spots_left 8
    r = s.patch(f"{API}/partner/classes/{cid}", json={"capacity": 8})
    assert r.status_code == 200
    assert r.json()["spots_left"] == 8
    assert r.json()["capacity"] == 8

    # Decrease capacity to 2 (delta -6) -> spots_left max(0, 8-6)=2
    r = s.patch(f"{API}/partner/classes/{cid}", json={"capacity": 2})
    assert r.status_code == 200
    assert r.json()["spots_left"] == 2

    # Decrease massively -> spots_left clamps to 0
    r = s.patch(f"{API}/partner/classes/{cid}", json={"capacity": -100})
    assert r.status_code == 200
    assert r.json()["spots_left"] == 0

    s.delete(f"{API}/partner/classes/{cid}")


# ---- DELETE refunds confirmed bookings ----
def test_partner_delete_refunds_confirmed(s, studio_id):
    start = (datetime.now(timezone.utc) + timedelta(days=4, hours=5)).isoformat()
    cid = s.post(f"{API}/partner/classes", json={
        "studio_id": studio_id, "title": "TEST_DelRefund", "category": "Yoga",
        "start_time": start, "duration_min": 60, "credits": 2, "capacity": 3,
    }).json()["id"]

    me0 = s.get(f"{API}/me").json()
    b = s.post(f"{API}/bookings", json={"class_id": cid}).json()
    assert b["status"] == "confirmed"
    me1 = s.get(f"{API}/me").json()
    assert me1["credits"] == me0["credits"] - 2

    # Delete class -> refund
    r = s.delete(f"{API}/partner/classes/{cid}")
    assert r.status_code == 200
    assert r.json()["cancelled"] >= 1

    me2 = s.get(f"{API}/me").json()
    assert me2["credits"] == me0["credits"], "Credits should be refunded after class deletion"

    # class gone
    assert s.get(f"{API}/classes/{cid}").status_code == 404


# ---- WAITLIST flow ----
def test_waitlist_create_no_deduct(s, studio_id):
    """Booking on a full class returns waitlist status without deducting credits."""
    start = (datetime.now(timezone.utc) + timedelta(days=5, hours=4)).isoformat()
    # capacity=1 so we can fill it from demo-user then use a synthetic waitlist booking
    cid = s.post(f"{API}/partner/classes", json={
        "studio_id": studio_id, "title": "TEST_Waitlist", "category": "Yoga",
        "start_time": start, "duration_min": 60, "credits": 2, "capacity": 1,
    }).json()["id"]

    # Manually set spots_left=0 by patching capacity to 0
    s.patch(f"{API}/partner/classes/{cid}", json={"capacity": 0})

    me0 = s.get(f"{API}/me").json()
    r = s.post(f"{API}/bookings", json={"class_id": cid})
    assert r.status_code == 200, r.text
    b = r.json()
    assert b["status"] == "waitlist"

    # No deduction
    me1 = s.get(f"{API}/me").json()
    assert me1["credits"] == me0["credits"]

    # waitlist_count incremented
    cls = s.get(f"{API}/classes/{cid}")
    # cls may not appear if start_time filter; check via partner endpoint
    cls2 = next((x for x in s.get(f"{API}/partner/classes", params={"upcoming": "true"}).json() if x["id"] == cid), None)
    assert cls2 and cls2["waitlist_count"] == 1

    # Duplicate booking blocked
    dup = s.post(f"{API}/bookings", json={"class_id": cid})
    assert dup.status_code == 400
    assert "Already booked" in dup.text

    # Cancel waitlist -> no refund (credits unchanged), waitlist_count decremented
    c = s.post(f"{API}/bookings/{b['id']}/cancel")
    assert c.status_code == 200
    me2 = s.get(f"{API}/me").json()
    assert me2["credits"] == me0["credits"]

    # cleanup
    s.delete(f"{API}/partner/classes/{cid}")


# ---- Auto-promote waitlist on confirmed cancellation ----
def test_waitlist_auto_promote_on_confirmed_cancel(s, studio_id):
    """When a confirmed booking is cancelled, earliest waitlist user (with credits) is promoted."""
    from pymongo import MongoClient
    mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    db_name = os.environ.get("DB_NAME", "test_database")
    mclient = MongoClient(mongo_url)
    mdb = mclient[db_name]

    start = (datetime.now(timezone.utc) + timedelta(days=6, hours=6)).isoformat()
    cid = s.post(f"{API}/partner/classes", json={
        "studio_id": studio_id, "title": "TEST_Promote", "category": "Yoga",
        "start_time": start, "duration_min": 60, "credits": 2, "capacity": 1,
    }).json()["id"]

    # demo-user books -> confirmed, spots_left=0
    me0 = s.get(f"{API}/me").json()
    b = s.post(f"{API}/bookings", json={"class_id": cid}).json()
    assert b["status"] == "confirmed"

    # Insert a synthetic second user with credits and a waitlist booking
    other_uid = "test-user-promote"
    mdb.users.update_one(
        {"id": other_uid},
        {"$set": {"id": other_uid, "name": "Test Two", "email": "t2@x.com", "credits": 10, "avatar": ""}},
        upsert=True,
    )
    import uuid
    wb_id = str(uuid.uuid4())
    mdb.bookings.insert_one({
        "id": wb_id,
        "user_id": other_uid,
        "class_id": cid,
        "class_title": "TEST_Promote",
        "studio_name": "x",
        "instructor": "x",
        "start_time": start,
        "credits": 2,
        "image": "",
        "status": "waitlist",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    mdb.classes.update_one({"id": cid}, {"$inc": {"waitlist_count": 1}})

    # Cancel demo-user's confirmed booking -> should refund demo + promote other_uid
    r = s.post(f"{API}/bookings/{b['id']}/cancel")
    assert r.status_code == 200

    # demo refunded
    me1 = s.get(f"{API}/me").json()
    assert me1["credits"] == me0["credits"]

    # other_uid booking promoted to confirmed
    promoted = mdb.bookings.find_one({"id": wb_id})
    assert promoted["status"] == "confirmed", f"expected confirmed got {promoted['status']}"

    # other_uid credits deducted
    other_user = mdb.users.find_one({"id": other_uid})
    assert other_user["credits"] == 8

    # class state: spots_left back to 0 (promoted took it), waitlist_count 0
    cls = mdb.classes.find_one({"id": cid})
    assert cls["spots_left"] == 0
    assert cls["waitlist_count"] == 0

    # cleanup
    mdb.bookings.delete_many({"class_id": cid})
    mdb.users.delete_one({"id": other_uid})
    s.delete(f"{API}/partner/classes/{cid}")
    mclient.close()
