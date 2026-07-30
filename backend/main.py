from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from backend.infrastructure.database.connection import init_db
from backend.presentation.middleware.telemetry import TelemetryMiddleware
from backend.presentation.routers import user, convert, telemetry

# Initialize DB tables
init_db()

app = FastAPI(
    title=settings.APP_NAME,
    description="Clean Architecture API to convert CSV and JSON files to Pickle with user tracking & telemetry.",
    version="1.0.0",
    debug=settings.DEBUG
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Response-Time-Ms"]
)

# ASGI Telemetry Middleware
app.add_middleware(TelemetryMiddleware)

# Include Routers
app.include_router(user.router)
app.include_router(convert.router)
app.include_router(telemetry.router)

import os
from fastapi.staticfiles import StaticFiles

@app.get("/api/health")
def api_health():
    return {
        "status": "online",
        "app": settings.APP_NAME,
        "health": "OK"
    }

# Mount static files for frontend React app if dist folder exists
if os.path.exists("frontend/dist"):
    app.mount("/", StaticFiles(directory="frontend/dist", html=True), name="static_frontend")
else:
    @app.get("/")
    def root():
        return {
            "status": "online",
            "app": settings.APP_NAME,
            "docs": "/docs",
            "health": "OK"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
