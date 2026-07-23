from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.infrastructure.database.connection import Base

class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    conversions = relationship("ConversionRecordModel", back_populates="user", cascade="all, delete-orphan")

class ConversionRecordModel(Base):
    __tablename__ = "conversion_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    file_id = Column(String(64), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    username = Column(String(100), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_type = Column(String(20), nullable=False)
    original_size_bytes = Column(Integer, nullable=False)
    pickle_size_bytes = Column(Integer, nullable=False)
    row_count = Column(Integer, nullable=False)
    column_count = Column(Integer, nullable=False)
    columns_json = Column(Text, nullable=False)  # JSON representation of columns list
    pickle_path = Column(String(512), nullable=False)
    target_format = Column(String(20), nullable=True, default="pkl")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("UserModel", back_populates="conversions")

class TelemetryLogModel(Base):
    __tablename__ = "api_telemetry"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    endpoint = Column(String(255), nullable=False, index=True)
    method = Column(String(10), nullable=False)
    status_code = Column(Integer, nullable=False, index=True)
    response_time_ms = Column(Float, nullable=False)
    client_ip = Column(String(50), nullable=True)
    user_id = Column(Integer, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
