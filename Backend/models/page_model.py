from typing import List

from pydantic import BaseModel

class NamedPage(BaseModel):
    name: str

class PageMetaData(NamedPage):
    creation: str
    last_modified: str

class PageWithContent(PageMetaData):
    content: str

class PageWithContentWithoutMetaData(NamedPage):
    content: str

class PageReferenceToRename(BaseModel):
    page_name: str

class PageRenameInfo(BaseModel):
    old_name: str
    new_name: str
    references_to_update: List[PageReferenceToRename]
