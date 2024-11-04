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