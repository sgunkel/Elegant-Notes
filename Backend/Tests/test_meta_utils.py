import pytest

from .utils import generate_random_md_file, generate_and_write_md_file, generate_and_write_n_md_files, write_md_content
from ..meta_utils import get_back_links_by_page_name
from ..meta_model import BackLink, BackLinkReference

'''
    check if pytest has something like what vitest has where we pass multiple options to a single
        function and it tests against those values instead of multiple duplicated functions here
    otherwise, this should be good to commit & push
'''

@pytest.fixture
def tmp_dir(tmp_path):
    return tmp_path

'''
    Test finding Page references in large quantities of Pages
'''
@pytest.mark.parametrize('ref_file_count,non_ref_file_count', [
    (0, 5),
    (5, 0),
    (5, 10),
    (10, 5),
    (25, 100),
    (100, 25),
])
def test_n_backlinks(tmp_dir, ref_file_count, non_ref_file_count):
    generate_and_write_n_md_files(tmp_dir, non_ref_file_count)
    for i in range(ref_file_count):
        write_md_content(tmp_dir / f'example-{i}', '- [[actual]]')
    actual_references = get_back_links_by_page_name('actual', tmp_dir)
    assert len(actual_references) == ref_file_count

def test_double_backlinks_same_file(tmp_path):
    generate_and_write_n_md_files(tmp_path, 5)
    write_md_content(tmp_path / 'example.md', '- [[actual]]\n- [[actual]]')
    generate_and_write_md_file(tmp_path / 'actual.md')
    backlinks = get_back_links_by_page_name('actual', tmp_path)
    assert len(backlinks) == 1

    backlink = backlinks[0]
    assert backlink.page_name == 'example'
    assert len(backlink.references) == 2

    for i in range(2):
        reference = backlink.references[i]
        assert reference.line.rstrip() == '- [[actual]]'
        assert reference.line_number == i + 1
        assert len(reference.children) == 0

'''
    Test finding references with appropriate Block children (those indented after the referenced Page)
'''
@pytest.mark.parametrize('expected_block_structure,add_blocks_before,add_blocks_after', [
    ([
        '    - a',
        '    - b',
        '    - c',
    ], False, False),
    ([
        '    - a',
        '',
        '    - b',
        '    - c',
    ], False, False),
    ([
        '    - a',
        '        - b',
        '        - c',
        '    - d',
    ], False, False),
    ([
        '    - a',
        '    - b',
        '    - c',
    ], True, False),
    ([
        '    - a',
        '        - b',
        '    - c',
    ], False, True),
    ([
        '    - a',
        '        - b',
        '    - c',
    ], True, True),
])
def test_block_structures(tmp_dir, expected_block_structure, add_blocks_before, add_blocks_after):
    expected_children_str = '\n'.join(expected_block_structure)
    file_content = ''
    expected_line_number = 2
    if add_blocks_before:
        file_content += '''
- abc
    - def
    - ghi
'''
        expected_line_number += 4

    file_content += f'- [[actual]]\n{expected_children_str}'
    if add_blocks_after:
        file_content += '''
- jkl
    - mno
    - pqr
'''

    write_md_content(tmp_dir / 'example.md', file_content)
    expected_references = [
        BackLinkReference(line='- [[actual]]', line_number=expected_line_number, children=expected_block_structure),
    ]
    expected_backlink = BackLink(page_name='example', references=expected_references)
    generate_and_write_n_md_files(tmp_dir, 15)
    actual_backlinks = get_back_links_by_page_name('actual', tmp_dir)
    assert len(actual_backlinks) == 1

    actual_backlink = actual_backlinks[0]
    assert len(actual_backlink.references) == len(expected_backlink.references)
    
    actual_reference = actual_backlink.references[0]
    assert len(actual_reference.children) == len(expected_block_structure)
    for i in range(len(expected_block_structure)):
        expected_child = expected_block_structure[i].rstrip('\n')
        actual_child = actual_reference.children[i].rstrip('\n')
        assert actual_child == expected_child
