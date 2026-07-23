from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

from sqlalchemy import text

def init_db():
    Base.metadata.create_all(bind=engine)
    # Ensure database migrations / missing columns are added automatically
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE conversion_history ADD COLUMN target_format VARCHAR(20) DEFAULT 'pkl';"))
            conn.commit()
        except Exception:
            # Column already exists
            pass
