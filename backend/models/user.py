from database import Base
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(15), unique=True, nullable=False)
    email = Column(String(150), unique=True, nullable=True)
    password_hash = Column(String(255), nullable=False)

    # Profile
    state = Column(String(50), nullable=True)
    district = Column(String(100), nullable=True)
    land_size = Column(Float, nullable=True)       # acres
    income = Column(Float, nullable=True)           # annual INR
    crop_types = Column(Text, nullable=True)        # comma-separated
    farmer_category = Column(String(50), default="general")  # small/marginal/general

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    documents = relationship("Document", back_populates="owner", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="user", cascade="all, delete-orphan")
    payouts = relationship("PayoutVerification", back_populates="user")
