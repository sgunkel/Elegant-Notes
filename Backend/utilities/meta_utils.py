import re
from typing import List, Dict, Optional, Tuple
from pathlib import Path

from ..models.meta_model import (
    PageLinkage,
    BlockSearchResult,
    RefMetadata,
    PageMetadata,
)

ID_ASSIGNMENT_CHECK_REGEX = r'id:: \w+-\w+-\w+-\w+-\w+' # looks for: `id:: <UUID>`
def is_line_block_id_assignment(text: str) -> bool:
    return re.search(ID_ASSIGNMENT_CHECK_REGEX, text) != None

def extract_text_ref_metadata(search_pattern: str, ref_text_extraction_pattern: str, text: str) -> List[Tuple[str, int, int]]:
    '''## Extract metadata about a reference
    **Note:** The start/end positions include the reference open/close pair (if applicable)'''
    all_results = []
    found = re.finditer(search_pattern, text)
    for item in found:
        ref_text = re.sub(ref_text_extraction_pattern, '', item.group())
        (ref_start, ref_end) = item.span()
        result = (ref_text, ref_start, ref_end)
        all_results.append(result)
    return all_results

class References:
    def __init__(self):
        self._ref_map: Dict[str, PageMetadata] = {}
        # TODO make this thread safe when we parallelize everything later - the whole point of abstracting this instead of using meta_model.PageLinkage directly
    
    def register_page(self, page_name: str, content: str) -> None:
        '''## Register a Page object to receive references
        This should be called *before* processing a Page's file content
        '''
        if page_name not in self._ref_map:
            self._ref_map[page_name] = PageMetadata(page_name=page_name, content=content, blocks=[], backlinks=[])
        else:
            msg = f'Page already registered: "{page_name}" - '
            if self._ref_map[page_name].content == content:
                msg += 'identical file content'
            else:
                msg += 'file content are different'
            print(msg) # TODO replace with proper logger
    
    def remove_if_no_references(self, page_name: str):
        '''## Remove a page entry if it does not have any references
        This should be called *after* processing a Page's file content.
        '''
        if page_name not in self._ref_map:
            # TODO should log this
            print(f'"{page_name}" not registered when attempting to de-register!')
        else:
            metadata = self._ref_map[page_name]
            if len(metadata.backlinks) == 0 and len(metadata.blocks) == 0:
                self._ref_map.pop(page_name)

    def add_backlink(self, page_name: str, backlink: RefMetadata) -> None:
        if page_name in self._ref_map:
            self._ref_map[page_name].backlinks.append(backlink)
        else:
            # TODO log this below
            print(f'Attempted to add a Backlink to a page ("{page_name}") not registered')

    def add_block_ref(self, page_name: str, block_ref: RefMetadata) -> None:
        if page_name in self._ref_map:
            self._ref_map[page_name].blocks.append(block_ref)
        else:
            # TODO log this below
            print(f'Attempted to add a Block to a page ("{page_name}") not registered')
    
    def to_model(self) -> PageLinkage:
        return PageLinkage(references=self._ref_map.values())
    
class ReferenceExtractionMetadata:
    def __init__(self, page_to_find_name: str, active_page_name: str, all_lines: List[str]):
        self._page_name_to_find = page_to_find_name
        self._active_page_name = active_page_name
        self._line_idx = 0
        self._block_idx = -1
        self._can_advance_block_idx = True # Use case: a Block can reference multiple Blocks, and we advance the Block index if the text is not the Block's UUID line
        self._remaining_lines = all_lines
    
    def get_page_name_to_find(self) -> str:
        return self._page_name_to_find
    
    def get_active_page_name(self) -> str:
        return self._active_page_name
    
    def get_line_index(self) -> int:
        return self._line_idx

    def get_line_number(self) -> int:
        return self._line_idx + 1 # Index is zero-based, but line numbers start at 1

    def get_block_index(self) -> int:
        return self._block_idx
    
    def get_remaining_lines(self) -> List[str]:
        return self._remaining_lines
    
    def increment_line_index(self) -> None:
        self._line_idx += 1
        self._can_advance_block_idx = True
    
    def increment_block_index(self) -> None:
        if self._can_advance_block_idx: # safe guard - prevents being called by multiple extractors on the same line and gets reset on each line
            self._block_idx += 1
            self._can_advance_block_idx = False
    
    def pop_line(self) -> None:
        if len(self._remaining_lines) > 0:
            # TODO might check out a way to remove the first element - list.pop(0) did
            #     not work as expected
            self._remaining_lines = self._remaining_lines[1:]

