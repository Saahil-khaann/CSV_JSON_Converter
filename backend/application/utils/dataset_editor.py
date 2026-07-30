import os
import pandas as pd
from typing import Tuple

def clean_cell_value(val):
    if val is None or pd.isna(val):
        return ""
    val_str = str(val).strip()
    if val_str.endswith(".0"):
        val_str = val_str[:-2]
    elif "e+" in val_str.lower() or "e-" in val_str.lower():
        try:
            f_val = float(val_str)
            if f_val.is_integer():
                val_str = str(int(f_val))
        except (ValueError, OverflowError):
            pass
    return val_str

def clean_phone_and_identifier_columns(df: pd.DataFrame) -> pd.DataFrame:
    if df is None or df.empty:
        return df

    for col in df.columns:
        col_lower = str(col).lower().replace('_', '').replace(' ', '')
        if any(kw in col_lower for kw in ['phone', 'mobile', 'tel', 'contact', 'fax', 'zip', 'code', 'userid', 'id', 'sku', 'ssn']):
            df[col] = df[col].apply(clean_cell_value)

    return df

def load_dataset_df(file_path: str, format_str: str) -> pd.DataFrame:
    """
    Loads a dataset from the specified file path into a Pandas DataFrame based on format_str.
    Ensures phone numbers and identifier columns preserve exact string formatting.
    """
    fmt = format_str.lower().strip()
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Dataset file not found at {file_path}")

    if fmt == "pkl":
        df = pd.read_pickle(file_path)
    elif fmt == "json":
        if os.path.getsize(file_path) == 0:
            return pd.DataFrame()
        df = pd.read_json(file_path, orient="records", dtype=False)
    elif fmt == "csv":
        if os.path.getsize(file_path) == 0:
            return pd.DataFrame()
        df = pd.read_csv(file_path, dtype=str, keep_default_na=False)
    else:
        raise ValueError(f"Unsupported dataset format for editing: {format_str}")

    return clean_phone_and_identifier_columns(df)

def save_dataset_df(df: pd.DataFrame, file_path: str, format_str: str) -> int:
    """
    Saves a Pandas DataFrame to the specified file path based on format_str.
    Returns the new file size in bytes.
    """
    fmt = format_str.lower().strip()
    clean_df = clean_phone_and_identifier_columns(df)
    
    if fmt == "pkl":
        clean_df.to_pickle(file_path)
    elif fmt == "json":
        clean_df.to_json(file_path, orient="records", indent=2)
    elif fmt == "csv":
        clean_df.to_csv(file_path, index=False)
    else:
        raise ValueError(f"Unsupported dataset format for saving: {format_str}")

    return os.path.getsize(file_path)
