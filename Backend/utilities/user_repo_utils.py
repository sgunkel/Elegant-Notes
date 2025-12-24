from typing import Generator
from pathlib import Path

from ..models.user_model import User
from ..config import get_pages_path
from .path_utils import create_path_if_not_exit

USERS_DIR = 'users'
ELEGANT_NOTES_REPO_DIRS = [
    USERS_DIR,
]

''' Note that this matches how Logseq structures their repository of information '''
USER_ROOT_REPO_DIRS = [
    'assets',      # images, PDFs, docs, etc.
    'pages',       # random .md files for relational linking (tasks, subjects, ideas, etc.)
    'journals',    # .md files with date/time stamps for daily notes/linkage to subjects
                   #   and projects defined in the pages/ directory
]

def get_repo_path() -> Path:
    path = get_pages_path().parent
    create_path_if_not_exit(path)
    return path

def get_user_repo_path(user: User, root_repo_path: Path = get_repo_path()) -> Path:
    '''## Get the path to the user's root folder
    **NOTE:** this will create the path if it does not exist'''
    user_path = root_repo_path / USERS_DIR / user.id
    create_path_if_not_exit(user_path)
    return user_path

def get_page_objects(user_repo_path: Path) -> Generator[Path, None, None]:
    return user_repo_path.rglob('*.md')

def get_user_pages_path(user: User, root_repo_path: Path = get_repo_path()) -> Path:
    pages_path = get_user_repo_path(user, root_repo_path) / 'pages'
    create_path_if_not_exit(pages_path)
    return pages_path

def create_user_repo(repo_path: Path, new_user: User):
    user_directory_name = new_user.id
    user_repo_path = repo_path / 'users' / user_directory_name
    for dir in [repo_path, user_repo_path] + USER_ROOT_REPO_DIRS:
        create_path_if_not_exit(user_repo_path / dir)
