import pytest
from fastapi import HTTPException

from ..models.page_model import NamedPage, PageWithContentWithoutMetaData
from ..models.user_model import User

from ..handlers.page_handler import (
    handle_get_all_pages,
    handle_get_page_by_name,
    handle_new_page,
    handle_update_page,
)
from .utils import (
    generate_and_write_md_file,
    generate_and_write_n_md_files,
    write_md_content,
)

DUMMY_USER = User(username='example@email.com', password='abc123', name='Test User')

@pytest.fixture
def tmp_dir(tmp_path):
    return tmp_path

@pytest.mark.parametrize('page_count', [
    0,
    5,
    25,
    100,
    250
])
def test_get_all_pages_count(tmp_dir, page_count):
    generate_and_write_n_md_files(tmp_dir, page_count)
    actual_found_pages = handle_get_all_pages(tmp_dir, DUMMY_USER)
    assert len(actual_found_pages) == page_count

@pytest.mark.parametrize('other_pages_count', [
    0,
    5,
    10,
    50,
    100,
    250,
])
def test_get_page_by_name(tmp_dir, other_pages_count):
    generate_and_write_n_md_files(tmp_dir, other_pages_count)
    generate_and_write_md_file(tmp_dir / 'actual.md')
    actual = handle_get_page_by_name(tmp_dir, 'actual', DUMMY_USER)
    assert actual.name == 'actual'

@pytest.mark.parametrize('other_pages_count', [
    0,
    5,
    10,
    50,
    100,
    250,
])
def test_get_page_by_name_with_nonexistant_file(tmp_dir, other_pages_count):
    generate_and_write_n_md_files(tmp_dir, other_pages_count)
    with pytest.raises(HTTPException) as e_info:
        _ = handle_get_page_by_name(tmp_dir, 'actual', DUMMY_USER)

@pytest.mark.parametrize('other_pages_count', [
    0,
    5,
    10,
    50,
    100,
    250,
])
def test_new_page(tmp_dir, other_pages_count):
    generate_and_write_n_md_files(tmp_dir, other_pages_count)
    page_info = NamedPage(name='actual.md')
    actual_result = handle_new_page(tmp_dir, page_info, DUMMY_USER)
    assert actual_result == True

@pytest.mark.skip(reason='This does not work as expected, and will be investigated after restructure')
@pytest.mark.parametrize('other_pages_count', [
    0,
    5,
    10,
    50,
    100,
    250,
])
def test_new_page_with_existing_name(tmp_dir, other_pages_count):
    generate_and_write_n_md_files(tmp_dir, other_pages_count)
    generate_and_write_md_file(tmp_dir / 'actual.md')
    page_info = NamedPage(name='actual.md')
    with pytest.raises(HTTPException) as e_info:
        _ = handle_new_page(tmp_dir, page_info, DUMMY_USER) # should be throwing an exception as this page exists but is not....

@pytest.mark.parametrize('content_before,content_after', [
    ('','- there is something here now!'),
    ('- there was stuff before', '- and new stuff after'),
    ('- a\n    - b\n- c', '- a\n    - b\n    - c')
])
def test_update_page_by_name(tmp_dir, content_before, content_after):
    write_md_content(tmp_dir / 'example.md', content_before) # y dis no werk????
    page_info = PageWithContentWithoutMetaData(name='example', content=content_after)
    handle_update_page(tmp_dir, page_info, DUMMY_USER)

    actual = handle_get_page_by_name(tmp_dir, 'example', DUMMY_USER)
    assert actual.content == content_after

def test_update_page_by_name_with_nonexistent_page(tmp_dir):
    page_info = PageWithContentWithoutMetaData(name='actual', content='- nothing here')
    with pytest.raises(HTTPException) as e_info:
        handle_update_page(tmp_dir, page_info, DUMMY_USER)
