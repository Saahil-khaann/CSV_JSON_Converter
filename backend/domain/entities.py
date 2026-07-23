from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List, Dict, Any

@dataclass
class User:
    id: Optional[int]
    username: str
    created_at: datetime = field(default_factory=datetime.utcnow)

@dataclass
class ConversionRecord:
    id: Optional[int]
    file_id: str
    user_id: int
    username: str
    original_filename: str
    file_type: str  # 'csv' or 'json'
    original_size_bytes: int
    pickle_size_bytes: int
    row_count: int
    column_count: int
    columns: List[str]
    created_at: datetime = field(default_factory=datetime.utcnow)
    pickle_path: str = ""
    target_format: str = "pkl"

@dataclass
class TelemetryLog:
    id: Optional[int]
    endpoint: str
    method: str
    status_code: int
    response_time_ms: float
    client_ip: Optional[str]
    user_id: Optional[int]
    timestamp: datetime = field(default_factory=datetime.utcnow)
