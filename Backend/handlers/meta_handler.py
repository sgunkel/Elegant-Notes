from pathlib import Path

from ..models.meta_model import (
    PageLinkage,
    ReferencesRetrievalRequest,
)
from ..utilities.meta_utils import ReferenceLocator

def handle_get_all_references(retrieval_request: ReferencesRetrievalRequest, user_path: Path) -> PageLinkage:
    page_path = user_path / (retrieval_request.page_name + '.md')
    ref_locator = ReferenceLocator(user_path, page_path, retrieval_request.block_ids)
    return ref_locator.retrieve_all_relationships()
