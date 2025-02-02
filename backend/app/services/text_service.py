import re
from typing import List, Optional
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords
import logging

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')
try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

logger = logging.getLogger(__name__)

class TextPreprocessor:
    def __init__(self):
        self.stop_words = set(stopwords.words('english'))

    def preprocess_text(self, text: str, remove_stopwords: bool = False) -> str:
        """
        Preprocess text with configurable options
        """
        # Convert to lowercase
        text = text.lower()
        
        # Remove special characters and extra whitespace
        text = re.sub(r'[^\w\s]', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()
        
        if remove_stopwords:
            words = word_tokenize(text)
            words = [w for w in words if w not in self.stop_words]
            text = ' '.join(words)
        
        return text

class ChunkStrategy:
    """Base class for chunking strategies"""
    def chunk_text(self, text: str) -> List[str]:
        raise NotImplementedError

class TokenCountChunkStrategy(ChunkStrategy):
    """Chunk text based on token count"""
    def __init__(self, chunk_size: int = 512, overlap: int = 50):
        self.chunk_size = chunk_size
        self.overlap = overlap

    def chunk_text(self, text: str) -> List[str]:
        words = word_tokenize(text)
        chunks = []
        
        start = 0
        while start < len(words):
            end = start + self.chunk_size
            chunk = ' '.join(words[start:end])
            chunks.append(chunk)
            start = end - self.overlap
            
        return chunks

class SentenceChunkStrategy(ChunkStrategy):
    """Chunk text based on sentences"""
    def __init__(self, max_sentences: int = 5, overlap_sentences: int = 1):
        self.max_sentences = max_sentences
        self.overlap_sentences = overlap_sentences

    def chunk_text(self, text: str) -> List[str]:
        sentences = sent_tokenize(text)
        chunks = []
        
        start = 0
        while start < len(sentences):
            end = start + self.max_sentences
            chunk = ' '.join(sentences[start:end])
            chunks.append(chunk)
            start = end - self.overlap_sentences
            
        return chunks

class TextService:
    def __init__(self, chunk_strategy: Optional[ChunkStrategy] = None):
        self.preprocessor = TextPreprocessor()
        self.chunk_strategy = chunk_strategy or TokenCountChunkStrategy()

    def process_text(self, text: str, remove_stopwords: bool = False) -> List[str]:
        """
        Process text through the entire pipeline:
        1. Preprocess text
        2. Chunk text
        3. Return chunks with metadata
        """
        # Preprocess text
        processed_text = self.preprocessor.preprocess_text(
            text, 
            remove_stopwords=remove_stopwords
        )
        
        # Chunk text
        chunks = self.chunk_strategy.chunk_text(processed_text)
        
        return chunks

    def set_chunk_strategy(self, strategy: ChunkStrategy):
        """Change chunking strategy"""
        self.chunk_strategy = strategy
