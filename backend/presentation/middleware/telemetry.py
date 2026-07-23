import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from backend.infrastructure.database.connection import SessionLocal
from backend.infrastructure.database.repositories import SqlTelemetryRepository
from backend.domain.entities import TelemetryLog

class TelemetryMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.perf_counter()
        
        # Extract client IP
        client_ip = request.client.host if request.client else None
        
        # Process request
        response = await call_next(request)
        
        # Calculate duration in ms
        duration_ms = (time.perf_counter() - start_time) * 1000.0

        # Add custom telemetry header to response for frontend tracking
        response.headers["X-Response-Time-Ms"] = f"{duration_ms:.2f}"

        # Exclude telemetry endpoint itself from telemetry logging to prevent recursion
        path = request.url.path
        if not path.startswith("/api/telemetry"):
            try:
                db = SessionLocal()
                repo = SqlTelemetryRepository(db)
                log = TelemetryLog(
                    id=None,
                    endpoint=path,
                    method=request.method,
                    status_code=response.status_code,
                    response_time_ms=round(duration_ms, 2),
                    client_ip=client_ip,
                    user_id=request.headers.get("X-User-Id", None)
                )
                repo.save_log(log)
                db.close()
            except Exception as e:
                print(f"[TelemetryMiddleware Error] {e}")

        return response
