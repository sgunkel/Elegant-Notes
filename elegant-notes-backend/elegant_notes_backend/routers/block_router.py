from typing import Annotated

from fastapi import APIRouter, HTTPException, status, Depends

from ..models.block_model import BlockModel, BlockModelWithID
from ..models.user_model import UserModel
from ..database_api import get_db
from ..common import get_children
from ..security.authentication import get_current_active_user

router = APIRouter(
    prefix='/block',
    tags=['block'],
    responses={404: {'description': 'Not found'}},
)

# this should definitely be removed and not added for production...
@router.get('/all')
def get_all_blocks(_: Annotated[UserModel, Depends(get_current_active_user)]):
    return get_db().block_api.retrieve_all()

@router.get('/{block_id}')
def get_block_by_id(_: Annotated[UserModel, Depends(get_current_active_user)], block_id: str):
    try:
        root_obj = get_db().block_api.retrieve_by_id(f'Block/{block_id}')
        root_obj['children'] = get_children(root_obj)
        return root_obj
    except:
        raise HTTPException(status_code=404, detail='Block not found')

@router.post('/add')
def add_block(_: Annotated[UserModel, Depends(get_current_active_user)], new_block: BlockModel):
    db = get_db()
    raw_block = new_block.model_dump()
    parent_id = raw_block['parent_id']
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

@router.put('/update')
def update_block(_: Annotated[UserModel, Depends(get_current_active_user)], new_version: BlockModelWithID):
    db = get_db()
    raw_block = new_version.model_dump()
    raw_block['@id'] = raw_block.pop('ID')
    raw_block['@type'] = 'Block'
    return db.block_api.update(raw_block)

@router.delete('/delete')
def delete_block(_: Annotated[UserModel, Depends(get_current_active_user)], block_id: str):
    db = get_db()
    block_id = f'Block/{block_id}' # cannot send it like this via URL
    raw_block = db.block_api.retrieve_by_id(block_id)
    if len(raw_block['children']) != 0:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Block has children')

    parent_id = raw_block['parent_id']
    if parent_id.startswith('Page'):
        page_raw = db.page_api.retrieve_by_id(parent_id)
        page_raw['children'].remove(block_id)
        db.page_api.update(page_raw)
    else:
        parent_block_raw = db.block_api.retrieve_by_id(parent_id)
        parent_block_raw['children'].remove(block_id)
        db.block_api.update(parent_block_raw)
    db.block_api.delete(block_id)
    return {'message': f'Deleted {block_id} and updated parent {parent_id}'}
