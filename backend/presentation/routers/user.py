from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.infrastructure.database.connection import get_db
from backend.infrastructure.database.repositories import SqlUserRepository
from backend.application.dtos import UserCreateDTO, UserResponseDTO
from backend.application.use_cases.user_management import RegisterUserUseCase, ListUsersUseCase
from backend.domain.exceptions import UserAlreadyExistsException

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.post("/register", response_model=UserResponseDTO, status_code=status.HTTP_201_CREATED)
def register_user(dto: UserCreateDTO, db: Session = Depends(get_db)):
    try:
        user_repo = SqlUserRepository(db)
        use_case = RegisterUserUseCase(user_repo)
        return use_case.execute(dto)
    except UserAlreadyExistsException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("", response_model=List[UserResponseDTO])
def list_users(db: Session = Depends(get_db)):
    user_repo = SqlUserRepository(db)
    use_case = ListUsersUseCase(user_repo)
    return use_case.execute()
