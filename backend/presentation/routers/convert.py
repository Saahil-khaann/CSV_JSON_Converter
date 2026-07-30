import os
import pandas as pd
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status, Header
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from backend.infrastructure.database.connection import get_db
from backend.infrastructure.database.repositories import SqlConversionRepository, SqlUserRepository
from backend.application.use_cases.convert_file import ConvertFileUseCase
from backend.application.use_cases.user_management import SearchUsersAndHistoryUseCase
from backend.application.dtos import ConversionResponseDTO, ConversionRecordDTO
from backend.domain.exceptions import DomainException, UserNotFoundException
from backend.application.utils.dataset_editor import load_dataset_df, save_dataset_df

router = APIRouter(prefix="/api", tags=["Convert & History"])

@router.post("/convert", response_model=ConversionResponseDTO)
async def convert_file(
    file: UploadFile = File(...),
    user_id: int = Form(...),
    remove_duplicates: bool = Form(False),
    target_format: str = Form("pkl"),
    db: Session = Depends(get_db)
):
    try:
        content = await file.read()
        conversion_repo = SqlConversionRepository(db)
        user_repo = SqlUserRepository(db)
        use_case = ConvertFileUseCase(conversion_repo, user_repo)
        
        return use_case.execute(
            file_content=content,
            filename=file.filename,
            user_id=user_id,
            content_type=file.content_type,
            remove_duplicates=remove_duplicates,
            target_format=target_format
        )
    except DomainException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Internal conversion error: {str(e)}")

