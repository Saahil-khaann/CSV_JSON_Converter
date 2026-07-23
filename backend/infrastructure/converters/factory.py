from typing import List, Optional
from backend.domain.interfaces import IFileConverter
from backend.domain.exceptions import InvalidFileFormatException
from backend.infrastructure.converters.csv_converter import CsvToPickleConverter
from backend.infrastructure.converters.json_converter import JsonToPickleConverter

class ConverterFactory:
    def __init__(self):
        self._converters: List[IFileConverter] = [
            CsvToPickleConverter(),
            JsonToPickleConverter()
        ]

    def register_converter(self, converter: IFileConverter):
        """Allows registering new converters dynamically (Open/Closed Principle)"""
        self._converters.append(converter)

    def get_converter(self, filename: str, content_type: Optional[str] = None) -> IFileConverter:
        for converter in self._converters:
            if converter.supports(filename, content_type):
                return converter
        
        ext = filename.split('.')[-1] if '.' in filename else filename
        raise InvalidFileFormatException(ext)

converter_factory = ConverterFactory()
