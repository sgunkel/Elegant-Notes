from pathlib import Path
import os

DB_PATH = Path.home() / 'elegant-notes-db'

def __create_path_if_not_exit(path: Path) -> None:
    if not path.exists():
        os.makedirs(str(path))

def get_pages_path() -> Path:
    path = DB_PATH / 'pages'
    __create_path_if_not_exit(path)
    return path
