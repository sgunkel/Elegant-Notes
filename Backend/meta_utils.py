import os
import re
from typing import List, Optional
from pathlib import Path

from .config import get_pages_path
from .meta_model import BackLink, BackLinkReference

def get_back_links_by_page_name(page_name: str, page_path: Optional[Path] = None) -> List[BackLink]:
    all_back_links = []
    if page_path is None:
        page_path = get_pages_path()
    page_path_str = str(page_path)
    for file_name in os.listdir(page_path_str):
        path = str(page_path / file_name)
        references = __extract_references_from_page(path, page_name)
        if len(references) != 0:
            name = os.path.basename(path).replace('.md', '')
            new_back_link = BackLink(page_name=name, references=references)
            all_back_links.append(new_back_link)
    return all_back_links # maybe use `sorted` and sort by page names..?

def __extract_references_from_page(path: str, page_name: str) -> List[BackLinkReference]:
    with open(path) as f:
        content = f.readlines()
    
    all_references = []
    line_number = 1
    for line in content:
        line_offset = line_number - 1
        rest = content[line_offset:]
        extracted = __extract_back_links_from_line(page_name, line, line_number, rest)
        all_references.extend(extracted)
        line_number += 1
    return all_references

def __extract_back_links_from_line(page_name: str, line: str, line_number: int, remaining_lines: List[str]) -> List[BackLinkReference]:
    matches = re.findall(r"\[\[.*?\]\]", line)
    return __extract_back_link_from_reference(matches, page_name, line, line_number, remaining_lines)

def __extract_back_link_from_reference(matches: List[str], page_name: str, line: str, line_number: int, remaining_lines: List[str]) -> List[BackLinkReference]:
    references = []
    for ref_match in matches:
        back_link_name = re.sub(r"(\[\[|\]\])", "", ref_match)
        if back_link_name == page_name:
            children = __extract_block_children(line, remaining_lines)
            reference = BackLinkReference(line=line, line_number=line_number, children=children)
            references.append(reference)
    return references

# should be generic enough for both Block and Page (back-link) references
def __extract_block_children(current_line: str, remaining_lines: List[str]) -> List[str]:
    children = []
    indention_start = __extract_indention_start(current_line)
    indention_start_length = len(indention_start)
    for line in remaining_lines[1:]: # remaining_lines includes current_line, so we just skip it
        child_indention = __extract_indention_start(line)
        if len(child_indention) <= indention_start_length:
            break
        children.append(line)
    return children

def __extract_indention_start(line: str) -> str:
    return re.match(r'^\s*', line).group()
