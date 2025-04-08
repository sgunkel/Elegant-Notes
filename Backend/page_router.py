import os

from fastapi import APIRouter, HTTPException, status, Depends

from .config import get_pages_path
from .page_model import NamedPage, PageMetaData, PageWithContent, PageWithContentWithoutMetaData

router = APIRouter(
    prefix='/page',
    tags=['page'],
    responses={404: {'description': 'Not found'}},
)

PAGE_PATH = get_pages_path()
PAGE_PATH_STR = str(PAGE_PATH)

@router.get('/all')
def get_all_pages():
    file_names = os.listdir(PAGE_PATH_STR)
    pages = []
    for file_name in file_names:
        page = PageMetaData(name=file_name.replace('.md', ''), creation='n/a', last_modified='n/a')
        pages.append(page)
    return pages

@router.post('/create')
def new_page(page_info: NamedPage):
    new_file_path = PAGE_PATH / (page_info.name + '.md')
    if new_file_path.exists():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='File already exists.')
    open(str(new_file_path), 'a').close() # TODO find a better way to create an empty file
    return True

@router.get('/get/{page_name}')
def get_page_by_name(page_name: str):
    full_path = PAGE_PATH / (page_name + '.md')
    if not full_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='File not found')

    with open(str(full_path), 'r') as f:
        content = f.read()
    page = PageWithContent(
        name=page_name,
        creation='n/a',
        last_modified='n/a',
        content=content
    )
    return page

@router.post('/update')
def update_page(page_info: PageWithContentWithoutMetaData):
    full_path = PAGE_PATH / (page_info.name + '.md')
    if not full_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Page not found')

    with open(str(full_path), 'w') as f:
        f.write(page_info.content)
    return True
