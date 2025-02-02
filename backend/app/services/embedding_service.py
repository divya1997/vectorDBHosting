from typing import List
import os
import nltk
import logging
from openai import OpenAI
from ..core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Set OpenAI API key
class EmbeddingService:
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.EMBEDDING_MODEL  # Use model from settings
        
        # Download NLTK data if not already downloaded
        try:
            nltk.data.find('tokenizers/punkt')
        except LookupError:
            nltk.download('punkt')

    def chunk_text(self, text: str, chunk_size: int = 512) -> List[str]:
        """Split text into chunks using NLTK sentence tokenizer"""
        # Split text into sentences
        sentences = nltk.sent_tokenize(text)
        
        chunks = []
        current_chunk = []
        current_size = 0
        
        for sentence in sentences:
            # Approximate token count (rough estimate)
            sentence_size = len(sentence.split())
            
            if current_size + sentence_size > chunk_size and current_chunk:
                # If adding this sentence would exceed chunk size, save current chunk
                chunks.append(' '.join(current_chunk))
                current_chunk = [sentence]
                current_size = sentence_size
            else:
                # Add sentence to current chunk
                current_chunk.append(sentence)
                current_size += sentence_size
        
        # Add the last chunk if it exists
        if current_chunk:
            chunks.append(' '.join(current_chunk))
        
        return chunks

    def get_embeddings(self, texts: List[str], model: str = None) -> List[List[float]]:
        """Get embeddings for a list of texts using OpenAI API"""
        try:
            # Get embeddings in batches to avoid rate limits
            batch_size = 100
            all_embeddings = []
            
            # Use provided model or fallback to default
            model_to_use = model or self.model
            logger.info(f"Using model: {model_to_use}")
            
            for i in range(0, len(texts), batch_size):
                batch = texts[i:i + batch_size]
                try:
                    logger.info(f"Getting embeddings for batch {i} using model: {model_to_use}")
                    response = self.client.embeddings.create(
                        model=model_to_use,
                        input=batch
                    )
                    embeddings = [data.embedding for data in response.data]
                    all_embeddings.extend(embeddings)
                except Exception as e:
                    logger.error(f"Error in batch {i}: {str(e)}")
                    raise e
            
            return all_embeddings
            
        except Exception as e:
            logger.error(f"Error getting embeddings: {str(e)}")
            raise e
