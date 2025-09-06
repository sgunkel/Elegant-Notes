from pydantic import BaseModel, EmailStr
from sqlalchemy import Column, Integer, String

from ..database.db_api import Base

class UserLogOutInfo(BaseModel):
    log_out_successful: bool

class UserCredentials(BaseModel):
    username: EmailStr
    password: str

class UserTokens(BaseModel):
    access_token: str
    token_type: str

class User(UserCredentials):
    '''# User class for the backend
        (not to be confused with DBUser strictly for the database operations, which mirrors
        fields from this class)'''
    name: str

    class Config:
        orm_mode = True # Allows Pydantic to work with SQLAlchemy models directly

class UserWithTokens(User, UserTokens):
    # all fields are already defined
    pass

class DBUser(Base):
    '''# User class for the database
        (note that this is different from the `User` class)'''
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    username = Column(String, unique=True, index=True)
    password = Column(String)
