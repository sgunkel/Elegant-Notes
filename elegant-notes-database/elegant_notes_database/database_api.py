from typing import Dict, List

class CRUDDatabaseAPI:
    def init_db(self) -> None: raise NotImplementedError
    def create(self, raw: Dict) -> Dict: raise NotImplementedError
    def retrieve_all(self) -> List[Dict]: raise NotImplementedError
    def retrieve_by_id(self, _id: str) -> Dict: raise NotImplementedError
    def update(self, raw: Dict) -> Dict: raise NotImplementedError
    def delete(self, _id: str) -> Dict: raise NotImplementedError

class DatabaseVersionControlAPI:
    def init_vc(self) -> None: raise NotImplementedError
    def get_current_branch_name(self) -> str: raise NotImplementedError
    def get_all_branches(self) -> Dict: raise NotImplementedError
    def create_branch(self, branch_name: str) -> Dict: raise NotImplementedError
    def delete_branch(self, branch_name: str) -> Dict: raise NotImplementedError
    def checkout_branch(self, branch_name: str) -> Dict: raise NotImplementedError
    def apply_changes(self, current_branch: str, branch_to_apply: str) -> Dict: raise NotImplementedError
    def diff(self, current_branch: str, branch_to_compare: str) -> Dict: raise NotImplementedError

class DatabaseAPI:
    @property
    def page_api(self) -> CRUDDatabaseAPI: raise NotImplementedError

    @property
    def block_api(self) -> CRUDDatabaseAPI: raise NotImplementedError

    @property
    def user_api(self) -> CRUDDatabaseAPI: raise NotImplementedError

    @property
    def version_control_api(self) -> DatabaseVersionControlAPI: raise NotImplementedError

    def init_db(self) -> None: raise NotImplementedError
