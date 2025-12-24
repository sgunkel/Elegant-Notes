from typing import List
from pathlib import Path

from ..utilities.meta_utils import ReferenceLocator, search_blocks
from ..utilities.user_repo_utils import get_page_objects
from ..models.meta_model import (
    PageLinkage,
    ReferencesRetrievalRequest,
    BlockSearchResult
)

def handle_get_all_references(retrieval_request: ReferencesRetrievalRequest, user_path: Path) -> PageLinkage:
    page_path = user_path / (retrieval_request.page_name + '.md')
    ref_locator = ReferenceLocator(user_path, page_path, retrieval_request.block_ids)
    return ref_locator.retrieve_all_relationships()

def handle_page_search(partial_page_name: str, user_path: Path) -> List[str]:
    # cheap dumb version that can most definitely be updated later
    all_files = []
    cut_len = len(str(user_path))
    for file in get_page_objects(user_path):
        if partial_page_name.lower() in file.name.lower():
            # `file` is a full path, so we cut everything before the user repo path
            final = str(file)[cut_len:]
            all_files.append(final)
    return all_files

def handle_block_search(given_text: str, user_path: Path) -> List[BlockSearchResult]:
    found: List[BlockSearchResult] = []
    for page_obj in get_page_objects(user_path):
        found.extend(search_blocks(given_text, page_obj))
    return found
