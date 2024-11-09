from typing import List, Optional

from pydantic import BaseModel

from .block_model import BlockModel

class PageModel(BaseModel):
    name: str
    children: Optional[List[BlockModel]] # there can be a lot of children, so and is not needed for transfer every time

class PageModelWithID(PageModel):
    ID: str
