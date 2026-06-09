"""AnySpot Phase 1 backend tests"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://vitality-mvp.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def s():
    return requests.Session()


# ---- Studios ----
def test_list_studios_returns_4(s):
    r = s.get(f"{API}/studios", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    names = sorted([d["name"] for d in data])
    assert names == sorted(["Kinetic Elite", "Pulse Atelier", "Stillwater Yoga", "Forge Strength Lab"])
    for d in data:
        assert "id" in d and "cover_image" in d and "amenities" in d
        assert "_id" not in d


def test_get_single_studio(s):
    studios = s.get(f"{API}/studios").json()
    sid = studios[0]["id"]
    r = s.get(f"{API}/studios/{sid}")
    assert r.status_code == 200
    assert r.json()["id"] == sid


def test_studio_classes(s):
    studios = s.get(f"{API}/studios").json()
    sid = studios[0]["id"]
    r = s.get(f"{API}/studios/{sid}/classes")
    assert r.status_code == 200
    cls = r.json()
    assert len(cls) > 0
    for c in cls:
        assert c["studio_id"] == sid


def test_get_studio_404(s):
    r = s.get(f"{API}/studios/does-not-exist")
    assert r.status_code == 404


# ---- Classes ----
def test_list_classes_default(s):
    r = s.get(f"{API}/classes")
    assert r.status_code == 200
    data = r.json()
    assert 0 < len(data) <= 60


def test_classes_category_filter(s):
    r = s.get(f"{API}/classes", params={"category": "Yoga"})
    assert r.status_code == 200
    for c in r.json():
        assert c["category"] == "Yoga"


def test_classes_max_credits(s):
    r = s.get(f"{API}/classes", params={"max_credits": 2})
    assert r.status_code == 200
    for c in r.json():
        assert c["credits"] <= 2


def test_classes_search(s):
    r = s.get(f"{API}/classes", params={"search": "Pulse"})
    assert r.status_code == 200
    for c in r.json():
        assert "pulse" in (c["studio_name"] + c["title"] + c["instructor"]).lower()


def test_classes_time_of_day(s):
    from datetime import datetime
    for tod, lo, hi in [("morning", 0, 10), ("midday", 11, 15), ("evening", 16, 23)]:
        r = s.get(f"{API}/classes", params={"time_of_day": tod})
        assert r.status_code == 200
        for c in r.json():
            h = datetime.fromisoformat(c["start_time"]).hour
            assert lo <= h <= hi, f"{tod} got hour {h}"


# ---- Me ----
def test_me(s):
    r = s.get(f"{API}/me")
    assert r.status_code == 200
    d = r.json()
    assert d["id"] == "demo-user"
    assert isinstance(d["credits"], int)


# ---- Booking flow ----
def test_booking_flow(s):
    me0 = s.get(f"{API}/me").json()
    classes = s.get(f"{API}/classes").json()
    # pick an affordable class with spots
    target = None
    for c in classes:
        if c["spots_left"] > 0 and c["credits"] <= me0["credits"]:
            # avoid duplicate (already booked)
            existing = s.get(f"{API}/bookings").json()
            if any(b["class_id"] == c["id"] and b["status"] == "confirmed" for b in existing):
                continue
            target = c
            break
    assert target, "No affordable class with spots"

    r = s.post(f"{API}/bookings", json={"class_id": target["id"]})
    assert r.status_code == 200, r.text
    booking = r.json()
    assert booking["class_id"] == target["id"]
    assert booking["status"] == "confirmed"

    # credits decremented
    me1 = s.get(f"{API}/me").json()
    assert me1["credits"] == me0["credits"] - target["credits"]

    # spots decremented
    c1 = s.get(f"{API}/classes/{target['id']}").json()
    assert c1["spots_left"] == target["spots_left"] - 1

    # duplicate booking -> 400
    dup = s.post(f"{API}/bookings", json={"class_id": target["id"]})
    assert dup.status_code == 400

    # cancel
    c = s.post(f"{API}/bookings/{booking['id']}/cancel")
    assert c.status_code == 200
    assert c.json()["status"] == "cancelled"

    # credits refunded
    me2 = s.get(f"{API}/me").json()
    assert me2["credits"] == me0["credits"]

    # spots restored
    c2 = s.get(f"{API}/classes/{target['id']}").json()
    assert c2["spots_left"] == target["spots_left"]


def test_booking_class_not_found(s):
    r = s.post(f"{API}/bookings", json={"class_id": "nope"})
    assert r.status_code == 404
