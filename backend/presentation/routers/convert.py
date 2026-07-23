import os
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status, Header
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from backend.infrastructure.database.connection import get_db
from backend.infrastructure.database.repositories import SqlConversionRepository, SqlUserRepository
from backend.application.use_cases.convert_file import ConvertFileUseCase
from backend.application.use_cases.user_management import SearchUsersAndHistoryUseCase
from backend.application.dtos import ConversionResponseDTO, ConversionRecordDTO
from backend.domain.exceptions import DomainException, UserNotFoundException

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
