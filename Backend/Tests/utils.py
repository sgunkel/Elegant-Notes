from pathlib import Path
from typing import Optional, Tuple
from random import randint, choice
import string
import tempfile

''' TODO add some docs on this stuff'''

def generate_random_md_file(page_dir: Path) -> Path:
    tmp_file = Path(tempfile.mkstemp(dir=page_dir, suffix='.md')[1])
    tmp_file.touch()
    return tmp_file

def generate_line_content(indention_level: int = 0, content_length: Optional[int] = None) -> str:
    indention = ((' ' * 4) * indention_level)
    if content_length is None:
        content_length = randint(1, 200)
    letters = string.ascii_letters + '           ' # lot of spaces = better chance of inserting it more
    nonsense = ''.join(choice(letters) for _ in range(content_length))
    return f'{indention}- {nonsense}'

def write_md_content(page_path: Path, content: str) -> None:
    page_path.touch()
    page_path.write_text(content)

def generate_and_write_md_file(page_path: Path, root_child_count: Optional[int] = None) -> Path:
    if page_path.is_dir():
        page_path = generate_random_md_file(page_path)
    if root_child_count is None:
        root_child_count = randint(5, 50)
    page_content = '\n'.join(generate_line_content() for _ in range(root_child_count))
    write_md_content(page_path, page_content)
    return page_path

def generate_and_write_n_md_files(pages_path: Path, file_count: int, root_child_range: Optional[Tuple[int, int]] = None):
    for _ in range(file_count):
        block_count = None
        if root_child_range is not None:
            block_count = randint(root_child_range[0], root_child_range[1])
        generate_and_write_md_file(pages_path, root_child_count=block_count)
