import io
import pickle
import pandas as pd
from typing import Tuple, Dict, Any, Optional
from backend.domain.interfaces import IFileConverter
from backend.domain.exceptions import ConversionFailedException

class CsvToPickleConverter(IFileConverter):
    def supports(self, filename: str, content_type: Optional[str] = None) -> bool:
        ext = filename.lower().split('.')[-1]
        return bool(ext == 'csv' or (content_type and 'csv' in content_type.lower()))

    def convert(self, file_content: bytes, filename: str, remove_duplicates: bool = True) -> Tuple[pd.DataFrame, bytes, Dict[str, Any]]:
        try:
            # Parse CSV into Pandas DataFrame
            df = pd.read_csv(io.BytesIO(file_content))
            initial_len = len(df)

            # Clean string columns by trimming hidden whitespace
            for col in df.select_dtypes(include=['object', 'string']).columns:
                df[col] = df[col].astype(str).str.strip()

            # Identify unique identifier columns (User ID, Email, Phone/Mobile)
            unique_cols_found = []
            for col in df.columns:
                col_lower = str(col).lower().replace('_', '').replace(' ', '')
                if any(kw in col_lower for kw in ['userid', 'id', 'email', 'phone', 'mobile', 'tel', 'contact']):
                    # Skip row index column if specific User ID column exists
                    if col_lower == 'index' and any('id' in str(c).lower() for c in df.columns if c != col):
                        continue
                    unique_cols_found.append(col)

            # Fallback to first column if no keyword columns matched
            if not unique_cols_found and len(df.columns) > 0:
                unique_cols_found = [df.columns[0]]

            # Count duplicate entries across unique fields
            raw_duplicate_count = 0
            temp_df = df.copy()

            if remove_duplicates and unique_cols_found:
                for u_col in unique_cols_found:
                    temp_df = temp_df.drop_duplicates(subset=[u_col], keep='first').reset_index(drop=True)
                raw_duplicate_count = initial_len - len(temp_df)
                df = temp_df
            else:
                # Calculate duplicates based on full row or unique key columns
                if unique_cols_found:
                    raw_duplicate_count = initial_len - len(df.drop_duplicates(subset=unique_cols_found))
                else:
                    raw_duplicate_count = int(df.duplicated().sum())

            # Serialize to pickle bytes buffer
            pickle_buffer = io.BytesIO()
            pickle.dump(df, pickle_buffer)
            pickle_bytes = pickle_buffer.getvalue()

            # Generate preview rows (up to first 100 rows for rich in-app previewing)
            preview_df = df.head(100).fillna("")
            preview_rows = preview_df.to_dict(orient="records")
            columns = [str(c) for c in df.columns]

            meta = {
                "row_count": len(df),
                "initial_row_count": initial_len,
                "column_count": len(columns),
                "columns": columns,
                "preview_rows": preview_rows,
                "duplicate_count": raw_duplicate_count,
                "remove_duplicates_applied": remove_duplicates,
                "dedup_key_column": ", ".join(unique_cols_found) if unique_cols_found else "Full Row"
            }

            return df, pickle_bytes, meta

        except Exception as e:
            raise ConversionFailedException(f"Failed to process CSV file '{filename}': {str(e)}")
