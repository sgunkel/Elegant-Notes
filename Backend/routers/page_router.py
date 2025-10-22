from typing import Annotated

from fastapi import APIRouter, Depends

from ..config import get_pages_path
from ..models.page_model import NamedPage, PageWithContentWithoutMetaData, PageRenameInfo
from ..handlers.page_handler import (
    handle_get_all_pages,
    handle_get_page_by_name,
    handle_new_page,
    handle_update_page,
    handle_page_rename,
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

@router.get('/all')
def get_all_pages(current_user: Annotated[User, Depends(get_current_user)]):
    path = get_user_pages_path(current_user)
    print(str(path))
    return handle_get_all_pages(path)

@router.post('/create')
def new_page(page_info: NamedPage, current_user: Annotated[User, Depends(get_current_user)]):
    path = get_user_pages_path(current_user)
    return handle_new_page(path, page_info)

@router.get('/get/{page_name}')
def get_page_by_name(page_name: str, current_user: Annotated[User, Depends(get_current_user)]):
    path = get_user_pages_path(current_user)
    return handle_get_page_by_name(path, page_name)

@router.post('/update')
def update_page(page_info: PageWithContentWithoutMetaData, current_user: Annotated[User, Depends(get_current_user)]):
    path = get_user_pages_path(current_user)
    return handle_update_page(path, page_info)

@router.post('/rename')
def rename_page(rename_meta: PageRenameInfo, current_user: Annotated[User, Depends(get_current_user)]):
    path = get_user_pages_path(current_user)
    return handle_page_rename(path, rename_meta)
