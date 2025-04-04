from fastapi import APIRouter

from .config import get_pages_path
from .meta_model import BackLink
from .page_model import NamedPage
from .meta_utils import get_back_links_by_page_name

router = APIRouter(
    prefix='/meta',
    tags=['meta'],
    responses={404: {'description': 'Not found'}},
)

PAGE_PATH = get_pages_path()
PAGE_PATH_STR = str(PAGE_PATH)

@router.get('/backlinks/{page_name}')
def get_back_links(page_name: str):
    return get_back_links_by_page_name(page_name)
