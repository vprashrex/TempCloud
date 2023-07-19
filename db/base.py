from sqlalchemy import create_engine
from sqlalchemy.orm  import sessionmaker, declarative_base
from core.config import DATABASE_URI

engine = create_engine(DATABASE_URI,echo=True)
Base = declarative_base()
SessionLocal = sessionmaker(bind=engine,autoflush=False,autocommit=False)