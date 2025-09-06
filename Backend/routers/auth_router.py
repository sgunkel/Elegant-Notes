from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..database.db_api import get_db
from ..utilities.db_utils import get_current_user
from ..models.user_model import (
    User,
    UserCredentials,
    UserLogOutInfo,
    UserTokens,
)
from ..handlers.auth_handler import (
    handle_user_registration,
    handle_user_login,
    handle_user_logout,
)

router = APIRouter(
    prefix='/auth',
    tags=['auth'],
    responses={404: {'description': 'Not found'}},
)

@router.post('/register', response_model=UserTokens)
def register_user(user_info: User, db: Session = Depends(get_db)):
    # TODO add documentation for SwaggerUI/in general
    return handle_user_registration(user_info, db)

@router.post('/login', response_model=UserTokens)
def login_user(login_info: UserCredentials, db: Session = Depends(get_db)):
    # TODO add documentation for SwaggerUI/in general
    return handle_user_login(login_info, db)

@router.post('/logout', response_model=UserLogOutInfo)
def log_user_out(logout_info: UserTokens, db: Session = Depends(get_db)) -> UserLogOutInfo:
    # TODO add documentation for SwaggerUI/in general
    return handle_user_logout(logout_info, db)

@router.get('/me', response_model=User)
def get_logged_in_user_info(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    # TODO add documentation for SwaggerUI/in general
    return current_user

@router.post('/token')
def log_user_in(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)) -> UserTokens:
    info = UserCredentials(username=form_data.username, password=form_data.password)
    return handle_user_login(info, db)
