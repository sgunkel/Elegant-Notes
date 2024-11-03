from typing import List

from fastapi import FastAPI
from pydantic import BaseModel

from elegant_notes_database.db_maker import make_db

app = FastAPI()
db = make_db()

class BlockModel(BaseModel):
    text: str
    parent_id: str
    children: List["BlockModel"]

class PageModel(BaseModel):
    name: str
    children: List[BlockModel]

def get_children(raw_obj):
    children = []
    for child_id in raw_obj['children']:
        if child_id.startswith('Page'):
            child = db.page_api.retrieve_by_id(child_id)
        else:
            child = db.block_api.retrieve_by_id(child_id)
        
        child['children'] = get_children(child)
        children.append(child)
    return children

@app.get('/pages')
def get_all_pages():
    bulk = []
    for raw_page in db.page_api.retrieve_all():
        raw_page['children'] = get_children(raw_page)
        bulk.append(raw_page)
    return bulk

@app.post('/pages/add')
def add_page(new_page: PageModel):
    return db.page_api.create(new_page.model_dump())

@app.get('/blocks')
def get_all_blocks():
    bulk = []
    for raw_block in db.block_api.retrieve_all():
        raw_block['children'] = get_children(raw_block)
        bulk.append(raw_block)
    return bulk

@app.post('/blocks/add')
def add_block(new_block: BlockModel):
    raw_block = new_block.model_dump()
    parent_id = raw_block.pop('parent_id')
    created_id = db.block_api.create(raw_block)
    created = db.block_api.retrieve_by_id(created_id)

    if parent_id.startswith('Page'):
        page = db.page_api.retrieve_by_id(parent_id)
        page['children'].append(created)
        edited = db.page_api.update(page)
    else:
        block = db.block_api.retrieve_by_id(parent_id)
        block['children'].append(created)
        edited = db.block_api.update(block)
    return {'created': created, 'edited': edited}
