import re
from typing import List, Dict, Optional
from pathlib import Path

from ..models.meta_model import (
    BackLink,
    BackLinkReference,
    PageLinkage,
    BlockRef,
    BlockSearchResult
)

class References:
    def __init__(self):
        self._backlinks_map: Dict[str, BackLink] = {}
        self._block_refs: List[BlockRef] = []
        # TODO make this thread safe when we parallelize everything later - the whole point of abstracting this instead of using meta_model.PageLinkage directly
    
    def add_backlink(self, backlink: BackLink) -> None:
        if backlink.page_name in self._backlinks_map:
            self._backlinks_map[backlink.page_name].references.extend(backlink.references)
        else:
            self._backlinks_map[backlink.page_name] = backlink
    
    def add_block_ref(self, block_ref: BlockRef) -> None:
        self._block_refs.append(block_ref)
    
    def to_model(self) -> PageLinkage:
        return PageLinkage(backlinks=self._backlinks_map.values(), block_refs=self._block_refs)

class ReferenceExtractor:
    '''## Base reference extraction class
    Used for extracting types of references (Backlink, Block, etc.) in inherited classes'''
    def extract(self, text: str, active_page_name: str, line_index: int, remaining: List[str], collected: References) -> None:
        '''## Reference Extraction
        Extract a reference from text (if any) and add it to the collection'''
        raise Exception('Use inherited classes instead of base')

class BacklinkExtractor(ReferenceExtractor):
    def __init__(self, src_page_name: str):
        self._src_page_name: str = src_page_name.replace('.md', '')

    def extract(self, text: str, active_page_name: str, line_index: int, remaining: List[str], collected: References) -> None:
        matches = self._get_backlink_matches(text)
        for match in matches:
            backlink_name = self._get_backlink_name_from_match(match)
            if backlink_name == self._src_page_name:
                children = extract_block_children(text, remaining)
                references = [BackLinkReference(line=text, line_number=line_index, children=children)]
                backlink = BackLink(page_name=active_page_name, references=references)
                collected.add_backlink(backlink) # automatically groups references by page
    
    def _get_backlink_matches(self, text: str):
        return re.findall(r"\[\[.*?\]\]", text)
    
    def _get_backlink_name_from_match(self, match) -> str:
        return re.sub(r"(\[\[|\]\])", "", match)

class BlockReferenceExtractor(ReferenceExtractor):
    def __init__(self, block_ids: List[str]):
        self._block_ids: List[str] = block_ids
        self._match_pattern_str = self._generate_match_regex_str(block_ids)
    
    def extract(self, text: str, active_page_name: str, line_index: int, remaining: List[str], collected: References) -> None:
        # TODO do we want to collect more information here, like the location and any children, or handle that on the frontend?
        for match in self._get_block_matches(text):
            block_id = self._extract_id(match)
            if f'id:: {block_id}' in text:
                return # just a line that indicates the reference assigned to a Block
            if block_id in self._block_ids:
                ref = BlockRef(block_id=block_id, source=active_page_name)
                collected.add_block_ref(ref)
    
    def _generate_match_regex_str(self, block_ids: List[str]) -> str:
        # (
        #   '((' <Block IDs separated by OR - "|" - characters> '))'
        # )
        # e.g. "(\(\(46d04659-f692-4ffc-b4ca-153a0b4468c8|41ef96b7-3dcd-425a-9312-7b47bebee7ec\)\))"gm
        return r'(\(\(' + r'|'.join(block_ids) + r'\)\))'
    
    def _get_block_matches(self, text: str):
        return re.findall(self._match_pattern_str, text)
    
    def _extract_id(self, match: str) -> str:
        return re.sub(r'(\(\(|\)\))', '', match)

## TODO Add Tag reference extraction

class ReferenceLocator:
    def __init__(self, user_path: Path, page_path: Path, block_ids: List[str]):
        self._user_path: Path = user_path
        self._page_path: Path = page_path
        self._block_ids: List[str] = block_ids
        self._ref_extractors: List[ReferenceExtractor] = []
        self._refs = References()
    
    def _setup(self) -> None:
        self._ref_extractors.append(BacklinkExtractor(self._page_path.name))
        self._ref_extractors.append(BlockReferenceExtractor(self._block_ids))
        # TODO Add Tag reference extraction
    
    def retrieve_all_relationships(self) -> PageLinkage:
        self._setup()
        for page in self._get_all_files_in_repo():
            self._process_file(page)
        return self._refs.to_model()
    
    def _get_all_files_in_repo(self):
        return self._user_path.rglob('*.md')
    
    def _process_file(self, path: Path) -> None:
        with open(str(path), 'r') as f:
            lines = f.readlines()
        line_index = 0
        for line in lines:
            for extractor in self._ref_extractors:
                # TODO use a more efficient way when slicing `lines` that does not create a new list everything time
                extractor.extract(line, path.name.replace('.md', ''), line_index + 1, lines[line_index:], self._refs)
            line_index += 1

def search_blocks(query: str, page_path: Path) -> List[BlockSearchResult]:
    block_list: List[BlockSearchResult] = []
    last_block: Optional[BlockSearchResult]
    content = page_path.read_text()
    line_number = 1
    for line in content.splitlines():
        if query.lower() in line.lower():
            last_block = BlockSearchResult(block_id=None, block_text=line, line_number=line_number, page_name=page_path.name)
            block_list.append(last_block)
        elif 'id::' in line and last_block is not None:
            last_block.block_id = line.split('id::')[1].strip()
        else:
            last_block = None
        line_number += 1
    return block_list

# should be generic enough for both Block and Page (back-link) references
def extract_block_children(current_line: str, remaining_lines: List[str]) -> List[str]:
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
