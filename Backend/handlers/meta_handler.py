from typing import Optional, List
from pathlib import Path

from ..models.meta_model import BackLink
from ..utilities.meta_utils import get_back_links_by_page_name

def handle_get_backlinks(page_name: str, page_path: Optional[Path] = None) -> List[BackLink]:
    return get_back_links_by_page_name(page_name, page_path)
