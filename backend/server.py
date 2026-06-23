from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
import httpx
import re
import jwt
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import Any, Dict, List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from supabase_mongo_adapter import create_supabase_db

try:
    from motor.motor_asyncio import AsyncIOMotorClient
except Exception:
    AsyncIOMotorClient = None

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY')
AUTH_PREVIEW_MODE = os.environ.get('AUTH_PREVIEW_MODE', 'false').lower() == 'true'
MOCK_DATA_ENABLED = os.environ.get('MOCK_DATA_ENABLED', 'true').lower() == 'true'


def parse_cors_origins(raw: Optional[str]) -> List[str]:
    if not raw:
        return ["*"]
    origins = [origin.strip().rstrip("/") for origin in raw.split(",") if origin.strip()]
    return origins or ["*"]


def is_allowed_origin(origin: Optional[str]) -> bool:
    if not origin:
        return True
    if CORS_ORIGINS == ["*"]:
        return True
    origin = origin.rstrip("/")
    for allowed in CORS_ORIGINS:
        if allowed == "*":
            return True
        if origin == allowed:
            return True
        # Allow any Vercel preview/branch deployment of the frontend project
        if allowed.endswith(".vercel.app") and origin.endswith(".vercel.app"):
            return True
    return False


CORS_ORIGINS = parse_cors_origins(os.environ.get('CORS_ORIGINS', '*'))

DEMO_ENABLED = os.environ.get('DEMO_ENABLED', 'true').lower() == 'true'
DEMO_JWT_SECRET = os.environ.get('DEMO_JWT_SECRET', 'anyspot-demo-secret-change-in-production')
DEMO_USERS = {
    "admin@anyspot.demo": {
        "user_id": "demo_admin",
        "email": "admin@anyspot.demo",
        "name": "Demo Admin",
        "role": "admin",
        "password": "demo-admin-2024",
        "picture": "",
        "credits": 0,
    },
    "gym@anyspot.demo": {
        "user_id": "demo_gym",
        "email": "gym@anyspot.demo",
        "name": "Demo Gym",
        "role": "studio",
        "password": "demo-gym-2024",
        "picture": "",
        "credits": 0,
    },
    "user@anyspot.demo": {
        "user_id": "demo_user",
        "email": "user@anyspot.demo",
        "name": "Demo User",
        "role": "customer",
        "password": "demo-user-2024",
        "picture": "",
        "credits": 100,
    },
}

