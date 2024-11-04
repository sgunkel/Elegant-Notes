from fastapi import APIRouter, HTTPException

from ..models.block_model import BlockModel
from ..database_api import get_db
from ..common import get_children

router = APIRouter(
    prefix='/block',
    tags=['block'],
    responses={404: {'description': 'Not found'}},
)

@router.get('/all')
def get_all_blocks():
    return get_db().block_api.retrieve_all()

@router.get('/{block_id}')
def get_block_by_id(block_id: str):
    try:
        root_obj = get_db().block_api.retrieve_by_id(f'Block/{block_id}')
        return get_children(root_obj)
    except:
        raise HTTPException(status_code=404, detail='Block not found')

@router.post('/add')
def add_block(new_block: BlockModel):
    db = get_db()
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
