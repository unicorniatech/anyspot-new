from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
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
    status: str = "confirmed"  # confirmed, cancelled, completed
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class UserProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "demo-user"
    name: str = "Alex Rivera"
    email: str = "alex@anyspot.com"
    credits: int = 24
    avatar: str = "https://images.pexels.com/photos/6739935/pexels-photo-6739935.jpeg"

class BookingCreate(BaseModel):
    class_id: str

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

    # Seed demo user
    if not await db.users.find_one({"id": "demo-user"}):
        await db.users.insert_one(UserProfile().model_dump())

# ---------------- Routes ----------------

@api_router.get("/")
async def root():
    return {"message": "AnySpot API"}

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

@api_router.get("/me", response_model=UserProfile)
async def get_me():
    doc = await db.users.find_one({"id": "demo-user"}, {"_id": 0})
    if not doc:
        u = UserProfile()
        await db.users.insert_one(u.model_dump())
        return u
    return doc

@api_router.get("/bookings", response_model=List[Booking])
async def list_bookings():
    docs = await db.bookings.find({"user_id": "demo-user"}, {"_id": 0}).sort("start_time", -1).to_list(100)
    return docs

@api_router.post("/bookings", response_model=Booking)
async def create_booking(payload: BookingCreate):
    cls = await db.classes.find_one({"id": payload.class_id}, {"_id": 0})
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    if cls["spots_left"] <= 0:
        raise HTTPException(status_code=400, detail="Class is full")

    user = await db.users.find_one({"id": "demo-user"}, {"_id": 0})
    if not user:
        user = UserProfile().model_dump()
        await db.users.insert_one(user)
    if user["credits"] < cls["credits"]:
        raise HTTPException(status_code=400, detail="Not enough credits")

    # Prevent duplicate booking
    existing = await db.bookings.find_one({"user_id": "demo-user", "class_id": payload.class_id, "status": "confirmed"})
    if existing:
        raise HTTPException(status_code=400, detail="Already booked")

    booking = Booking(
        user_id="demo-user",
        class_id=cls["id"],
        class_title=cls["title"],
        studio_name=cls["studio_name"],
        instructor=cls["instructor"],
        start_time=cls["start_time"],
        credits=cls["credits"],
        image=cls["image"],
    )
    await db.bookings.insert_one(booking.model_dump())
    await db.users.update_one({"id": "demo-user"}, {"$inc": {"credits": -cls["credits"]}})
    await db.classes.update_one({"id": cls["id"]}, {"$inc": {"spots_left": -1}})
    return booking

@api_router.post("/bookings/{booking_id}/cancel", response_model=Booking)
async def cancel_booking(booking_id: str):
    booking = await db.bookings.find_one({"id": booking_id, "user_id": "demo-user"}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking["status"] != "confirmed":
        raise HTTPException(status_code=400, detail="Booking cannot be cancelled")
    await db.bookings.update_one({"id": booking_id}, {"$set": {"status": "cancelled"}})
    await db.users.update_one({"id": "demo-user"}, {"$inc": {"credits": booking["credits"]}})
    await db.classes.update_one({"id": booking["class_id"]}, {"$inc": {"spots_left": 1}})
    booking["status"] = "cancelled"
    return booking

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
    except Exception as e:
        logger.exception("Seed failed: %s", e)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
