import uuid

import pytest

from ..handlers.meta_handler import (
    handle_get_all_references,
    handle_page_search,
    handle_block_search,
    handle_block_id_assignment,
)
from ..models.meta_model import BackLink, BackLinkReference, ReferencesRetrievalRequest
from .utils import (
    generate_and_write_md_file,
    generate_and_write_n_md_files,
    write_md_content
)

@pytest.fixture
def tmp_dir(tmp_path):
    return tmp_path

##
## Page Reference (Backlink) Retrieval Tests
##

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
def test_handle_get_all_references__find_x_backlinks_in_y_files(tmp_dir, ref_file_count, non_ref_file_count):
    # Setup environment
    generate_and_write_n_md_files(tmp_dir, non_ref_file_count)
    for i in range(ref_file_count):
        write_md_content(tmp_dir / f'example-{i}.md', '- [[actual]]')
    
    # Perform function action under testing
    request = ReferencesRetrievalRequest(page_name='actual', block_ids=[])
    actual_backlinks = handle_get_all_references(request, tmp_dir).backlinks

    # Verify results
    assert len(actual_backlinks) == ref_file_count

def test_handle_get_all_references__two_backlinks_in_one_file(tmp_dir):
    # Setup environment
    generate_and_write_n_md_files(tmp_dir, 5)
    write_md_content(tmp_dir / 'example.md', '- [[actual]]\n- [[actual]]')
    generate_and_write_md_file(tmp_dir / 'actual.md')

    # Perform function action under testing
    request = ReferencesRetrievalRequest(page_name='actual', block_ids=[])
    backlinks = handle_get_all_references(request, tmp_dir).backlinks

    # Verify results
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
def test_handle_get_all_references__expected_child_block_structure_equals_actual_child_block_structure(
        tmp_dir, expected_block_structure, add_blocks_before, add_blocks_after):
    # Setup environment
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
    
    # Perform function action under testing
    request = ReferencesRetrievalRequest(page_name='actual', block_ids=[])
    actual_backlinks = handle_get_all_references(request, tmp_dir).backlinks

    # Verify results
    assert len(actual_backlinks) == 1
    actual_backlink = actual_backlinks[0]
    assert len(actual_backlink.references) == len(expected_backlink.references)
    actual_reference = actual_backlink.references[0]
    assert len(actual_reference.children) == len(expected_block_structure)
    for i in range(len(expected_block_structure)):
        expected_child = expected_block_structure[i].rstrip('\n')
        actual_child = actual_reference.children[i].rstrip('\n')
        assert actual_child == expected_child

##
## Block Reference Retrieval Tests
##

@pytest.mark.parametrize('ref_file_count,non_ref_file_count', [
    (1, 5),
    (5, 0),
    (10, 5),
    (25, 100),
    (100, 25),
])
def test_handle_get_all_references__x_block_references_files_y_non_reference_files(
        tmp_dir, ref_file_count, non_ref_file_count):
    # Setup environment
    block_id = uuid.uuid4()
    page_ref_content = f'- (({block_id}))'
    file_names = []
    for i in range(ref_file_count):
        file_name = f'example-{i}.md'
        write_md_content(tmp_dir / file_name, page_ref_content)
        file_names.append(file_name)
    generate_and_write_n_md_files(tmp_dir, non_ref_file_count)
    page_with_block_def_content = f'- text to reference\n  id:: {block_id}\n'
    write_md_content(tmp_dir / 'actual.md', page_with_block_def_content)

    # Perform function action under testing
    block_id_list = [str(block_id)]
    request = ReferencesRetrievalRequest(page_name='actual', block_ids=block_id_list)
    block_refs = handle_get_all_references(request, tmp_dir).block_refs

    # Verify results
    assert len(block_refs) == ref_file_count
    for block_ref in block_refs:
        assert block_ref.block_id == str(block_id)
        assert (block_ref.source + '.md') in file_names

## Block references will most likely have more information in the future, so there'll likely be more tests on it later

###
### Page searching
###

@pytest.mark.parametrize('query,expected_results,similar_names', [
    ('A', ['Planning.md', 'Cleaning Tasks.md' 'Actual.md', 'Questions to ask.md', 'The answer to the universe.md'], []),
    ('as', ['Cleaning Tasks.md', 'Questions to ask.md'], ['Actual.md', 'Planning.md', 'The answer to the universe.md']),
    ('an', ['Planning.md', 'Cleaning Tasks.md', 'The answer to the universe.md'], ['Actual.md', 'Questions to ask.md']),
    ('to', ['The answer to the universe.md', 'Questions to ask.md', 'Tokens.md'], ['Planning.md', 'Cleaning Tasks.md', 'Actual.md']),
    ('To', ['The answer to the universe.md', 'Questions to ask.md', 'Tokens.md'], ['Planning.md', 'Cleaning Tasks.md', 'Actual.md']),
    ('oo', ['Tasty foods.md', 'Nasty food recipes.md', 'Tool Inventory.md'], ['OH GREAT HEAVENS moments.md']),
    ('dec', [f'Dec {day}.md' for day in range(31)], [])
])
def test_handle_page_search__query_and_expected_results_with_similar_page_names(tmp_dir, query, expected_results, similar_names):
    # Setup environment
    page_path = tmp_dir / 'pages'
    page_path.mkdir(parents=True, exist_ok=True)
    for i in range(50):
        write_md_content(page_path / f'nothing-{i}.md', '- nothing')
    for similar_name in similar_names:
        write_md_content(page_path / similar_name, '- close, but should not find me')
    for expected_file_name in expected_results:
        write_md_content(page_path / expected_file_name, '- should find me')

    # Perform function action under testing
    actual_results = handle_page_search(query, tmp_dir)

    # Verify results
    assert len(expected_results) == len(actual_results)
    for i in range(len(expected_results)):
        assert f'/pages/{expected_results[i]}' in actual_results

def test_handle_page_search__recursive_file_structure(tmp_dir):
    # Setup environment
    journals_path = tmp_dir / 'Journals'
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    for month in months:
        for journal_entry_name in [f'{month} {day}.md' for day in range(31)]: # in a world were all months have 31 days in them...
            path = journals_path / month
            path.mkdir(parents=True, exist_ok=True)
            write_md_content(path / journal_entry_name, '- What I did today:\n    - *nothing*')
    
    # Perform function action under testing
    jan_results = handle_page_search('jan', tmp_dir)
    fifteenth_of_the_months = handle_page_search('15', tmp_dir)
    no_journal_entries = handle_page_search('does not exist', tmp_dir)

    # Verify results
    assert len(jan_results) == 31
    assert len(fifteenth_of_the_months) == 12
    assert len(no_journal_entries) == 0
    for day in range(31):
        assert f'/Journals/Jan/Jan {day}.md' in jan_results
    for month in months:
        assert f'/Journals/{month}/{month} 15.md' in fifteenth_of_the_months
