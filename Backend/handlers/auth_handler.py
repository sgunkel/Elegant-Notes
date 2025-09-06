from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..models.user_model import (
    User,
    DBUser,
    UserCredentials,
    UserTokens,
    UserWithTokens,
    UserLogOutInfo,
)
from ..utilities.db_utils import (
    db_get_user_by_username,
    db_add_user,
)
from ..utilities.auth_utils import hash_equals_plaintext, create_access_token

def handle_user_registration(user_info: User, db: Session) -> UserTokens:
    user_with_same_username = db_get_user_by_username(db, user_info.username)
    if user_with_same_username is not None:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    db_add_user(db, user_info)
    return handle_user_login(user_info, db)

def handle_user_login(user_info: UserCredentials, db: Session) -> UserTokens:
    user = db_get_user_by_username(db, user_info.username)
    if user is None or not hash_equals_plaintext(user.password, user_info.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username or password is incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    data = {'sub': user.username}
    access_token = create_access_token(data)
    return UserTokens(access_token=access_token, token_type='bearer')

def handle_user_logout(user_info: UserTokens, db: Session) -> UserLogOutInfo:
    # TODO implement this
    return UserLogOutInfo(log_out_successful=True)
