from typing import Annotated

from fastapi import APIRouter, Depends

from ..models.user_model import User
from ..utilities.db_utils import get_current_user
from ..utilities.user_repo_utils import get_user_repo_path
from ..handlers.meta_handler import handle_get_all_references
from ..models.meta_model import ReferencesRetrievalRequest

router = APIRouter(
    prefix='/meta',
    tags=['meta'],
    responses={404: {'description': 'Not found'}},
)

@router.post('/references')
def get_all_references(request: ReferencesRetrievalRequest, current_user: Annotated[User, Depends(get_current_user)]):
    path = get_user_repo_path(current_user)
    return handle_get_all_references(request, path)
