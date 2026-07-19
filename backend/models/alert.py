from database import Base
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # None = broadcast
    scheme_id = Column(Integer, ForeignKey("schemes.id"), nullable=False)

    alert_type = Column(String(50), default="deadline")  # deadline, new_scheme, update
    message = Column(Text, nullable=False)
    days_remaining = Column(Integer, nullable=True)

    is_read = Column(Boolean, default=False)
    is_sent = Column(Boolean, default=False)
    sent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="alerts")
    scheme = relationship("Scheme", back_populates="alerts")


class PayoutVerification(Base):
    __tablename__ = "payout_verifications"

    id = Column(Integer, primary_key=True, index=True)
    scheme_id = Column(Integer, ForeignKey("schemes.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    amount_received = Column(String(50), nullable=False)
    district = Column(String(100), nullable=False)
    state = Column(String(50), nullable=False)
    comment = Column(Text, nullable=True)

    is_verified = Column(Boolean, default=False)
    verifier_name = Column(String(100), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    scheme = relationship("Scheme", back_populates="payouts")
    user = relationship("User", back_populates="payouts")
