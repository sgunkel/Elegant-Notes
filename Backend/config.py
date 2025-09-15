from pathlib import Path
import os

from .utilities.path_utils import create_path_if_not_exit

DEFAULT_DB_PATH = Path.home() / 'elegant-notes-db'
_db_path = DEFAULT_DB_PATH

def get_pages_path() -> Path:
    path = _db_path / 'pages'
    create_path_if_not_exit(path)
    return path

def set_db_path(new_path: Path) -> None:
    global _db_path
    _db_path = new_path

def reset_db_path() -> None:
    global _db_path
    _db_path = DEFAULT_DB_PATH
