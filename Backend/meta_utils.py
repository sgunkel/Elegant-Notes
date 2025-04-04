import os
import re
from typing import List

from .config import get_pages_path
from .page_model import NamedPage
from .meta_model import BackLink, BackLinkReference

PAGE_PATH = get_pages_path()
PAGE_PATH_STR = str(PAGE_PATH)

def get_back_links_by_page_name(page_name: str) -> List[BackLink]:
    all_back_links = []
    for file_name in os.listdir(PAGE_PATH_STR):
        path = str(PAGE_PATH / file_name)
        references = __extract_references_from_page(path, page_name)
        if len(references) != 0:
            name = os.path.basename(path).replace('.md', '')
            new_back_link = BackLink(page_name=name, references=references)
            all_back_links.append(new_back_link)
    return all_back_links

def __extract_references_from_page(path: str, page_name: str) -> List[BackLinkReference]:
    with open(path) as f:
        content = f.readlines()
    
    all_references = []
    line_number = 0
    for line in content:
        extracted = __extract_back_links_from_line(page_name, line, line_number)
        all_references.extend(extracted)
        line_number += 1
    return all_references

def __extract_back_links_from_line(page_name: str, line: str, line_number: int) -> List[BackLinkReference]:
    matches = re.findall(r"\[\[.*?\]\]", line)
    return __extract_back_link_from_reference(matches, page_name, line, line_number)

def __extract_back_link_from_reference(matches: List[str], page_name: str, line: str, line_number: int) -> List[BackLinkReference]:
    references = []
    for ref_match in matches:
        back_link_name = re.sub(r"(\[\[|\]\])", "", ref_match)
        if back_link_name == page_name:
            reference = BackLinkReference(line=line, line_number=line_number)
            references.append(reference)
    return references
