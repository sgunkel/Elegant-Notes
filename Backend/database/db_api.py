from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# this should be in a config file and loaded whenever an admin changes it, along with a
#   system that moves all entries to the new database; this is a long ways away, though
SQLALCHEMY_DATABASE_URL = 'sqlite:///elegant-notes.db'

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
