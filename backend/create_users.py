from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base, User
from app.auth import get_password_hash
from app.database import SQLALCHEMY_DATABASE_URL

# Create database engine
engine = create_engine(SQLALCHEMY_DATABASE_URL)
Base.metadata.create_all(bind=engine)

# Create session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

def create_user(email: str, password: str, is_admin: bool = False):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        print(f"User {email} already exists")
        return existing_user
    
    # Create new user
    db_user = User(
        email=email,
        hashed_password=get_password_hash(password),
        is_active=True,
        is_admin=is_admin
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    print(f"Created {'admin' if is_admin else 'regular'} user: {email}")
    return db_user

def main():
    # Create admin user
    admin = create_user(
        email="admin@vectordb.com",
        password="admin123",
        is_admin=True
    )
    
    # Create regular user
    user = create_user(
        email="user@vectordb.com",
        password="user123",
        is_admin=False
    )

if __name__ == "__main__":
    main()
