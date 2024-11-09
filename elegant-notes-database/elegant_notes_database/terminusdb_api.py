from typing import Dict, List

from terminusdb_client import Client

from .database_api import CRUDDatabaseAPI, DatabaseVersionControlAPI, DatabaseAPI
from .schema import get_schema

class CRUDTerminusDB(CRUDDatabaseAPI):
    '''## Generic CRUD API for objects in the TerminusDB database.
    **Note that there is no error handling here and is expected to be handled in the backend**
    '''
    def __init__(self, db_client: Client, obj_type: str):
        self._db_client = db_client
        self._obj_type = obj_type
    
    def init_db(self):
        pass

    def create(self, raw: Dict) -> Dict:
        return self._db_client.insert_document(raw)

    def retrieve_all(self) -> List[Dict]:
        _filter = {'@type': self._obj_type}
        return self._db_client.query_document(_filter, as_list=True)

    def retrieve_by_id(self, _id: str) -> Dict:
        return self._db_client.get_document(_id)

    def update(self, raw: Dict) -> Dict:
        self._db_client.update_document(raw)
        return raw # nothing changed from this

    def delete(self, _id: str) -> Dict:
        return self._db_client.delete_document(_id)
    
class VersionControlTerminusDB(DatabaseVersionControlAPI):
    '''## Version control wrapper for TerminusDB
    **Note that there is no error handling here and is expected to be handled in the backend**
    '''
    def __init__(self, db_client: Client):
        self._db_client = db_client
    
    def init_vc(self) -> None:
        pass

    def get_current_branch_name(self) -> str:
        return self._db_client.branch

    def get_all_branches(self) -> Dict:
        return self._db_client.get_all_branches()

    def create_branch(self, branch_name: str) -> Dict:
        self._db_client.create_branch(branch_name)
        return {'message': f'Created branch "{branch_name}"'}
    
    def delete_branch(self, branch_name: str) -> Dict:
        self._db_client.delete_branch(branch_name)
        return {'message': f'Deleted branch "{branch_name}"'}

    def checkout_branch(self, branch_name: str) -> Dict:
        self._db_client.branch = branch_name
        return {'message': f'Changed to branch "{branch_name}"'}

    def apply_changes(self, current_branch: str, branch_to_apply: str) -> Dict:
        return self._db_client.apply(before_version=current_branch, after_version=branch_to_apply, branch=current_branch)

    def diff(self, current_branch: str, branch_to_compare: str) -> Dict:
        return self._db_client.diff_version(current_branch, branch_to_compare)

class TerminusDBAPI(DatabaseAPI):
    def __init__(self, db_client: Client, db_name: str):
        self._db_client = db_client
        self._db_name = db_name
        self._page_api = CRUDTerminusDB(db_client, 'Page')
        self._block_api = CRUDTerminusDB(db_client, 'Block')
        self._version_control_api = VersionControlTerminusDB(db_client)

    @property
    def page_api(self) -> CRUDDatabaseAPI:
        return self._page_api

    @property
    def block_api(self) -> CRUDDatabaseAPI:
        return self._block_api

    @property
    def version_control_api(self) -> DatabaseVersionControlAPI:
        return self._version_control_api

    def init_db(self):
        self._db_client.connect(db=self._db_name)
        self._create_schema_if_needed()
        
        self._page_api.init_db()
        self._block_api.init_db()
        self._version_control_api.init_vc()

    def _create_schema_if_needed(self):
        # self._db_client.delete_database(self._db_name, 'admin')
        if not self._db_client.has_database(self._db_name):
            self._db_client.create_database(self._db_name)
            schema = get_schema()
            schema.commit(self._db_client, commit_msg='Add schema')
            print('created database system')

def make_terminusdb_database(address: str, account: str, team: str, key: str, db_name: str) -> DatabaseAPI:
    client = Client(address, account=account, team=team, key=key)
    db_wrapper = TerminusDBAPI(client, db_name)
    db_wrapper.init_db()
    return db_wrapper
