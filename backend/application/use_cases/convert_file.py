import os
import uuid
from datetime import datetime
from backend.domain.interfaces import IConversionRepository, IUserRepository
from backend.domain.entities import ConversionRecord
from backend.domain.exceptions import UserNotFoundException
from backend.infrastructure.converters.factory import converter_factory
from backend.application.dtos import ConversionResponseDTO
from backend.config import settings

class ConvertFileUseCase:
    def __init__(self, conversion_repo: IConversionRepository, user_repo: IUserRepository):
        self.conversion_repo = conversion_repo
        self.user_repo = user_repo

    def execute(self, file_content: bytes, filename: str, user_id: int, content_type: str = None, remove_duplicates: bool = False, target_format: str = "pkl") -> ConversionResponseDTO:
        # Validate user exists
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise UserNotFoundException(str(user_id))

        # Clean target format
        fmt = (target_format or "pkl").lower().strip()
        if fmt not in ["pkl", "json", "csv"]:
            fmt = "pkl"

        # Get matching converter strategy (Strategy Pattern)
        converter = converter_factory.get_converter(filename, content_type)
        
        # Perform conversion to pandas DataFrame & metadata
        df, pickle_bytes, meta = converter.convert(file_content, filename, remove_duplicates=remove_duplicates)

        # Produce output bytes & preview snippet according to target_format
        if fmt == "json":
            output_bytes = df.to_json(orient="records", indent=2).encode("utf-8")
            ext = "json"
            raw_output_snippet = df.head(100).to_json(orient="records", indent=2)
        elif fmt == "csv":
            output_bytes = df.to_csv(index=False).encode("utf-8")
            ext = "csv"
            raw_output_snippet = df.head(100).to_csv(index=False)
        else:
            output_bytes = pickle_bytes
            ext = "pkl"
            raw_output_snippet = f"// Python Pickle (.pkl) Binary Object\n// Output Size: {len(pickle_bytes)} bytes\n// Format: Pandas DataFrame Stream ({len(df)} rows x {len(df.columns)} columns)\n// Python Usage: pandas.read_pickle('{filename.split('.')[0]}.pkl')"

        # Generate unique file ID & file path
        file_id = f"{ext}_{uuid.uuid4().hex[:16]}"
        output_filename = f"{file_id}.{ext}"
        output_path = os.path.join(settings.STORAGE_DIR, output_filename)

        # Save output file to local storage
        with open(output_path, "wb") as f:
            f.write(output_bytes)

        # Detect input file format extension
        file_type = "csv" if filename.lower().endswith(".csv") else "json"

        # Create Domain Entity & save to repository
        record = ConversionRecord(
            id=None,
            file_id=file_id,
            user_id=user.id,
            username=user.username,
            original_filename=filename,
            file_type=file_type,
            original_size_bytes=len(file_content),
            pickle_size_bytes=len(output_bytes),
            row_count=meta["row_count"],
            column_count=meta["column_count"],
            columns=meta["columns"],
            pickle_path=output_path,
            target_format=fmt,
            created_at=datetime.utcnow()
        )

        saved_record = self.conversion_repo.save_record(record)

        return ConversionResponseDTO(
            file_id=saved_record.file_id,
            original_filename=saved_record.original_filename,
            file_type=saved_record.file_type,
            original_size_bytes=saved_record.original_size_bytes,
            pickle_size_bytes=saved_record.pickle_size_bytes,
            row_count=saved_record.row_count,
            column_count=saved_record.column_count,
            columns=saved_record.columns,
            preview_rows=meta["preview_rows"],
            created_at=saved_record.created_at,
            user_id=saved_record.user_id,
            username=saved_record.username,
            duplicate_count=meta.get("duplicate_count", 0),
            remove_duplicates_applied=meta.get("remove_duplicates_applied", False),
            initial_row_count=meta.get("initial_row_count", saved_record.row_count),
            dedup_key_column=meta.get("dedup_key_column", None),
            target_format=saved_record.target_format,
            raw_output_snippet=raw_output_snippet
        )
