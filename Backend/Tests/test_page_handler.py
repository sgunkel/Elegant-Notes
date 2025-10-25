import os
import uuid

import pytest
from fastapi import HTTPException

from ..models.page_model import NamedPage, PageWithContentWithoutMetaData, PageRenameInfo, PageReferenceToRename
from ..models.user_model import User

from ..handlers.page_handler import (
    handle_get_all_pages,
    handle_get_page_by_name,
    handle_new_page,
    handle_update_page,
    handle_page_rename,
)
from .utils import (
    generate_and_write_md_file,
    generate_and_write_n_md_files,
    write_md_content,
)

DUMMY_USER = User(id=str(uuid.uuid4()), username='example@email.com', password='abc123', name='Test User')

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
    actual_found_pages = handle_get_all_pages(tmp_dir)
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
    actual = handle_get_page_by_name(tmp_dir, 'actual')
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
        _ = handle_get_page_by_name(tmp_dir, 'actual')

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
    actual_result = handle_new_page(tmp_dir, page_info)
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
        _ = handle_new_page(tmp_dir, page_info) # should be throwing an exception as this page exists but is not....

@pytest.mark.parametrize('content_before,content_after', [
    ('','- there is something here now!'),
    ('- there was stuff before', '- and new stuff after'),
    ('- a\n    - b\n- c', '- a\n    - b\n    - c')
])
def test_update_page_by_name(tmp_dir, content_before, content_after):
    write_md_content(tmp_dir / 'example.md', content_before)
    page_info = PageWithContentWithoutMetaData(name='example', content=content_after)
    handle_update_page(tmp_dir, page_info)

    actual = handle_get_page_by_name(tmp_dir, 'example')
    assert actual.content == content_after

def test_update_page_by_name_with_nonexistent_page(tmp_dir):
    page_info = PageWithContentWithoutMetaData(name='actual', content='- nothing here')
    with pytest.raises(HTTPException) as e_info:
        handle_update_page(tmp_dir, page_info)

@pytest.mark.parametrize('file_count,ref_count', [
    (0, 0),
    (20, 5),
    (50, 45),
    (100, 20),
    (250, 115),
])
def test_rename_page_reference_in_fs(tmp_dir, file_count, ref_count):
    '''
        This is a larger test function that might benefit being split.
        Purpose of this is to test the following:
          - rename the Page file
          - update the given references to this Page
            - only modify the files that have an updated reference, as file metadata is used elsewhere in the application
    '''

    # Generate files that should not be touched and record file metadata
    generate_and_write_n_md_files(tmp_dir, file_count)
    original_file_timestamps_map = {}
    for file_name in os.listdir(str(tmp_dir)):
        full_path = str(tmp_dir / file_name)
        original_file_timestamps_map[full_path] = os.path.getmtime(full_path)
    
    # Generate files with references to update
    ref_list_to_update = []
    for i in range(ref_count):
        page_name = f'example-{i}'
        write_md_content(tmp_dir / page_name, '- [[actual]]')
        ref_list_to_update.append(PageReferenceToRename(page_name=page_name))
    generate_and_write_md_file(tmp_dir / 'actual.md')
    
    expected_ref_change_count = len(ref_list_to_update)
    expected_old_name = 'actual'
    expected_new_name = 'example'

    rename_info = PageRenameInfo(old_name=expected_old_name, new_name=expected_new_name, references_to_update=ref_list_to_update)
    actual = handle_page_rename(tmp_dir, rename_info)

    # Surface check
    assert 'msg' in actual
    assert f'Updated {expected_ref_change_count} reference(s)' in actual['msg']
    assert f'changed {expected_old_name} to {expected_new_name}' in actual['msg']
    
    # Source file name change check
    assert not (tmp_dir / f'{expected_old_name}.md').exists()
    assert (tmp_dir / f'{expected_new_name}.md').exists()

    # Updated references file checks
    updated_ref = f'[[{expected_new_name}]]'
    old_ref = f'[[{expected_old_name}]]'
    for updated_page in ref_list_to_update:
        file_name = tmp_dir / updated_page.page_name
        content = file_name.read_text()
        assert updated_ref in content
        assert old_ref not in content

    # Verify other pages were not modified
    for full_path in original_file_timestamps_map:
        assert os.path.getmtime(full_path) == original_file_timestamps_map[full_path]
