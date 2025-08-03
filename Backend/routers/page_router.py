
from fastapi import APIRouter

from ..config import get_pages_path
from ..models.page_model import NamedPage, PageWithContentWithoutMetaData
from ..handlers.page_handler import (
    handle_get_all_pages,
    handle_get_page_by_name,
    handle_new_page,
    handle_update_page,
)

router = APIRouter(
    prefix='/page',
    tags=['page'],
    responses={404: {'description': 'Not found'}},
)

PAGE_PATH = get_pages_path()
PAGE_PATH_STR = str(PAGE_PATH)

@router.get('/all')
def get_all_pages():
    return handle_get_all_pages(PAGE_PATH)

@router.post('/create')
def new_page(page_info: NamedPage):
    return handle_new_page(PAGE_PATH, page_info)

@router.get('/get/{page_name}')
def get_page_by_name(page_name: str):
    return handle_get_page_by_name(PAGE_PATH, page_name)

@router.post('/update')
def update_page(page_info: PageWithContentWithoutMetaData):
    return handle_update_page(PAGE_PATH, page_info)
