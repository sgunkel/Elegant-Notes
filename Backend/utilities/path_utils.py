import os
from pathlib import Path

# moved here as there is a lot of circular importing going on
def create_path_if_not_exit(path: Path) -> None:
    if not path.exists():
        os.makedirs(str(path))
