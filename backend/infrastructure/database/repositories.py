import json
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from backend.domain.entities import User, ConversionRecord, TelemetryLog
from backend.domain.interfaces import IUserRepository, IConversionRepository, ITelemetryRepository
from backend.domain.exceptions import UserAlreadyExistsException
from backend.infrastructure.database.models import UserModel, ConversionRecordModel, TelemetryLogModel

class SqlUserRepository(IUserRepository):
    def __init__(self, db: Session):
        self.db = db

    def _to_entity(self, model: UserModel) -> User:
        return User(id=model.id, username=model.username, created_at=model.created_at)

    def get_by_id(self, user_id: int) -> Optional[User]:
        model = self.db.query(UserModel).filter(UserModel.id == user_id).first()
        return self._to_entity(model) if model else None

    def get_by_username(self, username: str) -> Optional[User]:
        model = self.db.query(UserModel).filter(UserModel.username.ilike(username.strip())).first()
        return self._to_entity(model) if model else None

    def create_user(self, username: str) -> User:
        clean_username = username.strip()
        existing = self.get_by_username(clean_username)
        if existing:
            raise UserAlreadyExistsException(clean_username)
        
        model = UserModel(username=clean_username)
        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)
        return self._to_entity(model)

    def search_users(self, query: str) -> List[User]:
        models = self.db.query(UserModel).filter(UserModel.username.ilike(f"%{query.strip()}%")).all()
        return [self._to_entity(m) for m in models]

    def list_all_users(self) -> List[User]:
        models = self.db.query(UserModel).order_by(UserModel.created_at.desc()).all()
        return [self._to_entity(m) for m in models]


import os
import pickle
import pandas as pd

class SqlConversionRepository(IConversionRepository):
    def __init__(self, db: Session):
        self.db = db

    def _to_entity(self, model: ConversionRecordModel) -> ConversionRecord:
        columns = json.loads(model.columns_json) if model.columns_json else []
        return ConversionRecord(
            id=model.id,
            file_id=model.file_id,
            user_id=model.user_id,
            username=model.username,
            original_filename=model.original_filename,
            file_type=model.file_type,
            original_size_bytes=model.original_size_bytes,
            pickle_size_bytes=model.pickle_size_bytes,
            row_count=model.row_count,
            column_count=model.column_count,
            columns=columns,
            created_at=model.created_at,
            pickle_path=model.pickle_path,
            target_format=getattr(model, "target_format", None) or "pkl"
        )

    def save_record(self, record: ConversionRecord) -> ConversionRecord:
        model = ConversionRecordModel(
            file_id=record.file_id,
            user_id=record.user_id,
            username=record.username,
            original_filename=record.original_filename,
            file_type=record.file_type,
            original_size_bytes=record.original_size_bytes,
            pickle_size_bytes=record.pickle_size_bytes,
            row_count=record.row_count,
            column_count=record.column_count,
            columns_json=json.dumps(record.columns),
            pickle_path=record.pickle_path,
            target_format=getattr(record, "target_format", "pkl"),
            created_at=record.created_at
        )
        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)
        record.id = model.id
        return record

    def get_by_file_id(self, file_id: str) -> Optional[ConversionRecord]:
        model = self.db.query(ConversionRecordModel).filter(ConversionRecordModel.file_id == file_id).first()
        return self._to_entity(model) if model else None

    def search_records(self, query: Optional[str] = None, user_id: Optional[int] = None) -> List[ConversionRecord]:
        q = self.db.query(ConversionRecordModel)
        if user_id is not None:
            q = q.filter(ConversionRecordModel.user_id == user_id)
        
        models = q.order_by(ConversionRecordModel.created_at.desc()).all()

        if not query or not query.strip():
            return [self._to_entity(m) for m in models]

        term = query.strip().lower()
        matched_records = []

        for model in models:
            # 1. Check metadata match
            metadata_match = (
                term in model.original_filename.lower() or
                term in model.username.lower() or
                term in model.file_type.lower() or
                term in (getattr(model, "target_format", "") or "pkl").lower() or
                term in (model.columns_json or "").lower()
            )

            if metadata_match:
                matched_records.append(self._to_entity(model))
                continue

            # 2. Check data content match inside pickle / output file on disk
            if model.pickle_path and os.path.exists(model.pickle_path):
                try:
                    df = None
                    file_ext = model.pickle_path.rsplit('.', 1)[-1].lower()
                    
                    if file_ext == 'pkl':
                        with open(model.pickle_path, 'rb') as f:
                            df = pickle.load(f)
                    elif file_ext == 'json':
                        df = pd.read_json(model.pickle_path)
                    elif file_ext == 'csv':
                        df = pd.read_csv(model.pickle_path)

                    if df is not None and isinstance(df, pd.DataFrame):
                        # Convert all DataFrame cell values to string and check if term exists
                        has_cell_match = df.astype(str).apply(
                            lambda row: row.str.contains(term, case=False, na=False, regex=False)
                        ).any().any()

                        if has_cell_match:
                            matched_records.append(self._to_entity(model))
                except Exception as e:
                    # Ignore unpickling or reading errors and fallback to metadata match result
                    pass

        return matched_records


class SqlTelemetryRepository(ITelemetryRepository):
    def __init__(self, db: Session):
        self.db = db

    def _to_entity(self, model: TelemetryLogModel) -> TelemetryLog:
        return TelemetryLog(
            id=model.id,
            endpoint=model.endpoint,
            method=model.method,
            status_code=model.status_code,
            response_time_ms=model.response_time_ms,
            client_ip=model.client_ip,
            user_id=model.user_id,
            timestamp=model.timestamp
        )

    def save_log(self, log: TelemetryLog) -> TelemetryLog:
        model = TelemetryLogModel(
            endpoint=log.endpoint,
            method=log.method,
            status_code=log.status_code,
            response_time_ms=log.response_time_ms,
            client_ip=log.client_ip,
            user_id=log.user_id,
            timestamp=log.timestamp
        )
        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)
        log.id = model.id
        return log

    def get_stats(self) -> Dict[str, Any]:
        total_requests = self.db.query(TelemetryLogModel).count()
        if total_requests == 0:
            return {
                "total_requests": 0,
                "avg_response_time_ms": 0.0,
                "min_response_time_ms": 0.0,
                "max_response_time_ms": 0.0,
                "success_count": 0,
                "error_count": 0
            }
        
        avg_time = self.db.query(func.avg(TelemetryLogModel.response_time_ms)).scalar() or 0.0
        min_time = self.db.query(func.min(TelemetryLogModel.response_time_ms)).scalar() or 0.0
        max_time = self.db.query(func.max(TelemetryLogModel.response_time_ms)).scalar() or 0.0
        success_count = self.db.query(TelemetryLogModel).filter(TelemetryLogModel.status_code < 400).count()
        error_count = self.db.query(TelemetryLogModel).filter(TelemetryLogModel.status_code >= 400).count()

        return {
            "total_requests": total_requests,
            "avg_response_time_ms": round(float(avg_time), 2),
            "min_response_time_ms": round(float(min_time), 2),
            "max_response_time_ms": round(float(max_time), 2),
            "success_count": success_count,
            "error_count": error_count
        }

    def get_recent_logs(self, limit: int = 50) -> List[TelemetryLog]:
        models = self.db.query(TelemetryLogModel).order_by(TelemetryLogModel.timestamp.desc()).limit(limit).all()
        return [self._to_entity(m) for m in models]
