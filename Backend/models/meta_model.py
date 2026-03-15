from typing import List, Optional

from pydantic import BaseModel

class RefMetadata(BaseModel):
    ref_id: str
    block_index: int
    start_pos: int
    end_pos: int

class PageMetadata(BaseModel):
    page_name: str
    content: str
    blocks: List[RefMetadata]
    backlinks: List[RefMetadata]

class PageLinkage(BaseModel):
    references: List[PageMetadata]

class ReferencesRetrievalRequest(BaseModel):
    page_name: str
    block_ids: List[str]
    block_ids_in_text: List[str]

class ReferenceSearchQuery(BaseModel):
    query: str

class BlockSearchResult(BaseModel):
    block_id: Optional[str]
    block_text: str
    line_number: int
    page_name: str
