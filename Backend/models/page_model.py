
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
