from typing import Union

from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from ..models.user_model import (
    Base,
    User,
    DBUser,
)
from .auth_utils import hash_str, verify_access_token
from ..database.db_api import engine, get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

def init_users_db():
    Base.metadata.create_all(bind=engine)

def db_get_user_by_username(db: Session, username: str) -> Union[None, User]:
    user: Union[None, User] = None
    user_from_db = db.query(DBUser).filter(DBUser.username == username).first()
    if user_from_db is not None:
        # do we need to share the ID field on the database here?
        user = User(username=user_from_db.username,
                    password=user_from_db.password,
                    name=user_from_db.name)
    return user

def db_add_user(db: Session, new_user: User) -> None:
    hashed_password = hash_str(new_user.password)
    db_user: DBUser = DBUser(username=new_user.username,
                             password=hashed_password,
                             name=new_user.name)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    username = verify_access_token(token)
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db_get_user_by_username(db, username)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user
