from typing import Annotated, Optional, Dict
from datetime import datetime, timedelta, timezone

import jwt
from jwt.exceptions import InvalidTokenError
from passlib.context import CryptContext
from fastapi import HTTPException, Depends, status

from ..database_api import get_db
from ..models.user_model import UserModel, UserModelWithPassword
from ..models.token_model import TokenDataModel
from ..security.scheme import oauth2_scheme

# To generate the key, run:
#   openssl rand -hex 32 > secret-key.txt
# This should be re-worked and included in the setup script soon
SECRET_KEY = ""
with open('./elegant_notes_backend/routers/secret-key.txt', 'r') as f: # very secure, I know
    SECRET_KEY = f.readlines()[0].strip()
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
TOKEN_EXPIRATION_DELTA = 15

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

CREDENTIAL_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def get_user(username: str) -> Optional[UserModelWithPassword]:
    try:
        user_raw = get_db().user_api.retrieve_by_id(f'User/{username}')
        return UserModelWithPassword(
            username=user_raw['username'],
            hashed_password=user_raw['password'],
            full_name=user_raw['full_name'],
            disabled=user_raw['disabled'],
        )
    except:
        return None

def authenticate_user(username: str, password: str) -> Optional[UserModel]:
    user = get_user(username)
    if user is None:
        return None
    elif not verify_password(password, user.hashed_password):
        return None
    return UserModel(
        username=user.username,
        full_name=user.full_name,
        disabled=user.disabled
    )

def create_access_token(data: Dict, expiration_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expiration_delta is not None:
        expire_time = datetime.now(timezone.utc) + expiration_delta
    else:
        expire_time = datetime.now(timezone.utc) + timedelta(minutes=TOKEN_EXPIRATION_DELTA)
    to_encode.update({'exp': expire_time})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]) -> UserModel:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        payload_username = payload.get('sub')
        if payload_username is None:
            raise CREDENTIAL_EXCEPTION
        token_data = TokenDataModel(username=payload_username)
    except InvalidTokenError:
        raise CREDENTIAL_EXCEPTION
    
    user = get_user(token_data.username)
    if user is None:
        raise CREDENTIAL_EXCEPTION
    return UserModel(
        username=user.username,
        full_name=user.full_name,
        disabled=user.disabled
    )

async def get_current_active_user(
    current_user: Annotated[UserModelWithPassword, Depends(get_current_user)],
):
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user
