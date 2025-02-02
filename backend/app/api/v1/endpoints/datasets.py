from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ....db import get_db
from ....schemas.dataset import (
    Dataset,
    DatasetCreate,
    DatasetQuery,
    QueryResponse,
)
from ....models import User
from ....services.file_service import FileService
from ....services.embedding_service import EmbeddingService
from ....services.text_processing_service import TextProcessingService
from ....core.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=Dataset, status_code=201)
async def create_dataset(
    *,
    name: str,
    description: str = None,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    file_service: FileService = Depends(FileService),
    embedding_service: EmbeddingService = Depends(EmbeddingService),
    text_service: TextProcessingService = Depends(TextProcessingService)
):
    """
    Create a new dataset from uploaded file.
    """
    # Save the uploaded file
    file_path = await file_service.save_file(file, current_user.id)

    try:
        # Extract text from file
        texts = await text_service.extract_text_from_file(file_path)

        # Create collection name from user_id and dataset name
        collection_name = f"user_{current_user.id}_{name}"

        # Generate embeddings and store in vector DB
        vector_db_path = await embedding_service.create_embeddings(
            texts=texts,
            collection_name=collection_name
        )

        # Create dataset record
        dataset = Dataset(
            name=name,
            description=description,
            file_path=file_path,
            vector_db_path=vector_db_path,
            owner_id=current_user.id
        )
        db.add(dataset)
        db.commit()
        db.refresh(dataset)

        return dataset

    except Exception as e:
        # Cleanup in case of error
        await file_service.delete_file(file_path)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[Dataset])
async def list_datasets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):
    """
    List all datasets owned by the current user.
    """
    return db.query(Dataset).filter(
        Dataset.owner_id == current_user.id
    ).offset(skip).limit(limit).all()

@router.get("/{dataset_id}", response_model=Dataset)
async def get_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific dataset by ID.
    """
    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.owner_id == current_user.id
    ).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return dataset

@router.post("/{dataset_id}/query", response_model=QueryResponse)
async def query_dataset(
    dataset_id: int,
    query: DatasetQuery,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    embedding_service: EmbeddingService = Depends(EmbeddingService)
):
    """
    Query a dataset for similar content.
    """
    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.owner_id == current_user.id
    ).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    results = await embedding_service.query_similar(
        query=query.query,
        collection_name=dataset.vector_db_path,
        n_results=query.n_results
    )

    return QueryResponse(
        results=results,
        dataset_id=dataset_id,
        query=query.query
    )

@router.delete("/{dataset_id}")
async def delete_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    file_service: FileService = Depends(FileService),
    embedding_service: EmbeddingService = Depends(EmbeddingService)
):
    """
    Delete a dataset and its associated files.
    """
    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.owner_id == current_user.id
    ).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    # Delete files and embeddings
    await file_service.delete_file(dataset.file_path)
    await embedding_service.delete_collection(dataset.vector_db_path)

    # Delete database record
    db.delete(dataset)
    db.commit()

    return {"status": "success"}
