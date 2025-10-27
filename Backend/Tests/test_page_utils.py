
import pytest

from ..utilities.page_utils import rename_page_references_in_str

@pytest.fixture
def tmp_dir(tmp_path):
    return tmp_path

@pytest.mark.parametrize('old_name,new_name,original_content,replaced_content', [
    ('', '', '', ''),
    ('a', 'b', '', ''),
    ('a', 'b', 'stuff', 'stuff'),

    ('a', 'b', '[[a]]', '[[b]]'),
    ('a', 'b', 'blah blah [[a]] blah blah', 'blah blah [[b]] blah blah'),
    ('a', 'b', 'blah blah [[b]] blah blah', 'blah blah [[b]] blah blah'),
    
    ('a', 'b', '[[a]] blah blah [[a]] blah [[a]] [[a]]', '[[b]] blah blah [[b]] blah [[b]] [[b]]'),
    ('a', 'b', '[[a]] [[b]] [[c]]', '[[b]] [[b]] [[c]]'),

    ('a', 'b', '[[a]]\n\t[[a]] [[b]]\n\t\t[[c]] [[b]] [[a]]\n', '[[b]]\n\t[[b]] [[b]]\n\t\t[[c]] [[b]] [[b]]\n')
])
def test_rename_page_reference_in_str(tmp_dir, old_name, new_name, original_content, replaced_content):
    actual = rename_page_references_in_str(old_name, new_name, original_content)
    assert actual == replaced_content

