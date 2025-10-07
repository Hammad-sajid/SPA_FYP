from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# PostgreSQL Database URL (Update with your credentials)
DATABASE_URL = "postgresql://postgres:db_password@localhost/db_name"

# Create SQLAlchemy engine
engine = create_engine(
                       
    DATABASE_URL,
    pool_size=20,           # Increase from default 5
    max_overflow=30,        # Increase from default 10
    pool_pre_ping=True,     # Test connections before use
    pool_recycle=3600,      # Recycle connections every hour
    pool_timeout=30,        # Connection timeout
    echo=False              # Set to True for SQL debugging
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

