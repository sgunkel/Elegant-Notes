from pathlib import Path
import os

DEFAULT_DB_PATH = Path.home() / 'elegant-notes-db'
_db_path = DEFAULT_DB_PATH

def __create_path_if_not_exit(path: Path) -> None:
    if not path.exists():
        os.makedirs(str(path))

def get_pages_path() -> Path:
    path = _db_path / 'pages'
    __create_path_if_not_exit(path)
    return path

def set_db_path(new_path: Path) -> None:
    global _db_path
    _db_path = new_path

def reset_db_path() -> None:
    global _db_path
    _db_path = DEFAULT_DB_PATH