client = None
if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
    db = create_supabase_db(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
else:
    if AsyncIOMotorClient is None:
        raise RuntimeError('Mongo fallback unavailable and SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY not set')
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
    role: str = "customer"  # customer | studio | admin
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
    level: Optional[str] = None
    trainer_user_id: Optional[str] = None
    description: str = ""
    duration_min: int = 60
    credits: int = 2
    price_czk: Optional[int] = None
    cancellation_hours: Optional[int] = None
    repeat_weekly: bool = False
    repeat_days: List[int] = []
    start_time: str
    image: Optional[str] = None
    capacity: int = 12

class ClassUpdate(BaseModel):
    title: Optional[str] = None
    instructor: Optional[str] = None
    category: Optional[str] = None
    level: Optional[str] = None
    trainer_user_id: Optional[str] = None
    description: Optional[str] = None
    duration_min: Optional[int] = None
    credits: Optional[int] = None
    price_czk: Optional[int] = None
    cancellation_hours: Optional[int] = None
    repeat_weekly: Optional[bool] = None
    repeat_days: Optional[List[int]] = None
    start_time: Optional[str] = None
    image: Optional[str] = None
    capacity: Optional[int] = None


class StudioRegistrationRequest(BaseModel):
    studio_name: str
    address: str
    contact_name: str
    contact_phone: str
    contact_email: str
    password: str
    company_id: Optional[str] = None
    agree_terms: bool


class StudioProfileOnboardingRequest(BaseModel):
    logo_url: Optional[str] = None
    photos: List[str] = []
    description: str
    studio_types: List[str]
    opening_hours: Dict[str, Any] = {}


class StudioPaymentSetupRequest(BaseModel):
    stripe_account_id: Optional[str] = None


class TeamInviteRequest(BaseModel):
    emails: List[str]


class DuplicateClassRequest(BaseModel):
    start_time: str


class AuthRoleUpdateRequest(BaseModel):
    role: str


class DemoLoginRequest(BaseModel):
    email: str
    password: str


class StudioBootstrapRequest(BaseModel):
    studio_name: Optional[str] = None
    address: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    company_id: Optional[str] = None


class UserProfileUpdateRequest(BaseModel):
    name: Optional[str] = None

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

CATEGORY_CLASS_PACKS = {
    "Pilates": [
        ("Reformer Core Burn", 50, 3, "Precision-based reformer work for deep core strength and posture.", "https://images.unsplash.com/photo-1518611012118-696072aa579a"),
        ("Pilates Sculpt", 55, 3, "Low-impact full-body sculpt session with athletic sequencing.", "https://images.unsplash.com/photo-1518310383802-640c2de311b2"),
    ],
    "Yoga": [
        ("Vinyasa Reset", 60, 2, "Breath-led flow to build mobility, heat, and calm focus.", "https://images.unsplash.com/photo-1506126613408-eca07ce68773"),
        ("Deep Stretch & Yin", 75, 2, "Long holds and guided breathwork for recovery and release.", "https://images.unsplash.com/photo-1545205597-3d9d02c29597"),
    ],
    "HIIT": [
        ("HIIT Ignite", 45, 3, "Intervals blending cardio bursts and strength rounds.", "https://images.unsplash.com/photo-1517836357463-d25dfeac3438"),
        ("MetCon Express", 40, 3, "Fast-paced metabolic conditioning with coach-led scaling.", "https://images.unsplash.com/photo-1434682881908-b43d0467b798"),
    ],
    "Cycling": [
        ("Rhythm Ride", 45, 3, "Beat-driven indoor cycling with climbs, sprints, and choreography.", "https://images.unsplash.com/photo-1576678927484-cc907957088c"),
        ("Power Climb", 50, 3, "Performance ride focused on power output and endurance blocks.", "https://images.unsplash.com/photo-1594737625785-a6cbdabd333c"),
    ],
    "Strength": [
        ("Strength Foundations", 60, 4, "Coach-guided compound lift session for long-term progress.", "https://images.unsplash.com/photo-1517963879433-6ad2b056d712"),
        ("Upper + Core Lab", 55, 3, "Upper-body strength and trunk stability programming.", "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61"),
    ],
}

async def ensure_seed():
    studio_count = await db.studios.count_documents({})
    if studio_count == 0:
        studio_docs = []
        for i, s in enumerate(SEED_STUDIOS):
            studio = Studio(
                **s,
                cover_image=STUDIO_IMAGES[i % len(STUDIO_IMAGES)],
                gallery=[STUDIO_IMAGES[(i + j) % len(STUDIO_IMAGES)] for j in range(3)],
                instructor_image=INSTRUCTOR_IMAGE,
            )
            studio_docs.append(studio.model_dump())
        if studio_docs:
            await db.studios.insert_many(studio_docs)
    else:
        studio_docs = await db.studios.find({}, {"_id": 0}).to_list(200)

    class_count = await db.classes.count_documents({})
    if class_count > 0 or not studio_docs:
        return

    class_docs = []
    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    for i, studio in enumerate(studio_docs):
        categories = studio.get("categories") or []
        applicable = [t for t in CLASS_TEMPLATES if t[1] in categories]
        if not applicable:
            applicable = CLASS_TEMPLATES
        instructor_name = studio.get("instructor_name") or "Instructor"
        studio_name = studio.get("name") or "Studio"
        for d in range(14):
            for slot_idx, hour in enumerate([7, 12, 18]):
                template = applicable[(d + slot_idx) % len(applicable)]
                title, category, duration, credits, desc = template
                start = now + timedelta(days=d, hours=(hour - now.hour))
                fc = FitClass(
                    studio_id=studio["id"],
                    studio_name=studio_name,
                    title=title,
                    instructor=instructor_name,
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
    if class_docs:
        await db.classes.insert_many(class_docs)


async def ensure_mock_category_coverage():
    if not MOCK_DATA_ENABLED:
        return

    now_iso = datetime.now(timezone.utc).isoformat()
    core_categories = ["Pilates", "Yoga", "HIIT", "Cycling", "Strength"]
    missing = []
    for c in core_categories:
        count = await db.classes.count_documents({"category": c, "start_time": {"$gte": now_iso}})
        if count == 0:
            missing.append(c)

    if not missing:
        return

    studios = await db.studios.find({}, {"_id": 0}).to_list(200)
    if not studios:
        return

    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    class_docs = []
    for idx, category in enumerate(missing):
        studio = studios[idx % len(studios)]
        pack = CATEGORY_CLASS_PACKS.get(category) or []
        if not pack:
            continue
        instructor_name = studio.get("instructor_name") or "Instructor"
        studio_name = studio.get("name") or "Studio"
        for slot_idx, (title, duration, credits, desc, image) in enumerate(pack):
            start = now + timedelta(days=slot_idx, hours=(7 + (idx * 2 + slot_idx * 5) % 12 - now.hour))
            fc = FitClass(
                studio_id=studio["id"],
                studio_name=studio_name,
                title=title,
                instructor=instructor_name,
                category=category,
                description=desc,
                duration_min=duration,
                credits=credits,
                start_time=start.isoformat(),
                image=image,
                spots_left=max(1, 10 - ((idx + slot_idx) % 6)),
                capacity=12,
            )
            class_docs.append(fc.model_dump())

    if class_docs:
        await db.classes.insert_many(class_docs)


async def ensure_seed_on_demand():
    if not MOCK_DATA_ENABLED:
        return
    studio_count = await db.studios.count_documents({})
    class_count = await db.classes.count_documents({})
    if studio_count == 0 or class_count == 0:
        await ensure_seed()
    await ensure_mock_category_coverage()

# ---------------- Auth ----------------

EMERGENT_SESSION_DATA_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"

PREVIEW_USER_ID = "preview-user"

async def ensure_preview_user():
    """Ensure a 'preview' user with credits + some bookings exists, so unauthed visits to
    /dashboard and /partner show a real, lived-in state. Remove this once auth is enforced."""
    existing = await db.users.find_one({"user_id": PREVIEW_USER_ID}, {"_id": 0})
    if existing:
        return
    await db.users.insert_one(User(
        user_id=PREVIEW_USER_ID,
        email="preview@anyspot.com",
        name="Alex Rivera",
        picture="https://images.pexels.com/photos/6739935/pexels-photo-6739935.jpeg",
        credits=18,
    ).model_dump())

    # Seed 3 bookings (2 confirmed + 1 waitlist) using real upcoming classes
    now_iso = datetime.now(timezone.utc).isoformat()
    classes = await db.classes.find(
        {"start_time": {"$gte": now_iso}}, {"_id": 0}
    ).sort("start_time", 1).limit(3).to_list(3)
    for i, c in enumerate(classes):
        status = "waitlist" if i == 2 else "confirmed"
        await db.bookings.insert_one(Booking(
            user_id=PREVIEW_USER_ID,
            class_id=c["id"],
            class_title=c["title"],
            studio_name=c["studio_name"],
            instructor=c["instructor"],
            start_time=c["start_time"],
            credits=c["credits"],
            image=c["image"],
            status=status,
        ).model_dump())

def create_demo_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "demo": True,
        "iat": now,
        "exp": now + timedelta(days=7),
    }
    return jwt.encode(payload, DEMO_JWT_SECRET, algorithm="HS256")


def verify_demo_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, DEMO_JWT_SECRET, algorithms=["HS256"])
        if payload.get("demo"):
            return DEMO_USERS.get(payload.get("sub"))
    except Exception as e:
        logger.debug("Demo token verification failed: %s", e)
    return None


