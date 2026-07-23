from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional, Dict, Any

class UserCreateDTO(BaseModel):
    username: str = Field(..., min_length=2, max_length=100, description="Unique username")

class UserResponseDTO(BaseModel):
    id: int
    username: str
    created_at: datetime

    class Config:
        from_attributes = True

class ConversionResponseDTO(BaseModel):
    file_id: str
    original_filename: str
    file_type: str
    original_size_bytes: int
    pickle_size_bytes: int
    row_count: int
    column_count: int
    columns: List[str]
    preview_rows: List[Dict[str, Any]]
    created_at: datetime
    user_id: int
    username: str
    duplicate_count: int = 0
    remove_duplicates_applied: bool = False
    initial_row_count: int = 0
    dedup_key_column: Optional[str] = None
    target_format: str = "pkl"
    raw_output_snippet: Optional[str] = None

class ConversionRecordDTO(BaseModel):
    id: int
    file_id: str
    user_id: int
    username: str
    original_filename: str
    file_type: str
    original_size_bytes: int
    pickle_size_bytes: int
    row_count: int
    column_count: int
    columns: List[str]
    created_at: datetime
    target_format: str = "pkl"

    class Config:
        from_attributes = True

class TelemetryLogDTO(BaseModel):
    id: Optional[int]
    endpoint: str
    method: str
    status_code: int
    response_time_ms: float
    client_ip: Optional[str]
    user_id: Optional[int]
    timestamp: datetime

    class Config:
        from_attributes = True

class TelemetryStatsDTO(BaseModel):
    total_requests: int
    avg_response_time_ms: float
    min_response_time_ms: float
    max_response_time_ms: float
    success_count: int
    error_count: int
