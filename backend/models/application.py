from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class UserApplication(Base):
    __tablename__ = "user_applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    scheme_id = Column(Integer, ForeignKey("schemes.id"), nullable=False)
    application_ref_id = Column(String(100), nullable=False)  # The official government ID
    status = Column(String(50), default="Pending") # Pending, Approved, Rejected, Disbursed
    
    created_at = Column(DateTime, default=datetime.utcnow)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", backref="applications")
    scheme = relationship("Scheme")
