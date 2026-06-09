from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import httpx
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ---------------- Models ----------------

class Studio(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    tagline: str
    city: str
    neighborhood: str
    cover_image: str
    gallery: List[str] = []
    vibe: str
    amenities: List[str] = []
    rating: float = 4.8
    review_count: int = 0
    instructor_name: str = ""
    instructor_image: str = ""
    instructor_bio: str = ""
    categories: List[str] = []

class FitClass(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    studio_id: str
    studio_name: str
    title: str
    instructor: str
    category: str  # Pilates, Yoga, HIIT, Cycling, Strength
    description: str
    duration_min: int
    credits: int
    start_time: str  # ISO string
    image: str
    spots_left: int = 8
    capacity: int = 12
    waitlist_count: int = 0

class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    class_id: str
    class_title: str
    studio_name: str
    instructor: str
    start_time: str
    credits: int
    image: str
    status: str = "confirmed"  # confirmed, cancelled, completed, waitlist
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = ""
    credits: int = 24
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class BookingCreate(BaseModel):
    class_id: str

class ClassCreate(BaseModel):
    studio_id: str
    title: str
    instructor: Optional[str] = None
    category: str
    description: str = ""
    duration_min: int = 60
    credits: int = 2
    start_time: str
    image: Optional[str] = None
    capacity: int = 12

class ClassUpdate(BaseModel):
    title: Optional[str] = None
    instructor: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    duration_min: Optional[int] = None
    credits: Optional[int] = None
    start_time: Optional[str] = None
    image: Optional[str] = None
    capacity: Optional[int] = None

# ---------------- Seed Data ----------------

STUDIO_IMAGES = [
    "https://images.unsplash.com/photo-1758631279366-8e8aeaf94082",
    "https://images.unsplash.com/photo-1747239069226-55382c570116",
    "https://images.unsplash.com/photo-1747238415033-b74eec07eb59",
    "https://images.unsplash.com/photo-1591258370814-01609b341790",
]

CLASS_IMAGES = [
    "https://images.unsplash.com/photo-1747238415033-b74eec07eb59",
    "https://images.unsplash.com/photo-1591258370814-01609b341790",
    "https://images.unsplash.com/photo-1747239069226-55382c570116",
    "https://images.unsplash.com/photo-1758631279366-8e8aeaf94082",
]

INSTRUCTOR_IMAGE = "https://images.pexels.com/photos/6739935/pexels-photo-6739935.jpeg"

SEED_STUDIOS = [
    {
        "name": "Kinetic Elite",
        "tagline": "Where movement becomes art",
        "city": "New York",
        "neighborhood": "SoHo",
        "vibe": "An intimate, light-flooded boutique studio focused on reformer Pilates and intentional strength training. We believe in mindful movement, expert coaching, and small classes that feel like a private session.",
        "amenities": ["Filtered Water", "Eucalyptus Towels", "Premium Mats", "Locker Room", "Shower", "Aromatherapy"],
        "categories": ["Pilates", "Yoga", "Strength"],
        "instructor_name": "Maya Chen",
        "instructor_bio": "Certified STOTT Pilates instructor with 12 years of experience. Maya blends classical technique with contemporary flow.",
        "rating": 4.9,
        "review_count": 412,
    },
    {
        "name": "Pulse Atelier",
        "tagline": "Sweat with intention",
        "city": "Los Angeles",
        "neighborhood": "Silver Lake",
        "vibe": "High-energy HIIT and cycling studio with a community-first ethos. Expect curated playlists, infrared lighting, and a roster of LA's best coaches.",
        "amenities": ["Sound System", "Cycling Shoes", "Towel Service", "Smoothie Bar", "Lockers"],
        "categories": ["HIIT", "Cycling"],
        "instructor_name": "Jordan Reyes",
        "instructor_bio": "Former pro cyclist turned coach. Jordan's rides are part workout, part live concert.",
        "rating": 4.8,
        "review_count": 287,
    },
    {
        "name": "Stillwater Yoga",
        "tagline": "Find your stillness",
        "city": "Brooklyn",
        "neighborhood": "Williamsburg",
        "vibe": "A serene refuge for vinyasa, yin, and meditation. Warm wood, soft lighting, and a deeply experienced teaching collective.",
        "amenities": ["Heated Studio", "Tea Lounge", "Props Provided", "Meditation Garden"],
        "categories": ["Yoga"],
        "instructor_name": "Priya Patel",
        "instructor_bio": "E-RYT 500 with a background in Iyengar and Ashtanga. Priya teaches alignment-based vinyasa with breath at the center.",
        "rating": 4.9,
        "review_count": 521,
    },
    {
        "name": "Forge Strength Lab",
        "tagline": "Build, sustainably",
        "city": "Austin",
        "neighborhood": "East Austin",
        "vibe": "Small-group strength training in a no-nonsense, beautifully designed lab. Programs are progressive, data-informed, and built for longevity.",
        "amenities": ["Olympic Platforms", "Sled Track", "Recovery Room", "InBody Scans"],
        "categories": ["Strength", "HIIT"],
        "instructor_name": "Marcus Hale",
        "instructor_bio": "CSCS coach with a Masters in Exercise Science. Marcus has trained Olympic hopefuls and weekend warriors alike.",
        "rating": 4.9,
        "review_count": 198,
    },
]

CLASS_TEMPLATES = [
    ("Reformer Flow", "Pilates", 50, 3, "Dynamic reformer sequence building strength and length through the full body."),
    ("Power Vinyasa", "Yoga", 60, 2, "A breath-led, powerful flow with focus on alignment and core."),
    ("Yin & Restore", "Yoga", 75, 2, "Long-held floor postures and breath work to release deep tissue."),
    ("Rhythm Ride", "Cycling", 45, 3, "High-intensity indoor cycling set to a curated playlist."),
    ("Sculpt HIIT", "HIIT", 45, 3, "Intervals blending strength, cardio, and core."),
    ("Foundations Strength", "Strength", 60, 4, "Compound lifts coached small-group style. Build the basics."),
    ("Mat Pilates", "Pilates", 50, 2, "Classical mat work refined for modern bodies."),
    ("Sunrise Flow", "Yoga", 45, 2, "Wake the body gently with a flowing, light morning practice."),
]

async def ensure_seed():
    if await db.studios.count_documents({}) > 0:
        return
    studio_docs = []
    for i, s in enumerate(SEED_STUDIOS):
        studio = Studio(
            **s,
            cover_image=STUDIO_IMAGES[i % len(STUDIO_IMAGES)],
            gallery=[STUDIO_IMAGES[(i + j) % len(STUDIO_IMAGES)] for j in range(3)],
            instructor_image=INSTRUCTOR_IMAGE,
        )
        studio_docs.append(studio.model_dump())
    await db.studios.insert_many(studio_docs)

    # Generate classes for each studio across the next 14 days
    class_docs = []
    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    for i, studio in enumerate(studio_docs):
        applicable = [t for t in CLASS_TEMPLATES if t[1] in studio["categories"]]
        if not applicable:
            applicable = CLASS_TEMPLATES[:3]
        for d in range(14):
            for slot_idx, hour in enumerate([7, 12, 18]):
                template = applicable[(d + slot_idx) % len(applicable)]
                title, category, duration, credits, desc = template
                start = now + timedelta(days=d, hours=(hour - now.hour))
                fc = FitClass(
                    studio_id=studio["id"],
                    studio_name=studio["name"],
                    title=title,
                    instructor=studio["instructor_name"],
                    category=category,
                    description=desc,
                    duration_min=duration,
                    credits=credits,
                    start_time=start.isoformat(),
                    image=CLASS_IMAGES[(i + d + slot_idx) % len(CLASS_IMAGES)],
                    spots_left=max(1, 12 - ((d + slot_idx) % 9)),
                    capacity=12,
                )
                class_docs.append(fc.model_dump())
    await db.classes.insert_many(class_docs)

# ---------------- Auth ----------------

EMERGENT_SESSION_DATA_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"

async def get_current_user(request: Request) -> dict:
    """Resolve current user from session_token cookie OR Authorization Bearer header."""
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("authorization") or request.headers.get("Authorization")
        if auth and auth.lower().startswith("bearer "):
            token = auth.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")

    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")

    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

class SessionExchange(BaseModel):
    session_id: str

# ---------------- Routes ----------------

@api_router.get("/")
async def root():
    return {"message": "AnySpot API"}

@api_router.post("/auth/session")
async def auth_session(payload: SessionExchange, response: Response):
    async with httpx.AsyncClient(timeout=15) as h:
        r = await h.get(
            EMERGENT_SESSION_DATA_URL,
            headers={"X-Session-ID": payload.session_id},
        )
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Could not exchange session")
    data = r.json()

    email = data.get("email")
    name = data.get("name", "")
    picture = data.get("picture", "")
    session_token = data.get("session_token")
    if not email or not session_token:
        raise HTTPException(status_code=401, detail="Invalid session data")

    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = User(user_id=user_id, email=email, name=name, picture=picture).model_dump()
        await db.users.insert_one(user)
    else:
        # Refresh name/picture if changed
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {"$set": {"name": name or user["name"], "picture": picture or user.get("picture", "")}},
        )
        user["name"] = name or user["name"]
        user["picture"] = picture or user.get("picture", "")

    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user["user_id"],
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    response.set_cookie(
        key="session_token",
        value=session_token,
        max_age=7 * 24 * 60 * 60,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
    )
    return {"user": user}

@api_router.get("/auth/me")
async def auth_me(user: dict = Depends(get_current_user)):
    return user

@api_router.post("/auth/logout")
async def auth_logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("authorization") or request.headers.get("Authorization")
        if auth and auth.lower().startswith("bearer "):
            token = auth.split(" ", 1)[1].strip()
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/", samesite="none", secure=True)
    return {"ok": True}

@api_router.get("/studios", response_model=List[Studio])
async def list_studios():
    docs = await db.studios.find({}, {"_id": 0}).to_list(100)
    return docs

@api_router.get("/studios/{studio_id}", response_model=Studio)
async def get_studio(studio_id: str):
    doc = await db.studios.find_one({"id": studio_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Studio not found")
    return doc

@api_router.get("/studios/{studio_id}/classes", response_model=List[FitClass])
async def get_studio_classes(studio_id: str):
    now_iso = datetime.now(timezone.utc).isoformat()
    docs = await db.classes.find(
        {"studio_id": studio_id, "start_time": {"$gte": now_iso}}, {"_id": 0}
    ).sort("start_time", 1).to_list(200)
    return docs

@api_router.get("/classes", response_model=List[FitClass])
async def list_classes(
    category: Optional[str] = None,
    max_credits: Optional[int] = None,
    search: Optional[str] = None,
    time_of_day: Optional[str] = None,  # morning, midday, evening
):
    query = {"start_time": {"$gte": datetime.now(timezone.utc).isoformat()}}
    if category and category.lower() != "all":
        query["category"] = category
    if max_credits is not None:
        query["credits"] = {"$lte": max_credits}
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"studio_name": {"$regex": search, "$options": "i"}},
            {"instructor": {"$regex": search, "$options": "i"}},
        ]
    docs = await db.classes.find(query, {"_id": 0}).sort("start_time", 1).to_list(300)
    if time_of_day:
        def hour_of(c):
            return datetime.fromisoformat(c["start_time"]).hour
        if time_of_day == "morning":
            docs = [c for c in docs if hour_of(c) < 11]
        elif time_of_day == "midday":
            docs = [c for c in docs if 11 <= hour_of(c) < 16]
        elif time_of_day == "evening":
            docs = [c for c in docs if hour_of(c) >= 16]
    return docs[:60]

@api_router.get("/classes/{class_id}", response_model=FitClass)
async def get_class(class_id: str):
    doc = await db.classes.find_one({"id": class_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Class not found")
    return doc

@api_router.get("/me", response_model=User)
async def get_me(user: dict = Depends(get_current_user)):
    return user

@api_router.get("/bookings", response_model=List[Booking])
async def list_bookings(user: dict = Depends(get_current_user)):
    docs = await db.bookings.find({"user_id": user["user_id"]}, {"_id": 0}).sort("start_time", -1).to_list(100)
    return docs

@api_router.post("/bookings", response_model=Booking)
async def create_booking(payload: BookingCreate, user: dict = Depends(get_current_user)):
    cls = await db.classes.find_one({"id": payload.class_id}, {"_id": 0})
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")

    # Prevent duplicate booking (confirmed or waitlist)
    existing = await db.bookings.find_one({
        "user_id": user["user_id"],
        "class_id": payload.class_id,
        "status": {"$in": ["confirmed", "waitlist"]},
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already booked")

    is_waitlist = cls["spots_left"] <= 0
    if not is_waitlist and user["credits"] < cls["credits"]:
        raise HTTPException(status_code=400, detail="Not enough credits")

    booking = Booking(
        user_id=user["user_id"],
        class_id=cls["id"],
        class_title=cls["title"],
        studio_name=cls["studio_name"],
        instructor=cls["instructor"],
        start_time=cls["start_time"],
        credits=cls["credits"],
        image=cls["image"],
        status="waitlist" if is_waitlist else "confirmed",
    )
    await db.bookings.insert_one(booking.model_dump())
    if is_waitlist:
        await db.classes.update_one({"id": cls["id"]}, {"$inc": {"waitlist_count": 1}})
    else:
        await db.users.update_one({"user_id": user["user_id"]}, {"$inc": {"credits": -cls["credits"]}})
        await db.classes.update_one({"id": cls["id"]}, {"$inc": {"spots_left": -1}})
    return booking

@api_router.post("/bookings/{booking_id}/cancel", response_model=Booking)
async def cancel_booking(booking_id: str, user: dict = Depends(get_current_user)):
    booking = await db.bookings.find_one({"id": booking_id, "user_id": user["user_id"]}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking["status"] not in ("confirmed", "waitlist"):
        raise HTTPException(status_code=400, detail="Booking cannot be cancelled")

    await db.bookings.update_one({"id": booking_id}, {"$set": {"status": "cancelled"}})

    if booking["status"] == "waitlist":
        await db.classes.update_one({"id": booking["class_id"]}, {"$inc": {"waitlist_count": -1}})
        booking["status"] = "cancelled"
        return booking

    # Confirmed cancellation: refund + restore spot
    await db.users.update_one({"user_id": user["user_id"]}, {"$inc": {"credits": booking["credits"]}})
    await db.classes.update_one({"id": booking["class_id"]}, {"$inc": {"spots_left": 1}})

    # Promote earliest waitlist booking (any user) if any
    promote = await db.bookings.find_one(
        {"class_id": booking["class_id"], "status": "waitlist"},
        {"_id": 0},
        sort=[("created_at", 1)],
    )
    if promote:
        promoted_user = await db.users.find_one({"user_id": promote["user_id"]}, {"_id": 0})
        if promoted_user and promoted_user["credits"] >= promote["credits"]:
            await db.bookings.update_one({"id": promote["id"]}, {"$set": {"status": "confirmed"}})
            await db.users.update_one({"user_id": promote["user_id"]}, {"$inc": {"credits": -promote["credits"]}})
            await db.classes.update_one(
                {"id": booking["class_id"]},
                {"$inc": {"spots_left": -1, "waitlist_count": -1}},
            )

    booking["status"] = "cancelled"
    return booking

# ---------------- Partner endpoints ----------------
# For Phase 2 we treat a single "demo partner" who owns ALL seeded studios.

@api_router.get("/partner/studios", response_model=List[Studio])
async def partner_studios(_: dict = Depends(get_current_user)):
    docs = await db.studios.find({}, {"_id": 0}).to_list(100)
    return docs

@api_router.get("/partner/overview")
async def partner_overview(_: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    week_ago = (now - timedelta(days=7)).isoformat()
    month_ago = (now - timedelta(days=30)).isoformat()

    week_bookings = await db.bookings.find(
        {"status": "confirmed", "created_at": {"$gte": week_ago}}, {"_id": 0}
    ).to_list(1000)
    month_bookings = await db.bookings.find(
        {"status": "confirmed", "created_at": {"$gte": month_ago}}, {"_id": 0}
    ).to_list(5000)
    all_confirmed = await db.bookings.find({"status": "confirmed"}, {"_id": 0}).to_list(10000)

    week_credits = sum(b["credits"] for b in week_bookings)
    month_credits = sum(b["credits"] for b in month_bookings)

    # Top classes by booking count (all confirmed)
    by_class = {}
    for b in all_confirmed:
        key = (b["class_id"], b["class_title"], b["studio_name"])
        by_class[key] = by_class.get(key, 0) + 1
    top_classes = [
        {"class_id": k[0], "title": k[1], "studio_name": k[2], "bookings": v}
        for k, v in sorted(by_class.items(), key=lambda x: -x[1])[:5]
    ]

    # Upcoming class roster summary (next 7 days)
    now_iso = now.isoformat()
    next_week_iso = (now + timedelta(days=7)).isoformat()
    upcoming_classes = await db.classes.find(
        {"start_time": {"$gte": now_iso, "$lte": next_week_iso}}, {"_id": 0}
    ).sort("start_time", 1).to_list(50)
    roster = []
    for c in upcoming_classes[:8]:
        booked = await db.bookings.count_documents({"class_id": c["id"], "status": "confirmed"})
        waitlisted = await db.bookings.count_documents({"class_id": c["id"], "status": "waitlist"})
        roster.append({
            "class_id": c["id"],
            "title": c["title"],
            "studio_name": c["studio_name"],
            "start_time": c["start_time"],
            "capacity": c["capacity"],
            "booked": booked,
            "spots_left": c["spots_left"],
            "waitlist": waitlisted,
        })

    return {
        "reservations_week": len(week_bookings),
        "reservations_month": len(month_bookings),
        "credits_week": week_credits,
        "credits_month": month_credits,
        "active_classes": await db.classes.count_documents({"start_time": {"$gte": now_iso}}),
        "total_studios": await db.studios.count_documents({}),
        "top_classes": top_classes,
        "upcoming_roster": roster,
    }

@api_router.get("/partner/classes", response_model=List[FitClass])
async def partner_list_classes(studio_id: Optional[str] = None, upcoming: bool = True, _: dict = Depends(get_current_user)):
    query = {}
    if studio_id:
        query["studio_id"] = studio_id
    if upcoming:
        query["start_time"] = {"$gte": datetime.now(timezone.utc).isoformat()}
    docs = await db.classes.find(query, {"_id": 0}).sort("start_time", 1).to_list(500)
    return docs

@api_router.get("/partner/classes/{class_id}/roster", response_model=List[Booking])
async def partner_class_roster(class_id: str):
    docs = await db.bookings.find(
        {"class_id": class_id, "status": {"$in": ["confirmed", "waitlist"]}}, {"_id": 0}
    ).sort("created_at", 1).to_list(200)
    return docs

@api_router.post("/partner/classes", response_model=FitClass)
async def partner_create_class(payload: ClassCreate, _: dict = Depends(get_current_user)):
    studio = await db.studios.find_one({"id": payload.studio_id}, {"_id": 0})
    if not studio:
        raise HTTPException(status_code=404, detail="Studio not found")
    fc = FitClass(
        studio_id=studio["id"],
        studio_name=studio["name"],
        title=payload.title,
        instructor=payload.instructor or studio["instructor_name"],
        category=payload.category,
        description=payload.description,
        duration_min=payload.duration_min,
        credits=payload.credits,
        start_time=payload.start_time,
        image=payload.image or studio["cover_image"],
        spots_left=payload.capacity,
        capacity=payload.capacity,
    )
    await db.classes.insert_one(fc.model_dump())
    return fc

@api_router.patch("/partner/classes/{class_id}", response_model=FitClass)
async def partner_update_class(class_id: str, payload: ClassUpdate, _: dict = Depends(get_current_user)):
    existing = await db.classes.find_one({"id": class_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Class not found")
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    if "capacity" in update:
        # adjust spots_left by the delta (don't go below 0)
        delta = update["capacity"] - existing["capacity"]
        new_spots = max(0, existing["spots_left"] + delta)
        update["spots_left"] = new_spots
    if update:
        await db.classes.update_one({"id": class_id}, {"$set": update})
    updated = await db.classes.find_one({"id": class_id}, {"_id": 0})
    return updated

@api_router.delete("/partner/classes/{class_id}")
async def partner_delete_class(class_id: str, _: dict = Depends(get_current_user)):
    existing = await db.classes.find_one({"id": class_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Class not found")
    # Cancel any active bookings and refund credits
    active = await db.bookings.find(
        {"class_id": class_id, "status": {"$in": ["confirmed", "waitlist"]}}, {"_id": 0}
    ).to_list(500)
    for b in active:
        await db.bookings.update_one({"id": b["id"]}, {"$set": {"status": "cancelled"}})
        if b["status"] == "confirmed":
            await db.users.update_one({"user_id": b["user_id"]}, {"$inc": {"credits": b["credits"]}})
    await db.classes.delete_one({"id": class_id})
    return {"ok": True, "cancelled": len(active)}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def on_startup():
    try:
        await ensure_seed()
        # Clean legacy demo-user data from Phase 1/2 (pre-auth)
        await db.users.delete_many({"id": "demo-user"})
        await db.bookings.delete_many({"user_id": "demo-user"})
        # Reset spots_left & waitlist_count to capacity in case orphan bookings affected them
        await db.classes.update_many({}, [{"$set": {"spots_left": "$capacity", "waitlist_count": 0}}])
    except Exception as e:
        logger.exception("Seed failed: %s", e)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
