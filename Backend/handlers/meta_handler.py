from typing import List
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

def handle_page_search(partial_page_name: str, user_path: Path) -> List[str]:
    # cheap dumb version that can most definitely be updated later
    all_files = []
    cut_len = len(str(user_path))
    for file in user_path.rglob('*.md'):
        if partial_page_name.lower() in file.name.lower():
            all_files.append(str(file)[cut_len:])
    return all_files
