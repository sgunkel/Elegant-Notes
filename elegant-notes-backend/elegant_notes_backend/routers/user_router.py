from typing import Annotated
from datetime import timedelta

from fastapi import APIRouter, Depends, status, HTTPException, Body
from fastapi.security import OAuth2PasswordRequestForm

from ..database_api import get_db
from ..models.user_model import UserModel
from ..models.token_model import TokenModel
from ..security.authentication import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    CREDENTIAL_EXCEPTION,
    get_password_hash,
    authenticate_user,
    create_access_token,
    get_current_active_user,
)

router = APIRouter(
    prefix='/user',
    tags=['user'],
    responses={404: {'description': 'Not found'}},
)

@router.post('/token')
async def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    user = authenticate_user(form_data.username, form_data.password)
    if user is None:
        raise CREDENTIAL_EXCEPTION
    
    access_token_expiration = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={'sub': user.username},
        expiration_delta=access_token_expiration
    )
    return TokenModel(access_token=access_token, token_type='bearer')

@router.get('/me')
async def get_active_user(current_user: Annotated[UserModel, Depends(get_current_active_user)]):
    return current_user

@router.post('/add')
def add_user(new_user: OAuth2PasswordRequestForm = Depends(), full_name = Body()):
    raw_user = {
        'username': new_user.username,
        'password': get_password_hash(new_user.password),
        'full_name': full_name,
        'disabled': False,
    }
    try:
        get_db().user_api.create(raw_user)
        return {'status': 'Success!'}
    except:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Username already in use')

@router.get('/all')
def get_all_users(_: Annotated[UserModel, Depends(get_current_active_user)]):
    return get_db().user_api.retrieve_all()
