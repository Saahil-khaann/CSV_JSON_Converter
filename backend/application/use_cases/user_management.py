from typing import List, Optional
from backend.domain.interfaces import IUserRepository, IConversionRepository
from backend.application.dtos import UserResponseDTO, UserCreateDTO, ConversionRecordDTO

class RegisterUserUseCase:
    def __init__(self, user_repo: IUserRepository):
        self.user_repo = user_repo

    def execute(self, dto: UserCreateDTO) -> UserResponseDTO:
        user = self.user_repo.create_user(dto.username)
        return UserResponseDTO.model_validate(user)

class SearchUsersAndHistoryUseCase:
    def __init__(self, user_repo: IUserRepository, conversion_repo: IConversionRepository):
        self.user_repo = user_repo
        self.conversion_repo = conversion_repo

    def execute_search(self, query: str, user_id: Optional[int] = None) -> List[ConversionRecordDTO]:
        records = self.conversion_repo.search_records(query=query, user_id=user_id)
        return [ConversionRecordDTO.model_validate(r) for r in records]

class ListUsersUseCase:
    def __init__(self, user_repo: IUserRepository):
        self.user_repo = user_repo

    def execute(self) -> List[UserResponseDTO]:
        users = self.user_repo.list_all_users()
        return [UserResponseDTO.model_validate(u) for u in users]
