from typing import List

from pydantic import BaseModel

class BackLinkReference(BaseModel):
    line: str
    line_number: int

class BackLink(BaseModel):
    page_name: str
    references: List[BackLinkReference]
