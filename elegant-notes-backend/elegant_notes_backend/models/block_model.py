from typing import List

from pydantic import BaseModel

class BlockModel(BaseModel):
    text: str
    parent_id: str
    children: List["BlockModel"]
