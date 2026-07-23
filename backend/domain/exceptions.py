class DomainException(Exception):
    """Base domain exception"""
    pass

class UserAlreadyExistsException(DomainException):
    def __init__(self, username: str):
        super().__init__(f"User with username '{username}' already exists. Username must be unique.")
        self.username = username

class UserNotFoundException(DomainException):
    def __init__(self, identifier: str):
        super().__init__(f"User '{identifier}' not found.")

class InvalidFileFormatException(DomainException):
    def __init__(self, file_type: str):
        super().__init__(f"Unsupported file format '{file_type}'. Only CSV (.csv) and JSON (.json) are allowed.")

class ConversionFailedException(DomainException):
    def __init__(self, reason: str):
        super().__init__(f"File conversion to pickle failed: {reason}")
