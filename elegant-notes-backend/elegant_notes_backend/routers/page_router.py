from fastapi import APIRouter, HTTPException

from ..models.page_model import PageModel, PageModelWithID
from ..database_api import get_db
from ..common import get_children, nuke_all_blocks_from_page

router = APIRouter(
    prefix='/page',
    tags=['page'],
    responses={404: {'description': 'Not found'}},
)

@router.get('/all')
def get_all_pages():
    bulk = []
    for raw_page in get_db().page_api.retrieve_all():
        raw_page['children'] = get_children(raw_page)
        bulk.append(raw_page)
    return bulk

@router.get('/{page_id}')
def get_by_id(page_id: str):
    try:
        root_obj = get_db().page_api.retrieve_by_id(f'Page/{page_id}')
        root_obj['children'] = get_children(root_obj)
        return root_obj
    except:
        raise HTTPException(status_code=404, detail='Page not found')

@router.post('/add')
def add_page(new_page: PageModel):
    return get_db().page_api.create(new_page.model_dump())

@router.put('/update')
def update_page(new_version: PageModelWithID):
    db = get_db()
    raw_page = new_version.model_dump()
    raw_page['@id'] = raw_page.pop('ID')
    raw_page['@type'] = 'Page'
    if new_version.children is None:
        page_from_db = db.page_api.retrieve_by_id(raw_page['@id'])
        raw_page['children'] = page_from_db['children']
    return db.page_api.update(raw_page)

@router.delete('/delete')
def delete_page(page_id: str):
    db = get_db()
    page_id = f'Page/{page_id}'
    page_raw = db.page_api.retrieve_by_id(page_id)
    children = page_raw['children']
    page_raw['children'] = []
    db.page_api.update(page_raw)
    blocks_removed_count = nuke_all_blocks_from_page(children)
    db.page_api.delete(page_id)
    return {'message': f'Removed Page/{page_id} and its {blocks_removed_count} children'}
