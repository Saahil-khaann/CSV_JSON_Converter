from typing import List
from backend.domain.interfaces import ITelemetryRepository
from backend.domain.entities import TelemetryLog
from backend.application.dtos import TelemetryLogDTO, TelemetryStatsDTO

class RecordTelemetryUseCase:
    def __init__(self, telemetry_repo: ITelemetryRepository):
        self.telemetry_repo = telemetry_repo

    def execute(self, log: TelemetryLog) -> TelemetryLogDTO:
        saved = self.telemetry_repo.save_log(log)
        return TelemetryLogDTO.model_validate(saved)

class GetTelemetryStatsUseCase:
    def __init__(self, telemetry_repo: ITelemetryRepository):
        self.telemetry_repo = telemetry_repo

    def execute(self) -> TelemetryStatsDTO:
        stats = self.telemetry_repo.get_stats()
        return TelemetryStatsDTO(**stats)

    def execute_get_logs(self, limit: int = 50) -> List[TelemetryLogDTO]:
        logs = self.telemetry_repo.get_recent_logs(limit=limit)
        return [TelemetryLogDTO.model_validate(l) for l in logs]
