from fastapi import APIRouter, HTTPException

from ..models.page_model import PageModel
from ..database_api import get_db
from ..common import get_children

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
        return get_children(root_obj)
    except:
        raise HTTPException(status_code=404, detail='Page not found')

@router.post('/add')
def add_page(new_page: PageModel):
    return get_db().page_api.create(new_page.model_dump())
