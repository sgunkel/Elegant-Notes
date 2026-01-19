from typing import List, Optional

from pydantic import BaseModel

class BackLinkReference(BaseModel):
    line: str
    line_number: int
    children: List[str]

class BackLink(BaseModel):
    page_name: str
    references: List[BackLinkReference]

class BlockRef(BaseModel):
    block_id: str
    source: str
    line_index: int

class PageLinkage(BaseModel):
    backlinks: List[BackLink]
    block_refs: List[BlockRef]

class ReferencesRetrievalRequest(BaseModel):
    page_name: str
    block_ids: List[str]

class ReferenceSearchQuery(BaseModel):
    query: str

class BlockSearchResult(BaseModel):
    block_id: Optional[str]
    block_text: str
    line_number: int
    page_name: str
