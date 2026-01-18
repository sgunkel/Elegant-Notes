from typing import Annotated

from fastapi import APIRouter, Depends

from ..models.user_model import User
from ..utilities.db_utils import get_current_user
from ..utilities.user_repo_utils import get_user_repo_path
from ..models.meta_model import ReferencesRetrievalRequest, ReferenceSearchQuery, BlockSearchResult
from ..handlers.meta_handler import (
    handle_get_all_references,
    handle_page_search,
    handle_block_search,
    handle_block_id_assignment,
)

router = APIRouter(
    prefix='/meta',
    tags=['meta'],
    responses={404: {'description': 'Not found'}},
)

@router.post('/references')
def get_all_references(request: ReferencesRetrievalRequest, current_user: Annotated[User, Depends(get_current_user)]):
    user_repo_path = get_user_repo_path(current_user)
    return handle_get_all_references(request, user_repo_path)

@router.post('/search-page')
def get_page_results_by_query(search_request: ReferenceSearchQuery, current_user: Annotated[User, Depends(get_current_user)]):
    user_repo_path = get_user_repo_path(current_user)
    return handle_page_search(search_request.query, user_repo_path)

@router.post('/search-block')
def get_block_results_by_text(search_request: ReferenceSearchQuery, current_user: Annotated[User, Depends(get_current_user)]):
    user_repo_path = get_user_repo_path(current_user)
    return handle_block_search(search_request.query, user_repo_path)

@router.post('/assign-block-id')
def assign_id_to_block_search_result(search_result: BlockSearchResult, current_user: Annotated[User, Depends(get_current_user)]):
    user_repo_path = get_user_repo_path(current_user)
    return handle_block_id_assignment(search_result, user_repo_path)
