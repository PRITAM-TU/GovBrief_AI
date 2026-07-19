from database import Base
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    doc_type = Column(String(50), nullable=False)       # aadhaar, voter_id, land_record, pan, passbook
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)  # encrypted filename on disk
    extracted_text = Column(Text, nullable=True)

    # Structured extracted fields (JSON string)
    extracted_fields = Column(Text, nullable=True)

    is_encrypted = Column(Boolean, default=True)
    file_size = Column(Integer, nullable=True)    # bytes
    mime_type = Column(String(100), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="documents")