async def get_current_user(request: Request) -> dict:
    """Resolve current user from Authorization Bearer JWT or demo token.
    Legacy cookie/session auth is intentionally ignored to avoid accidental auto-login
    from stale browser cookies."""
    try:
        token = None
        auth = request.headers.get("authorization") or request.headers.get("Authorization")
        if auth and auth.lower().startswith("bearer "):
            token = auth.split(" ", 1)[1].strip()

        if not token:
            if AUTH_PREVIEW_MODE and request.headers.get("x-anyspot-preview", "").lower() == "true":
                user = await db.users.find_one({"user_id": PREVIEW_USER_ID}, {"_id": 0})
                if not user:
                    await ensure_preview_user()
                    user = await db.users.find_one({"user_id": PREVIEW_USER_ID}, {"_id": 0})
                return user
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Demo tokens take precedence for quick sandbox access
        demo_user = verify_demo_token(token)
        if demo_user:
            return demo_user

        # Prefer Supabase JWT auth when token is a bearer JWT
        supa = await get_supabase_user_from_token(token)
        if not supa:
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        auth_user_id = supa.get("id")
        email = supa.get("email")
        meta = supa.get("user_metadata") or {}
        name = meta.get("name") or meta.get("full_name") or (email.split("@")[0] if email else "Member")
        picture = meta.get("avatar_url") or meta.get("picture") or ""
        role_from_meta = normalize_role(meta.get("role"))

        user = None
        if auth_user_id:
            user = await db.users.find_one({"auth_user_id": auth_user_id}, {"_id": 0})
        if not user and email:
            user = await db.users.find_one({"email": email}, {"_id": 0})

        if not user:
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            user = User(
                user_id=user_id,
                email=email or f"{user_id}@local.invalid",
                name=name,
                picture=picture,
                role=role_from_meta or "customer",
            ).model_dump()
            if auth_user_id:
                user["auth_user_id"] = auth_user_id
            await db.users.insert_one(user)
        else:
            patch = {
                "name": name or user.get("name", ""),
                "picture": picture or user.get("picture", ""),
            }
            if not user.get("role"):
                patch["role"] = role_from_meta or "customer"
            if auth_user_id:
                patch["auth_user_id"] = auth_user_id
            if email:
                patch["email"] = email
            await db.users.update_one({"user_id": user["user_id"]}, {"$set": patch})
            user = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})

        if not user.get("role"):
            await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"role": "customer"}})
            user["role"] = "customer"

        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("get_current_user failed: %s", e)
        raise HTTPException(status_code=500, detail="Authentication check failed")

