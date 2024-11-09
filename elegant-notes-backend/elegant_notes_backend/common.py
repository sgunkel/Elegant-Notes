from typing import Dict, List

from .database_api import get_db

def get_children(raw_obj: Dict) -> List[Dict]:
    '''## Get all children on Block/Page object
    *Recursively grabs all child elements from the top level object*
    - raw_obj Either a Block or Page object as a dictionary
    '''
    children = []
    db = get_db()
    for child_id in raw_obj['children']:
        if child_id.startswith('Page'):
            child = db.page_api.retrieve_by_id(child_id)
        else:
            child = db.block_api.retrieve_by_id(child_id)
        
        child['children'] = get_children(child)
        children.append(child)
    return children

def nuke_all_blocks_from_page(children):
    '''## Remove children from page
    *Removes only the Block children from a page and not the actual page itself*
    - children The Page's direct children
    '''
    db = get_db()
    block_count = 0
    def remove_block_from_db(child):
        nonlocal db, block_count

        # Remove child references or the database will complain
        grandchildren = child['children']
        child['children'] = []
        db.block_api.update(child)
        block_count += len(grandchildren) + 1 # +1 for the current block

        # Remove the lasted generation (most nested blocks)
        for grandchild in grandchildren:
            remove_block_from_db(grandchild)
        db.block_api.delete(child['@id'])
    page_raw = {'children': children} # only thing needed by `get_children()`
    for child in get_children(page_raw):
        remove_block_from_db(child)
    return block_count
