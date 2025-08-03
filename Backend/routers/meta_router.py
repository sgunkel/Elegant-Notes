from fastapi import APIRouter

from ..config import get_pages_path
from ..handlers.meta_handler import handle_get_backlinks

router = APIRouter(
    prefix='/meta',
    tags=['meta'],
    responses={404: {'description': 'Not found'}},
)

PAGE_PATH = get_pages_path()
PAGE_PATH_STR = str(PAGE_PATH)

@router.get('/backlinks/{page_name}')
def get_back_links(page_name: str):
    return handle_get_backlinks(page_name)
