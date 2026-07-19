from database import Base
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime


class Scheme(Base):
    __tablename__ = "schemes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    short_name = Column(String(50), nullable=True)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False)  # crop insurance, irrigation, etc.
    ministry = Column(String(150), nullable=True)

    # Benefits
    benefits = Column(Text, nullable=False)
    subsidy_amount = Column(String(100), nullable=True)  # "80%" or "₹6000/year"
    max_benefit = Column(Float, nullable=True)            # max INR

    # Eligibility
    eligibility = Column(Text, nullable=False)
    min_land = Column(Float, nullable=True)   # min acres
    max_land = Column(Float, nullable=True)   # max acres
    max_income = Column(Float, nullable=True) # max annual income
    farmer_category = Column(String(50), nullable=True)  # small/marginal/all

    # Documents
    documents_needed = Column(Text, nullable=False)  # comma-separated

    # Deadline & Status
    deadline = Column(DateTime, nullable=True)
    application_start = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)

    # Geography
    applicable_states = Column(Text, default="All")   # "All" or comma-separated state names
    applicable_districts = Column(Text, default="All")

    # Application info
    apply_url = Column(String(500), nullable=True)
    helpline = Column(String(50), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    alerts = relationship("Alert", back_populates="scheme")
    payouts = relationship("PayoutVerification", back_populates="scheme")
