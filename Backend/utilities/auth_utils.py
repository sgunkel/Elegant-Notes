from datetime import datetime, timedelta
from typing import Union

from passlib.context import CryptContext
import jwt

SECRET_KEY = 'yup, change this to something logical like pulling from an env variable'
TOKEN_EXPIRATION_MINUTES = 30
ENCRYPTION_ALGORITHM = 'HS256'

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_str(plain_text: str) -> str:
    return pwd_context.hash(plain_text)

def hash_equals_plaintext(hash: str, plaintext: str) -> bool:
    return pwd_context.verify(plaintext, hash)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expiration = datetime.utcnow() + timedelta(minutes=TOKEN_EXPIRATION_MINUTES)
    to_encode['exp'] = expiration
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ENCRYPTION_ALGORITHM)
    return encoded_jwt

def verify_access_token(token: str) -> Union[None, str]:
    username = None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ENCRYPTION_ALGORITHM])
        username = payload.get('sub')
    except jwt.PyJWTError:
        pass
    return username