@router.get("/download/{file_id}")
def download_pickle(file_id: str, db: Session = Depends(get_db)):
    conversion_repo = SqlConversionRepository(db)
    record = conversion_repo.get_by_file_id(file_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"File record '{file_id}' not found.")
    
    if not os.path.exists(record.pickle_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File storage resource missing.")

    target_fmt = getattr(record, "target_format", "pkl") or "pkl"
    base_name = record.original_filename.rsplit('.', 1)[0]
    download_name = f"{base_name}.{target_fmt}"

    media_type_map = {
        "pkl": "application/octet-stream",
        "json": "application/json",
        "csv": "text/csv"
    }
    media_type = media_type_map.get(target_fmt, "application/octet-stream")

    return FileResponse(
        path=record.pickle_path,
        media_type=media_type,
        filename=download_name
    )

@router.get("/history", response_model=List[ConversionRecordDTO])
def get_history(
    q: Optional[str] = None,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    conversion_repo = SqlConversionRepository(db)
    user_repo = SqlUserRepository(db)
    use_case = SearchUsersAndHistoryUseCase(user_repo, conversion_repo)
    return use_case.execute_search(query=q, user_id=user_id)


@router.get("/records/{file_id}")
def get_dataset_records(file_id: str, db: Session = Depends(get_db)):
    conversion_repo = SqlConversionRepository(db)
    record = conversion_repo.get_by_file_id(file_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"File record '{file_id}' not found.")
    
    if not os.path.exists(record.pickle_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File storage resource missing.")

    try:
        df = load_dataset_df(record.pickle_path, record.target_format)
        df_filled = df.fillna("")
        rows = df_filled.to_dict(orient="records")
        return {
            "file_id": file_id,
            "columns": list(df.columns),
            "rows": rows,
            "row_count": len(df),
            "column_count": len(df.columns),
            "original_filename": record.original_filename,
            "target_format": record.target_format,
            "pickle_size_bytes": record.pickle_size_bytes
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to read dataset: {str(e)}")


@router.post("/records/{file_id}")
def add_dataset_record(file_id: str, new_row: Dict[str, Any], db: Session = Depends(get_db)):
    conversion_repo = SqlConversionRepository(db)
    record = conversion_repo.get_by_file_id(file_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"File record '{file_id}' not found.")
    
    if not os.path.exists(record.pickle_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File storage resource missing.")

    try:
        df = load_dataset_df(record.pickle_path, record.target_format)
        
        row_dict = {}
        for col in df.columns:
            row_dict[col] = new_row.get(col, "")
        
        new_df = pd.DataFrame([row_dict])
        df = pd.concat([df, new_df], ignore_index=True)
        
        new_size_bytes = save_dataset_df(df, record.pickle_path, record.target_format)
        conversion_repo.update_record_stats(file_id, len(df), new_size_bytes)
        
        if record.target_format == "json":
            raw_output_snippet = df.head(100).to_json(orient="records", indent=2)
        elif record.target_format == "csv":
            raw_output_snippet = df.head(100).to_csv(index=False)
        else:
            raw_output_snippet = f"// Python Pickle (.pkl) Binary Object\n// Output Size: {new_size_bytes} bytes\n// Format: Pandas DataFrame Stream ({len(df)} rows x {len(df.columns)} columns)\n// Python Usage: pandas.read_pickle('{record.original_filename.split('.')[0]}.pkl')"

        df_filled = df.fillna("")
        return {
            "message": "Row added successfully",
            "file_id": file_id,
            "row_count": len(df),
            "pickle_size_bytes": new_size_bytes,
            "rows": df_filled.to_dict(orient="records"),
            "raw_output_snippet": raw_output_snippet
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to add row: {str(e)}")


@router.put("/records/{file_id}/{row_index}")
def update_dataset_record(file_id: str, row_index: int, updated_row: Dict[str, Any], db: Session = Depends(get_db)):
    conversion_repo = SqlConversionRepository(db)
    record = conversion_repo.get_by_file_id(file_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"File record '{file_id}' not found.")
    
    if not os.path.exists(record.pickle_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File storage resource missing.")

    try:
        df = load_dataset_df(record.pickle_path, record.target_format)
        if row_index < 0 or row_index >= len(df):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Row index {row_index} out of range [0, {len(df)-1}].")
        
        for col in df.columns:
            if col in updated_row:
                df.at[row_index, col] = updated_row[col]
        
        new_size_bytes = save_dataset_df(df, record.pickle_path, record.target_format)
        conversion_repo.update_record_stats(file_id, len(df), new_size_bytes)
        
        if record.target_format == "json":
            raw_output_snippet = df.head(100).to_json(orient="records", indent=2)
        elif record.target_format == "csv":
            raw_output_snippet = df.head(100).to_csv(index=False)
        else:
            raw_output_snippet = f"// Python Pickle (.pkl) Binary Object\n// Output Size: {new_size_bytes} bytes\n// Format: Pandas DataFrame Stream ({len(df)} rows x {len(df.columns)} columns)\n// Python Usage: pandas.read_pickle('{record.original_filename.split('.')[0]}.pkl')"

        df_filled = df.fillna("")
        return {
            "message": "Row updated successfully",
            "file_id": file_id,
            "row_count": len(df),
            "pickle_size_bytes": new_size_bytes,
            "rows": df_filled.to_dict(orient="records"),
            "raw_output_snippet": raw_output_snippet
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to update row: {str(e)}")


@router.delete("/records/{file_id}/{row_index}")
def delete_dataset_record(file_id: str, row_index: int, db: Session = Depends(get_db)):
    conversion_repo = SqlConversionRepository(db)
    record = conversion_repo.get_by_file_id(file_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"File record '{file_id}' not found.")
    
    if not os.path.exists(record.pickle_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File storage resource missing.")

    try:
        df = load_dataset_df(record.pickle_path, record.target_format)
        if row_index < 0 or row_index >= len(df):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Row index {row_index} out of range [0, {len(df)-1}].")
        
        df = df.drop(row_index).reset_index(drop=True)
        
        new_size_bytes = save_dataset_df(df, record.pickle_path, record.target_format)
        conversion_repo.update_record_stats(file_id, len(df), new_size_bytes)
        
        if record.target_format == "json":
            raw_output_snippet = df.head(100).to_json(orient="records", indent=2)
        elif record.target_format == "csv":
            raw_output_snippet = df.head(100).to_csv(index=False)
        else:
            raw_output_snippet = f"// Python Pickle (.pkl) Binary Object\n// Output Size: {new_size_bytes} bytes\n// Format: Pandas DataFrame Stream ({len(df)} rows x {len(df.columns)} columns)\n// Python Usage: pandas.read_pickle('{record.original_filename.split('.')[0]}.pkl')"

        df_filled = df.fillna("")
        return {
            "message": "Row deleted successfully",
            "file_id": file_id,
            "row_count": len(df),
            "pickle_size_bytes": new_size_bytes,
            "rows": df_filled.to_dict(orient="records"),
            "raw_output_snippet": raw_output_snippet
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to delete row: {str(e)}")