class SessionExchange(BaseModel):
    session_id: str


async def create_supabase_user_signup(email: str, password: str, name: str) -> Optional[str]:
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        return None

    payload = {
        "email": email,
        "password": password,
        "data": {"name": name},
    }
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=15) as h:
        r = await h.post(f"{SUPABASE_URL}/auth/v1/signup", json=payload, headers=headers)

    if r.status_code >= 400:
        try:
            detail = r.json().get("msg") or r.json().get("message")
        except Exception:
            detail = r.text
        raise HTTPException(status_code=400, detail=f"Could not create auth user: {detail}")

    data = r.json() or {}
    user = data.get("user") or {}
    return user.get("id")


async def get_supabase_user_from_token(token: str) -> Optional[dict]:
    if not SUPABASE_URL:
        return None
    apikey = SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY
    if not apikey:
        return None

    headers = {
        "apikey": apikey,
        "Authorization": f"Bearer {token}",
    }
    try:
        async with httpx.AsyncClient(timeout=15) as h:
            r = await h.get(f"{SUPABASE_URL}/auth/v1/user", headers=headers)
    except Exception as e:
        logger.warning("Supabase auth lookup failed: %s", e)
        return None
    if r.status_code != 200:
        return None
    return r.json()


def normalize_role(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    v = str(value).strip().lower()
    if v in {"customer", "studio", "admin", "superadmin"}:
        return v
    return None


def require_role(user: dict, role: str) -> dict:
    user_role = normalize_role(user.get("role")) or "customer"
    if user_role != role:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return user


async def get_current_studio_user(user: dict = Depends(get_current_user)):
    return require_role(user, "studio")


async def get_current_admin_user(user: dict = Depends(get_current_user)):
    return require_role(user, "admin")


async def get_primary_studio_for_user(user_id: str) -> Optional[dict]:
    link = await db.studio_members.find_one({"user_id": user_id}, {"_id": 0})
    if not link:
        return None
    return await db.studios.find_one({"id": link["studio_id"]}, {"_id": 0})


async def create_studio_for_owner(
    owner_user: dict,
    studio_name: Optional[str] = None,
    address: Optional[str] = None,
    contact_name: Optional[str] = None,
    contact_phone: Optional[str] = None,
    company_id: Optional[str] = None,
) -> dict:
    existing = await get_primary_studio_for_user(owner_user["user_id"])
    if existing:
        return existing

    studio_id = f"studio_{uuid.uuid4().hex[:12]}"
    resolved_name = (studio_name or "").strip() or f"{(owner_user.get('name') or 'New').split(' ')[0]} Studio"
    resolved_contact_name = (contact_name or "").strip() or owner_user.get("name") or "Studio Owner"
    resolved_contact_phone = (contact_phone or "").strip() or owner_user.get("phone") or ""
    resolved_address = (address or "").strip() or "Address TBA"

    studio_doc = Studio(
        id=studio_id,
        name=resolved_name,
        tagline="",
        city=resolved_address,
        neighborhood="",
        cover_image=STUDIO_IMAGES[0],
        gallery=STUDIO_IMAGES[:3],
        vibe="",
        amenities=[],
        instructor_name=resolved_contact_name,
        instructor_image=INSTRUCTOR_IMAGE,
        instructor_bio="",
        categories=[],
    ).model_dump()
    studio_doc.update({
        "address": resolved_address,
        "contact_name": resolved_contact_name,
        "contact_phone": resolved_contact_phone,
        "contact_email": owner_user.get("email", ""),
        "company_id": (company_id or "").strip(),
        "owner_user_id": owner_user["user_id"],
        "onboarding_step": "profile",
        "onboarding_completed": False,
        "payments_active": False,
    })
    await db.studios.insert_one(studio_doc)
    await db.studio_members.insert_one({
        "studio_id": studio_id,
        "user_id": owner_user["user_id"],
        "role": "owner",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return studio_doc

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


@api_router.post("/studio/register")
async def register_studio(payload: StudioRegistrationRequest):
    if not payload.agree_terms:
        raise HTTPException(status_code=400, detail="You must agree to terms & conditions")

    existing = await db.users.find_one({"email": payload.contact_email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email is already registered")

    auth_user_id = await create_supabase_user_signup(
        payload.contact_email,
        payload.password,
        payload.contact_name,
    )

    user_id = f"user_{uuid.uuid4().hex[:12]}"
    studio_id = f"studio_{uuid.uuid4().hex[:12]}"

    user = User(
        user_id=user_id,
        email=payload.contact_email,
        name=payload.contact_name,
        role="studio",
        picture="",
        credits=24,
    ).model_dump()
    if auth_user_id:
        user["auth_user_id"] = auth_user_id
    await db.users.insert_one(user)
    studio_doc = await create_studio_for_owner(
        user,
        studio_name=payload.studio_name,
        address=payload.address,
        contact_name=payload.contact_name,
        contact_phone=payload.contact_phone,
        company_id=payload.company_id,
    )

    return {
        "ok": True,
        "studio_id": studio_doc["id"],
        "user_id": user_id,
        "verification": "sent" if auth_user_id else "not_configured",
    }

@api_router.get("/auth/me")
async def auth_me(user: dict = Depends(get_current_user)):
    try:
        return user
    except Exception as e:
        logger.exception("auth/me failed: %s", e)
        raise HTTPException(status_code=500, detail="Auth check failed")


@api_router.post("/auth/demo/login")
async def demo_login(payload: DemoLoginRequest):
    try:
        if not DEMO_ENABLED:
            raise HTTPException(status_code=403, detail="Demo login is disabled")
        account = DEMO_USERS.get(payload.email.lower())
        if not account or account.get("password") != payload.password:
            raise HTTPException(status_code=401, detail="Invalid demo credentials")

        # Sync demo user into the database so role-specific endpoints work
        existing = await db.users.find_one({"user_id": account["user_id"]}, {"_id": 0})
        if not existing:
            await db.users.insert_one(User(
                user_id=account["user_id"],
                email=account["email"],
                name=account["name"],
                role=account["role"],
                picture=account.get("picture", ""),
                credits=account.get("credits", 0),
            ).model_dump())

        # Ensure the gym demo account has a studio to manage
        if account["role"] == "studio":
            studio = await get_primary_studio_for_user(account["user_id"])
            if not studio:
                await create_studio_for_owner(
                    {"user_id": account["user_id"]},
                    studio_name="Demo Gym Studio",
                    address="123 Demo Street, Demo City",
                    contact_name=account["name"],
                    contact_phone="",
                )

        token = create_demo_token(account["user_id"])
        return {"token": token, "user": account}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("demo_login failed: %s", e)
        raise HTTPException(status_code=500, detail="Demo login failed")


@api_router.post("/auth/role")
async def auth_update_role(payload: AuthRoleUpdateRequest, user: dict = Depends(get_current_user)):
    role = normalize_role(payload.role)
    if not role:
        raise HTTPException(status_code=400, detail="Invalid role")
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"role": role}})
    updated = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return updated

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
    await ensure_seed_on_demand()
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
    await ensure_seed_on_demand()
    query = {"start_time": {"$gte": datetime.now(timezone.utc).isoformat()}}
    if category and category.lower() != "all":
        query["category"] = {"$regex": f"^{re.escape(category)}$", "$options": "i"}
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


@api_router.patch("/me", response_model=User)
async def update_me(payload: UserProfileUpdateRequest, user: dict = Depends(get_current_user)):
    update: Dict[str, Any] = {}
    if payload.name is not None:
        name = payload.name.strip()
        if not name:
            raise HTTPException(status_code=400, detail="Name cannot be empty")
        update["name"] = name
    if not update:
        return user

    await db.users.update_one({"user_id": user["user_id"]}, {"$set": update})
    updated = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return updated

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
async def partner_studios(_: dict = Depends(get_current_studio_user)):
    docs = await db.studios.find({}, {"_id": 0}).to_list(100)
    return docs


@api_router.post("/partner/bootstrap")
async def partner_bootstrap(payload: StudioBootstrapRequest, user: dict = Depends(get_current_studio_user)):
    studio = await create_studio_for_owner(
        user,
        studio_name=payload.studio_name,
        address=payload.address,
        contact_name=payload.contact_name,
        contact_phone=payload.contact_phone,
        company_id=payload.company_id,
    )
    return {"ok": True, "studio": studio}


@api_router.get("/partner/studio")
async def partner_primary_studio(user: dict = Depends(get_current_studio_user)):
    studio = await get_primary_studio_for_user(user["user_id"])
    if not studio:
        raise HTTPException(status_code=404, detail="Studio not found")
    return studio

@api_router.get("/partner/overview")
async def partner_overview(_: dict = Depends(get_current_studio_user)):
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
async def partner_list_classes(studio_id: Optional[str] = None, upcoming: bool = True, _: dict = Depends(get_current_studio_user)):
    query = {}
    if studio_id:
        query["studio_id"] = studio_id
    if upcoming:
        query["start_time"] = {"$gte": datetime.now(timezone.utc).isoformat()}
    docs = await db.classes.find(query, {"_id": 0}).sort("start_time", 1).to_list(500)
    return docs


@api_router.get("/partner/onboarding/status")
async def partner_onboarding_status(user: dict = Depends(get_current_studio_user)):
    studio = await get_primary_studio_for_user(user["user_id"])
    if not studio:
        raise HTTPException(status_code=404, detail="Studio not found")

    return {
        "studio_id": studio["id"],
        "onboarding_step": studio.get("onboarding_step", "profile"),
        "onboarding_completed": studio.get("onboarding_completed", False),
        "payments_active": studio.get("payments_active", False),
    }


@api_router.post("/partner/onboarding/profile")
async def partner_onboarding_profile(payload: StudioProfileOnboardingRequest, user: dict = Depends(get_current_studio_user)):
    studio = await get_primary_studio_for_user(user["user_id"])
    if not studio:
        raise HTTPException(status_code=404, detail="Studio not found")

    if len(payload.description) > 300:
        raise HTTPException(status_code=400, detail="Description must be 300 characters or less")
    if payload.photos and not (3 <= len(payload.photos) <= 5):
        raise HTTPException(status_code=400, detail="Please upload 3 to 5 interior photos")

    update_payload: Dict[str, Any] = {
        "description": payload.description,
        "categories": payload.studio_types,
        "opening_hours": payload.opening_hours,
        "onboarding_step": "completed",
        "onboarding_completed": True,
    }
    if payload.logo_url:
        update_payload["logo_url"] = payload.logo_url
    if payload.photos:
        update_payload["gallery"] = payload.photos
        update_payload["cover_image"] = payload.photos[0]

    await db.studios.update_one({"id": studio["id"]}, {"$set": update_payload})
    updated = await db.studios.find_one({"id": studio["id"]}, {"_id": 0})
    return {"ok": True, "studio": updated}


@api_router.post("/partner/onboarding/payment")
async def partner_onboarding_payment(payload: StudioPaymentSetupRequest, user: dict = Depends(get_current_studio_user)):
    studio = await get_primary_studio_for_user(user["user_id"])
    if not studio:
        raise HTTPException(status_code=404, detail="Studio not found")

    await db.studios.update_one(
        {"id": studio["id"]},
        {
            "$set": {
                "stripe_account_id": payload.stripe_account_id or studio.get("stripe_account_id", ""),
                "payments_active": bool(payload.stripe_account_id),
                "onboarding_step": "team",
            }
        },
    )

    return {
        "ok": True,
        "payments_active": bool(payload.stripe_account_id),
        "message": "Stripe can be fully connected later; placeholder saved.",
    }


@api_router.post("/partner/onboarding/team/invite")
async def partner_onboarding_team_invite(payload: TeamInviteRequest, user: dict = Depends(get_current_studio_user)):
    studio = await get_primary_studio_for_user(user["user_id"])
    if not studio:
        raise HTTPException(status_code=404, detail="Studio not found")

    emails = [e.strip().lower() for e in payload.emails if e.strip()]
    if not emails:
        raise HTTPException(status_code=400, detail="At least one email is required")

    now = datetime.now(timezone.utc)
    for email in emails:
        await db.studio_team_invites.insert_one({
            "id": str(uuid.uuid4()),
            "studio_id": studio["id"],
            "email": email,
            "role": "manager",
            "status": "pending",
            "invited_by_user_id": user["user_id"],
            "token": uuid.uuid4().hex,
            "expires_at": (now + timedelta(days=7)).isoformat(),
            "created_at": now.isoformat(),
        })

    await db.studios.update_one(
        {"id": studio["id"]},
        {"$set": {"onboarding_step": "completed", "onboarding_completed": True}},
    )
    return {"ok": True, "invited": len(emails)}

@api_router.get("/partner/classes/{class_id}/roster", response_model=List[Booking])
async def partner_class_roster(class_id: str, _: dict = Depends(get_current_studio_user)):
    docs = await db.bookings.find(
        {"class_id": class_id, "status": {"$in": ["confirmed", "waitlist"]}}, {"_id": 0}
    ).sort("created_at", 1).to_list(200)
    return docs

@api_router.post("/partner/classes", response_model=FitClass)
async def partner_create_class(payload: ClassCreate, _: dict = Depends(get_current_studio_user)):
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
    class_doc = fc.model_dump()
    class_doc.update({
        "level": payload.level,
        "trainer_user_id": payload.trainer_user_id,
        "price_czk": payload.price_czk,
        "payout_czk": int(payload.price_czk * 0.85) if payload.price_czk else None,
        "cancellation_hours": payload.cancellation_hours,
        "repeat_weekly": payload.repeat_weekly,
        "repeat_days": payload.repeat_days,
        "status": "active",
    })
    await db.classes.insert_one(class_doc)
    return fc

@api_router.patch("/partner/classes/{class_id}", response_model=FitClass)
async def partner_update_class(class_id: str, payload: ClassUpdate, _: dict = Depends(get_current_studio_user)):
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


@api_router.post("/partner/classes/{class_id}/duplicate", response_model=FitClass)
async def partner_duplicate_class(class_id: str, payload: DuplicateClassRequest, _: dict = Depends(get_current_studio_user)):
    existing = await db.classes.find_one({"id": class_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Class not found")

    duplicated = dict(existing)
    duplicated["id"] = str(uuid.uuid4())
    duplicated["start_time"] = payload.start_time
    duplicated["spots_left"] = duplicated.get("capacity", 12)
    duplicated["waitlist_count"] = 0
    duplicated["status"] = "active"

    await db.classes.insert_one(duplicated)
    return FitClass(**duplicated)

@api_router.delete("/partner/classes/{class_id}")
async def partner_delete_class(class_id: str, _: dict = Depends(get_current_studio_user)):
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


@api_router.get("/admin/overview")
async def admin_overview(_: dict = Depends(get_current_admin_user)):
    total_users = await db.users.count_documents({})
    total_studios = await db.studios.count_documents({})
    total_classes = await db.classes.count_documents({})
    total_bookings = await db.bookings.count_documents({})
    confirmed_bookings = await db.bookings.count_documents({"status": "confirmed"})
    cancelled_bookings = await db.bookings.count_documents({"status": "cancelled"})
    recent_users = await db.users.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    recent_bookings = await db.bookings.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    return {
        "counts": {
            "users": total_users,
            "studios": total_studios,
            "classes": total_classes,
            "bookings": total_bookings,
            "confirmed": confirmed_bookings,
            "cancelled": cancelled_bookings,
        },
        "recent_users": recent_users,
        "recent_bookings": recent_bookings,
    }


@api_router.get("/admin/users")
async def admin_users(_: dict = Depends(get_current_admin_user)):
    docs = await db.users.find({}, {"_id": 0}).sort("created_at", -1).limit(200).to_list(200)
    return docs


@api_router.get("/admin/studios")
async def admin_studios(_: dict = Depends(get_current_admin_user)):
    docs = await db.studios.find({}, {"_id": 0}).sort("created_at", -1).limit(200).to_list(200)
    return docs


@api_router.get("/admin/bookings")
async def admin_bookings(_: dict = Depends(get_current_admin_user)):
    docs = await db.bookings.find({}, {"_id": 0}).sort("created_at", -1).limit(500).to_list(500)
    return docs


@api_router.get("/admin/transactions")
async def admin_transactions(_: dict = Depends(get_current_admin_user)):
    docs = await db.bookings.find(
        {"status": {"$in": ["confirmed", "cancelled"]}}, {"_id": 0}
    ).sort("created_at", -1).limit(500).to_list(500)
    transactions = []
    for b in docs:
        transactions.append({
            "id": b["id"],
            "type": "booking",
            "status": b["status"],
            "user_id": b["user_id"],
            "studio_id": b.get("studio_id"),
            "class_id": b["class_id"],
            "class_title": b.get("class_title"),
            "studio_name": b.get("studio_name"),
            "credits": b.get("credits", 0),
            "created_at": b.get("created_at"),
        })
    return transactions


app.include_router(api_router)


@app.get("/health")
async def health_check():
    return {"ok": True}


logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# Custom CORS middleware ensures headers are always present, even on errors.
@app.middleware("http")
async def custom_cors_middleware(request: Request, call_next):
    origin = request.headers.get("origin")
    try:
        response = await call_next(request)
    except Exception as e:
        logger.exception("Unhandled request error: %s", e)
        response = Response(
            content='{"detail":"Internal server error"}',
            status_code=500,
            media_type="application/json",
        )
    if origin and is_allowed_origin(origin):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, PATCH, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
    return response


app.add_middleware(
    CORSMiddleware,
    allow_credentials="*" not in CORS_ORIGINS,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    try:
        if MOCK_DATA_ENABLED:
            await ensure_seed()
        # One-time migration from pre-auth (Phase 1/2) — only if legacy demo-user data exists.
        legacy_bookings = await db.bookings.delete_many({"user_id": "demo-user"})
        await db.users.delete_many({"id": "demo-user"})
        if legacy_bookings.deleted_count > 0:
            await db.classes.update_many({}, [{"$set": {"spots_left": "$capacity", "waitlist_count": 0}}])
        # Optional preview mode for unauthenticated demos
        if AUTH_PREVIEW_MODE:
            await ensure_preview_user()
    except Exception as e:
        logger.exception("Seed failed: %s", e)

@app.on_event("shutdown")
async def shutdown_db_client():
    if client is not None:
        client.close()
