import io
import json
import pickle
import pandas as pd
from typing import Tuple, Dict, Any, Optional
from backend.domain.interfaces import IFileConverter
from backend.domain.exceptions import ConversionFailedException

class JsonToPickleConverter(IFileConverter):
    def supports(self, filename: str, content_type: Optional[str] = None) -> bool:
        ext = filename.lower().split('.')[-1]
        return bool(ext == 'json' or (content_type and 'json' in content_type.lower()))

    def convert(self, file_content: bytes, filename: str, remove_duplicates: bool = True) -> Tuple[pd.DataFrame, bytes, Dict[str, Any]]:
        try:
            decoded_text = file_content.decode('utf-8').strip()
            raw_json = json.loads(decoded_text)
            
            # Intelligent JSON Unwrapping & Normalization
            if isinstance(raw_json, dict):
                # Check if the dictionary wraps a list (e.g. {"airports": [...]} or {"data": [...]})
                list_keys = [k for k, v in raw_json.items() if isinstance(v, list) and len(v) > 0 and isinstance(v[0], dict)]
                if len(list_keys) == 1:
                    df = pd.json_normalize(raw_json[list_keys[0]])
                else:
                    df = pd.json_normalize(raw_json)
            elif isinstance(raw_json, list):
                df = pd.json_normalize(raw_json)
            else:
                df = pd.DataFrame([raw_json])

            # If df has a single column containing dictionaries or lists, flatten it further
            if len(df.columns) == 1 and isinstance(df.iloc[0, 0], (dict, list)):
                val = df.iloc[:, 0].tolist()
                if isinstance(val, list) and len(val) > 0 and isinstance(val[0], dict):
                    df = pd.json_normalize(val)

            initial_len = len(df)

            # Clean string columns by trimming hidden whitespace
            for col in df.select_dtypes(include=['object', 'string']).columns:
                df[col] = df[col].astype(str).str.strip()

            # Identify unique identifier columns (User ID, Email, Phone/Mobile, Code, SKU)
            unique_cols_found = []
            for col in df.columns:
                col_lower = str(col).lower().replace('_', '').replace(' ', '')
                if any(kw in col_lower for kw in ['userid', 'id', 'email', 'phone', 'mobile', 'tel', 'code', 'sku']):
                    if col_lower == 'index' and any('id' in str(c).lower() for c in df.columns if c != col):
                        continue
                    unique_cols_found.append(col)

            if not unique_cols_found and len(df.columns) > 0:
                unique_cols_found = [df.columns[0]]

            raw_duplicate_count = 0
            temp_df = df.copy()

            if remove_duplicates and unique_cols_found:
                for u_col in unique_cols_found:
                    temp_df = temp_df.drop_duplicates(subset=[u_col], keep='first').reset_index(drop=True)
                raw_duplicate_count = initial_len - len(temp_df)
                df = temp_df
            else:
                if unique_cols_found:
                    raw_duplicate_count = initial_len - len(df.drop_duplicates(subset=unique_cols_found))
                else:
                    raw_duplicate_count = int(df.duplicated().sum())

            # Serialize to pickle bytes buffer
            pickle_buffer = io.BytesIO()
            pickle.dump(df, pickle_buffer)
            pickle_bytes = pickle_buffer.getvalue()

            # Preview metadata (up to first 100 rows for in-app preview)
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
            raise ConversionFailedException(f"Failed to process JSON file '{filename}': {str(e)}")
