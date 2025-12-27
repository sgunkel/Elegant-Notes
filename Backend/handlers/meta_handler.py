from typing import List
from pathlib import Path

from fastapi import HTTPException, status

from ..utilities.meta_utils import (
    ReferenceLocator,
    BacklinkExtractor,
    BlockReferenceExtractor,
    search_blocks,
)
from ..utilities.user_repo_utils import get_page_objects
from ..models.status_model import (
    OperationResponse,
    SuccessResponse,
)
from ..models.meta_model import (
    PageLinkage,
    ReferencesRetrievalRequest,
    BlockSearchResult
)

def handle_get_all_references(retrieval_request: ReferencesRetrievalRequest, user_path: Path) -> PageLinkage:
    page_path = user_path / (retrieval_request.page_name + '.md')
    ref_locator = ReferenceLocator(user_path, page_path, retrieval_request.block_ids)
    ref_locator.add_extractor(BacklinkExtractor(page_path.name))
    ref_locator.add_extractor(BlockReferenceExtractor(retrieval_request.block_ids))
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

def handle_block_id_assignment(query: BlockSearchResult, user_repo_path: Path) -> OperationResponse:
    if query.block_id is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='New Block ID (in UUID V4 format) is required - none given')
    
    path = user_repo_path / 'pages' / query.page_name # TODO update this to use other folders when we fully support that feature
    if not path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Path to Page does not exist')
    
    with path.open(mode='r') as f:
        lines = f.readlines()
    if len(lines) < query.line_number - 1:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Page file has less lines than given Block location (line_number too large)')
    
    line = lines[query.line_number - 1].rstrip()
    if not line == query.block_text.rstrip():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Block in file does not match Block location given (text mismatch)')
    
    starting_whitespace_len = len(line) - len(line.lstrip())
    indention = (' ' * starting_whitespace_len) + '  ' # the last two spaces align the unordered list Markdown character (`-`) to the beginning of the Block text
    id_line = f'{indention}id:: {query.block_id}'
    lines.insert(query.line_number, id_line)
    new_content = '\n'.join(line.rstrip() for line in lines)
    with path.open('w') as f:
        f.write(new_content + '\n')
    return SuccessResponse(msg='Block ID assignment successful')
