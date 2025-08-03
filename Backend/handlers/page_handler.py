import os
from pathlib import Path

from fastapi import HTTPException, status

from ..models.page_model import (
    PageMetaData,
    PageWithContentWithoutMetaData,
    NamedPage,
    PageWithContent
)

def handle_get_all_pages(page_path: Path):
    file_names = os.listdir(str(page_path))
    pages = []
    for file_name in file_names:
        page = PageMetaData(name=file_name.replace('.md', ''), creation='n/a', last_modified='n/a')
        pages.append(page)
    return pages

def handle_new_page(page_path: Path, page_info: NamedPage):
    new_file_path = page_path / (page_info.name + '.md')
    if new_file_path.exists():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='File already exists.')
    open(str(new_file_path), 'a').close() # TODO find a better way to create an empty file
    return True

def handle_get_page_by_name(page_path: Path, page_name: str):
    full_path = page_path / (page_name + '.md')
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

def handle_update_page(page_path: Path, page_info: PageWithContentWithoutMetaData):
    full_path = page_path / (page_info.name + '.md')
    if not full_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Page not found')

    with open(str(full_path), 'w') as f:
        f.write(page_info.content)
    return True