class ReferenceExtractor:
    '''## Base reference extraction class
    Used for extracting types of references (Backlink, Block, etc.) in inherited classes'''
    def extract(self, text: str, metadata: ReferenceExtractionMetadata, reference_collection: References) -> None:
        '''## Reference Extraction
        Extract a reference from text (if any) and add it to the collection'''
        raise Exception('Use inherited classes instead of base')

class BacklinkExtractor(ReferenceExtractor):
    ## Format: [[<reference text>]]
    ## A line of text have have any number of Backlink references
    REFERENCE_SEARCH_REGEX = r"\[\[.*?\]\]"
    TEXT_EXTRACTION_REGEX = r"(\[\[|\]\])"

    def extract(self, text: str, metadata: ReferenceExtractionMetadata, reference_collection: References) -> None:
        for reference in extract_text_ref_metadata(self.REFERENCE_SEARCH_REGEX, self.TEXT_EXTRACTION_REGEX, text):
            (backlink_name, start_pos, end_pos) = reference
            if backlink_name == metadata.get_page_name_to_find():
                backlink = RefMetadata(ref_id=backlink_name, block_index=metadata.get_block_index(), start_pos=start_pos, end_pos=end_pos)
                reference_collection.add_backlink(metadata.get_active_page_name(), backlink)

class BlockReferenceExtractor(ReferenceExtractor):
    REFERENCE_SEARCH_REGEX = r"\(\(.*?\)\)"
    TEXT_EXTRACTION_REGEX = r'(\(\(|\)\))'

    def __init__(self, block_ids: List[str]):
        self._block_ids: List[str] = block_ids
    
    def extract(self, text: str, metadata: ReferenceExtractionMetadata, reference_collection: References) -> None:        
        references = extract_text_ref_metadata(self.REFERENCE_SEARCH_REGEX, self.TEXT_EXTRACTION_REGEX, text)
        for reference in references:
            (block_id, start_pos, end_pos) = reference
            if block_id in self._block_ids:
                ref = RefMetadata(ref_id=block_id, block_index=metadata.get_block_index(), start_pos=start_pos, end_pos=end_pos)
                reference_collection.add_block_ref(metadata.get_active_page_name(), ref)

## TODO Add Tag reference extraction

class ReferenceLocator:
    def __init__(self, user_path: Path, requested_page_name: str):
        self._user_path: Path = user_path
        self._requested_page_name: str = requested_page_name
        self._ref_extractors: List[ReferenceExtractor] = []
        self._refs = References()
    
    def add_extractor(self, extractor: ReferenceExtractor) -> None:
        self._ref_extractors.append(extractor)
    
    def retrieve_all_relationships(self) -> PageLinkage:
        for page in self._get_all_files_in_repo():
            # TODO parallel processing - or sending this stuff to another service
            #     written in something faster than Python - would be ideal here
            self._process_file(page)
        return self._refs.to_model()
    
    def _get_all_files_in_repo(self):
        return self._user_path.rglob('*.md')
    
    def _process_file(self, path: Path) -> None:
        with open(str(path), 'r') as f:
            # IDEA: separate all file IO for a possible ring buffer set - see io_uring API in
            #     Linux: https://man7.org/linux/man-pages/man7/io_uring.7.html
            lines = f.readlines()
        file_content = ''.join(lines) # each line already has a newline at the end, so joining everything together works correctly

        page_name = path.name.replace('.md', '')
        metadata = ReferenceExtractionMetadata(self._requested_page_name, page_name, lines)
        self._refs.register_page(page_name, file_content)
        for line in lines:
            # Block index != line index -- ID assignments are their own line but belong to Blocks
            if not is_line_block_id_assignment(line):
                metadata.increment_block_index()

            for extractor in self._ref_extractors:
                extractor.extract(line, metadata, self._refs)

            metadata.increment_line_index()
            metadata.pop_line()
        self._refs.remove_if_no_references(page_name) # removes the Page's metadata entry if no references were found

def search_blocks(query: str, page_path: Path) -> List[BlockSearchResult]:
    block_list: List[BlockSearchResult] = []
    last_block: Optional[BlockSearchResult]
    content = page_path.read_text()
    line_number = 1
    for line in content.splitlines():
        if query.lower() in line.lower():
            last_block = BlockSearchResult(block_id=None, block_text=line, line_number=line_number, page_name=page_path.name)
            block_list.append(last_block)
        elif is_line_block_id_assignment(line) and last_block is not None:
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
