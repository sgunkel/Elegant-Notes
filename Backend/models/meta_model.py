from typing import List

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

class PageLinkage(BaseModel):
    backlinks: List[BackLink]
    block_refs: List[BlockRef]

class ReferencesRetrievalRequest(BaseModel):
    page_name: str
    block_ids: List[str]
