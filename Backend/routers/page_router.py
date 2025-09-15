from typing import Annotated

from fastapi import APIRouter, Depends

from ..config import get_pages_path
from ..models.page_model import NamedPage, PageWithContentWithoutMetaData
from ..handlers.page_handler import (
    handle_get_all_pages,
    handle_get_page_by_name,
    handle_new_page,
    handle_update_page,
)
from ..models.user_model import User
from ..utilities.db_utils import get_current_user
from ..utilities.user_repo_utils import (
    get_user_repo_path, 
    get_user_pages_path,
)

router = APIRouter(
    prefix='/page',
    tags=['page'],
    responses={404: {'description': 'Not found'}},
)

PAGE_PATH = get_pages_path()
PAGE_PATH_STR = str(PAGE_PATH)

@router.get('/all')
def get_all_pages(current_user: Annotated[User, Depends(get_current_user)]):
    path = get_user_pages_path(current_user, PAGE_PATH)
    return handle_get_all_pages(path)

@router.post('/create')
def new_page(page_info: NamedPage, current_user: Annotated[User, Depends(get_current_user)]):
    path = get_user_pages_path(current_user, PAGE_PATH)
    return handle_new_page(path, page_info)

@router.get('/get/{page_name}')
def get_page_by_name(page_name: str, current_user: Annotated[User, Depends(get_current_user)]):
    path = get_user_pages_path(current_user, PAGE_PATH)
    return handle_get_page_by_name(path, page_name)

@router.post('/update')
def update_page(page_info: PageWithContentWithoutMetaData, current_user: Annotated[User, Depends(get_current_user)]):
    path = get_user_pages_path(current_user, PAGE_PATH)
    return handle_update_page(path, page_info)
