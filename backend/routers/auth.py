"""
GovBrief AI — Authentication Router
Handles user registration, login, and profile
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional

from database import get_db
from models.user import User
from config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ── Pydantic Schemas ──────────────────────────────────────────────────────────
class UserRegister(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    password: str
    state: Optional[str] = None
    district: Optional[str] = None
    land_size: Optional[float] = None
    income: Optional[float] = None
    crop_types: Optional[str] = None
    farmer_category: Optional[str] = "general"

class UserLogin(BaseModel):
    phone: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    land_size: Optional[float] = None
    income: Optional[float] = None
    crop_types: Optional[str] = None
    farmer_category: Optional[str] = None


# ── Helpers ───────────────────────────────────────────────────────────────────
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    pwd_bytes = password.encode('utf-8')
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    plain_bytes = plain.encode('utf-8')
    hashed_bytes = hashed.encode('utf-8')
    return bcrypt.checkpw(plain_bytes, hashed_bytes)

def create_token(user_id: int) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": str(user_id), "exp": expire}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def user_to_dict(user: User) -> dict:
    return {
        "id": user.id, "name": user.name, "phone": user.phone,
        "email": user.email, "state": user.state, "district": user.district,
        "land_size": user.land_size, "income": user.income,
        "crop_types": user.crop_types, "farmer_category": user.farmer_category,
    }


# ── Routes ────────────────────────────────────────────────────────────────────
@router.post("/register", response_model=TokenResponse)
def register(data: UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.phone == data.phone).first():
        raise HTTPException(status_code=400, detail="Phone number already registered")
    user = User(
        name=data.name, phone=data.phone, email=data.email,
        password_hash=hash_password(data.password),
        state=data.state, district=data.district,
        land_size=data.land_size, income=data.income,
        crop_types=data.crop_types, farmer_category=data.farmer_category,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"access_token": create_token(user.id), "user": user_to_dict(user)}


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == data.phone).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid phone or password")
    return {"access_token": create_token(user.id), "user": user_to_dict(user)}


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return user_to_dict(current_user)


@router.put("/profile")
def update_profile(data: ProfileUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    for field, value in data.dict(exclude_none=True).items():
        setattr(current_user, field, value)
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    return {"message": "Profile updated", "user": user_to_dict(current_user)}
