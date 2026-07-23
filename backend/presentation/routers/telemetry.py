from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.infrastructure.database.connection import get_db
from backend.infrastructure.database.repositories import SqlTelemetryRepository
from backend.application.use_cases.telemetry import GetTelemetryStatsUseCase
from backend.application.dtos import TelemetryStatsDTO, TelemetryLogDTO

router = APIRouter(prefix="/api/telemetry", tags=["Telemetry"])

@router.get("/stats", response_model=TelemetryStatsDTO)
def get_telemetry_stats(db: Session = Depends(get_db)):
    telemetry_repo = SqlTelemetryRepository(db)
    use_case = GetTelemetryStatsUseCase(telemetry_repo)
    return use_case.execute()

@router.get("/logs", response_model=List[TelemetryLogDTO])
def get_recent_telemetry_logs(limit: int = 50, db: Session = Depends(get_db)):
    telemetry_repo = SqlTelemetryRepository(db)
    use_case = GetTelemetryStatsUseCase(telemetry_repo)
    return use_case.execute_get_logs(limit=limit)
