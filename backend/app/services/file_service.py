from typing import List, Dict, Any, BinaryIO
import os
from pathlib import Path
import magic
import PyPDF2
import pandas as pd
import json
import logging
from fastapi import UploadFile
from ..core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

class FileService:
    SUPPORTED_MIMETYPES = {
        'text/plain': '.txt',
        'application/pdf': '.pdf',
        'text/csv': '.csv',
        'application/json': '.json',
    }

    def __init__(self):
        self.upload_dir = settings.UPLOAD_DIR
        os.makedirs(self.upload_dir, exist_ok=True)

    def detect_file_type(self, file: BinaryIO) -> str:
        """Detect file type using python-magic"""
        mime = magic.from_buffer(file.read(2048), mime=True)
        file.seek(0)  # Reset file pointer
        
        if mime not in self.SUPPORTED_MIMETYPES:
            raise ValueError(f"Unsupported file type: {mime}")
        
        return mime

    async def save_file(self, file: UploadFile, filename: str, database_id: str) -> Path:
        """Save uploaded file to disk"""
        database_dir = Path(self.upload_dir) / database_id
        database_dir.mkdir(parents=True, exist_ok=True)
        
        file_path = database_dir / filename
        content = await file.read()
        with open(file_path, 'wb') as f:
            f.write(content)
        
        await file.seek(0)  # Reset file pointer for future reads
        return file_path

    def read_file(self, file_path: Path) -> str:
        """Read file content based on file type"""
        mime = magic.from_file(str(file_path), mime=True)
        
        if mime == 'text/plain':
            return self._read_text_file(file_path)
        elif mime == 'application/pdf':
            return self._read_pdf_file(file_path)
        elif mime == 'text/csv':
            return self._read_csv_file(file_path)
        elif mime == 'application/json':
            return self._read_json_file(file_path)
        else:
            raise ValueError(f"Unsupported file type: {mime}")

    def _read_text_file(self, file_path: Path) -> str:
        """Read text file"""
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()

    def _read_pdf_file(self, file_path: Path) -> str:
        """Read PDF file"""
        text = []
        with open(file_path, 'rb') as f:
            pdf_reader = PyPDF2.PdfReader(f)
            for page in pdf_reader.pages:
                text.append(page.extract_text())
        return '\n'.join(text)

    def _read_csv_file(self, file_path: Path) -> str:
        """Read CSV file"""
        df = pd.read_csv(file_path)
        return df.to_string()

    def _read_json_file(self, file_path: Path) -> str:
        """Read JSON file"""
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return json.dumps(data, indent=2)

    def cleanup_files(self, database_id: str):
        """Clean up files for a database"""
        database_dir = Path(self.upload_dir) / database_id
        if database_dir.exists():
            for file_path in database_dir.glob('*'):
                file_path.unlink()
            database_dir.rmdir()
