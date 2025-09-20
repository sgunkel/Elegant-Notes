from typing import Annotated

from fastapi import APIRouter, Depends

from ..models.user_model import User
from ..utilities.db_utils import get_current_user
from ..config import get_pages_path
from ..handlers.meta_handler import handle_get_backlinks
from ..utilities.user_repo_utils import get_user_pages_path


router = APIRouter(
    prefix='/meta',
    tags=['meta'],
    responses={404: {'description': 'Not found'}},
)

@router.get('/backlinks/{page_name}')
def get_back_links(page_name: str, current_user: Annotated[User, Depends(get_current_user)]):
    path = get_user_pages_path(current_user)
    return handle_get_backlinks(page_name, path)
