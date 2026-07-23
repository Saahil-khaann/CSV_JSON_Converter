from abc import ABC, abstractmethod
from typing import List, Optional, Tuple, Dict, Any
import pandas as pd
from backend.domain.entities import User, ConversionRecord, TelemetryLog

class IFileConverter(ABC):
    @abstractmethod
    def convert(self, file_content: bytes, filename: str, remove_duplicates: bool = False) -> Tuple[pd.DataFrame, bytes, Dict[str, Any]]:
        """
        Parses raw input file bytes and returns:
        - DataFrame representation
        - Serialized pickle bytes
        - Metadata dict (row_count, col_count, columns, preview_rows)
        """
        pass

    @abstractmethod
    def supports(self, filename: str, content_type: Optional[str] = None) -> bool:
        """Returns True if this strategy handles the given file format"""
        pass

class IUserRepository(ABC):
    @abstractmethod
    def get_by_id(self, user_id: int) -> Optional[User]:
        pass

    @abstractmethod
    def get_by_username(self, username: str) -> Optional[User]:
        pass

    @abstractmethod
    def create_user(self, username: str) -> User:
        pass

    @abstractmethod
    def search_users(self, query: str) -> List[User]:
        pass

    @abstractmethod
    def list_all_users(self) -> List[User]:
        pass

class IConversionRepository(ABC):
    @abstractmethod
    def save_record(self, record: ConversionRecord) -> ConversionRecord:
        pass

    @abstractmethod
    def get_by_file_id(self, file_id: str) -> Optional[ConversionRecord]:
        pass

    @abstractmethod
    def search_records(self, query: Optional[str] = None, user_id: Optional[int] = None) -> List[ConversionRecord]:
        pass

class ITelemetryRepository(ABC):
    @abstractmethod
    def save_log(self, log: TelemetryLog) -> TelemetryLog:
        pass

    @abstractmethod
    def get_stats(self) -> Dict[str, Any]:
        pass

    @abstractmethod
    def get_recent_logs(self, limit: int = 50) -> List[TelemetryLog]:
        pass
