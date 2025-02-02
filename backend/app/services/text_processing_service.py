from typing import List
import PyPDF2
from docx import Document
import os
from fastapi import HTTPException

class TextProcessingService:
    @staticmethod
    async def extract_text_from_file(file_path: str) -> List[str]:
        """Extract text from various file formats and split into chunks"""
        try:
            file_extension = os.path.splitext(file_path)[1].lower()
            
            if file_extension == '.txt':
                return await TextProcessingService._process_txt(file_path)
            elif file_extension == '.pdf':
                return await TextProcessingService._process_pdf(file_path)
            elif file_extension in ['.doc', '.docx']:
                return await TextProcessingService._process_docx(file_path)
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported file format: {file_extension}"
                )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to process file: {str(e)}"
            )

    @staticmethod
    async def _process_txt(file_path: str) -> List[str]:
        """Process text file"""
        with open(file_path, 'r', encoding='utf-8') as file:
            text = file.read()
        return TextProcessingService._split_text(text)

    @staticmethod
    async def _process_pdf(file_path: str) -> List[str]:
        """Process PDF file"""
        text = ""
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
        return TextProcessingService._split_text(text)

    @staticmethod
    async def _process_docx(file_path: str) -> List[str]:
        """Process Word document"""
        doc = Document(file_path)
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        return TextProcessingService._split_text(text)

    @staticmethod
    def _split_text(text: str, chunk_size: int = 1000) -> List[str]:
        """Split text into chunks of approximately equal size"""
        words = text.split()
        chunks = []
        current_chunk = []
        current_size = 0

        for word in words:
            word_size = len(word) + 1  # +1 for space
            if current_size + word_size > chunk_size and current_chunk:
                chunks.append(" ".join(current_chunk))
                current_chunk = []
                current_size = 0
            current_chunk.append(word)
            current_size += word_size

        if current_chunk:
            chunks.append(" ".join(current_chunk))

        return chunks
