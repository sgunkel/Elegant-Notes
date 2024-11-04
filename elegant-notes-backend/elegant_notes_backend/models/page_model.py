from typing import List

from pydantic import BaseModel

from .block_model import BlockModel

class PageModel(BaseModel):
    name: str
    children: List[BlockModel]
