from typing import Dict, List, Union

from random import random

from terminusdb_client import Client
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
I_AM_A_TEAPOT = 418 # no actually look it up it's legit
UNPROCESSED_ENTITY = 422

class Note(BaseModel):
    ID: str
    text: str
    author: str

# might re-write the schema as classes like they do in their example: https://github.com/terminusdb/terminusdb-client-python?tab=readme-ov-file
class BaseDatabase:
    def __init__(self, addr: str, account: str, team: str, key: str, db_name: str, schema: Dict[str, str]):
        self._addr = addr
        self._account = account
        self._team = team
        self._key = key
        self._db_name = db_name
        self._branch = 'main'
        self._schema = schema
    
    @property
    def address(self) -> str: return self._addr

    @property
    def account(self) -> str: return self._account

    @property
    def team(self) -> str: return self._team

    @property
    def key(self) -> str: return self._key

    @property
    def db_name(self) -> str: return self._db_name

    @property
    def schema(self) -> Dict[str, str]: return self._schema

    @property
    def current_branch(self) -> str: raise NotImplementedError

    def get_all(self) -> List:
        raise NotImplementedError

    def get_by_id(self, _id: str) -> Dict:
        raise NotImplementedError
    
    def add(self, author: str, text: str) -> Dict:
        raise NotImplementedError
    
    def remove_by_id(self, _id: str) -> Dict:
        raise NotImplementedError
    
    def update(self, obj) -> Dict:
        raise NotImplementedError
    
    def get_branches(self) -> List:
        raise NotImplementedError
    
    def create_branch(self, name: str) -> Dict:
        raise NotImplementedError
    
    def delete_branch(self, name: str) -> Dict:
        raise NotImplementedError
    
    def change_branch(self, name: str) -> Dict:
        raise NotImplementedError
    
    def apply(self, branch_name_to_apply: str) -> Dict:
        raise NotImplementedError
    
    def diff(self, branch_to_diff_on) -> Dict:
        raise NotImplementedError

'''
A lot of the documentation did not make sense to me, so I just glanced at the actual source code
connect: https://github.com/terminusdb/terminusdb-client-python/blob/30fe3957a2ccd4fe4c15b3d36fc5419bcf166a85/terminusdb_client/client/Client.py#L308
has_database: https://github.com/terminusdb/terminusdb-client-python/blob/30fe3957a2ccd4fe4c15b3d36fc5419bcf166a85/terminusdb_client/client/Client.py#L2909
create_database: https://github.com/terminusdb/terminusdb-client-python/blob/30fe3957a2ccd4fe4c15b3d36fc5419bcf166a85/terminusdb_client/client/Client.py#L675
insert_document: https://github.com/terminusdb/terminusdb-client-python/blob/30fe3957a2ccd4fe4c15b3d36fc5419bcf166a85/terminusdb_client/client/Client.py#L1180
get_all_documents: https://github.com/terminusdb/terminusdb-client-python/blob/30fe3957a2ccd4fe4c15b3d36fc5419bcf166a85/terminusdb_client/client/Client.py#L1053
query: https://github.com/terminusdb/terminusdb-client-python/blob/30fe3957a2ccd4fe4c15b3d36fc5419bcf166a85/terminusdb_client/client/Client.py#L1527
'''
class NotesDatabase(BaseDatabase):
    def __init__(self):
        schema = {
            '@type': 'Class',
            '@id': 'Note',
            'text': 'xsd:string',
            'author': 'xsd:string',
        }
        super().__init__("http://localhost:6363", "admin", "admin", "root", 'notesdb', schema)
        self._client = Client(self._addr, account=self._account, team=self._team, key=self._key)
        self._init_db()
    
    def _init_db(self):
        self._client.connect()
        if not self._client.has_database(self._db_name):
            print('Creating db')
            self._client.create_database(self._db_name)
            self._client.insert_document(self._schema, graph_type='schema')
        self._client.connect(db=self._db_name)

    @property
    def client(self) -> Client: return self._client

    ''' CRUD operations '''

    def get_all(self) -> Union[List, Dict]:
        # the try/catch seems a bit overkill, but we'll just add it anyway
        try:
            return list(self._client.get_all_documents())
        except Exception as e:
            return {'status:': 500, 'message': e.__dict__}
    
    def get_by_id(self, _id: str) -> Dict:
        try:
            return self._client.get_document(_id)
        except Exception as e:
            return {'status:': 500, 'message': e.__dict__}
    
    def add(self, author: str, text: str) -> Dict:
        result = self._client.insert_document({'text': text, 'author': author})
        return {'status': 200, 'result': result}
    
    def remove_by_id(self, _id: str) -> Dict:
        try:
            self._client.delete_document(_id)
            return {'status': 200}
        except Exception as e:
            return {'status:': 500, 'message': e.__dict__}
        
    def update(self, obj) -> Dict:
        to_ignore = ['@type', '@id']
        new_obj = {}
        for key in self.schema.keys():
            if key in to_ignore:
                continue
            elif key not in obj:
                print(obj)
                return {'status': I_AM_A_TEAPOT, 'message': f'Required key \'{key}\' not found in data.'}
            new_obj[key] = obj[key]
        if 'ID' not in obj:
            return {'status': I_AM_A_TEAPOT, 'message': f'\'ID\' key is required.'}
        
        # Add fields we ignored earlier
        new_obj['@id'] = f'Note/{obj['ID']}'
        new_obj['@type'] = 'Note'
        try:
            self._client.update_document(new_obj)
            return {'status': 200}
        except Exception as e:
            return {'status': 500, 'message': e.__dict__}
            
    
    ''' Version Control operations '''

    @property
    def current_branch(self) -> str:
        return self._client.branch

    def get_branches(self) -> Union[List, Dict]:
        try:
            return self._client.get_all_branches()
        except Exception as e:
            return {'status': I_AM_A_TEAPOT, 'message': e.__dict__}
    
    def _get_branch_names(self) -> List[str]:
        try:
            return [obj['name'] for obj in self._client.get_all_branches()]
        except:
            return []
    
    def create_branch(self, name: str) -> Dict:
        try:
            if name in self._get_branch_names():
                return {'status': UNPROCESSED_ENTITY, 'message': f'Branch \'{name}\' already exists.'}

            self._client.create_branch(name)
            self._client.branch = name
            return {'status': 200, 'message': f'Now on branch {name}', 'branchName': name}
        except Exception as e:
            return {'status': 500, 'message': e.__dict__}
    
    def delete_branch(self, name: str) -> Dict:
        try:
            if name in 'main':
                return {'status': I_AM_A_TEAPOT, 'message': 'Cannot delete main branch.'}
            elif name not in self._get_branch_names():
                return {'status': I_AM_A_TEAPOT, 'message': f'Branch \'{name}\' does not exist.'}
            
            self._client.delete_branch(name)
            return {'status': 200, 'message': f'Branch {name} deleted.'}
        except Exception as e:
            return {'status': 500, 'message': e.__dict__}
    
    def change_branch(self, name: str) -> Dict:
        try:
            if name not in self._get_branch_names():
                return {'status': 404, 'message': f'Branch \'{name}\' does not exist.'}

            self._client.branch = name
            return {'status': 200, 'message': f'Branch changed to {name}.'}
        except Exception as e:
            print(e.__str__)
            return {'status': 500, 'message': e}
    
    def apply(self, branch_name_to_apply: str) -> Dict:
        try:
            if branch_name_to_apply not in self._get_branch_names():
                return {'status': 404, 'message': f'Branch \'{branch_name_to_apply}\' does not exist.'}
            
            current_branch = self._client.branch
            return self._client.apply(current_branch, branch_name_to_apply, branch=current_branch)
        except Exception as e:
            return {'status': 500, 'message': e.__dict__}
    
    def diff(self, branch_to_diff_on) -> Dict:
        try:
            diff = self._client.diff_version(branch_to_diff_on, self.current_branch)
            return {'status': 200, 'diff': diff}
        except Exception as e:
            return {'status': 500, 'message': e.__dict__}

db = NotesDatabase()
app = FastAPI()

@app.get('/all-notes')
def get_all_notes():
    return db.get_all()

# note that the IDs given from TerminusDB have a "Note/" prefix, which must be removed for the `note_id` value
@app.get('/notes/{note_id}')
def read_note_by_id(note_id: str):
    return db.get_by_id(f'Note/{note_id}')

@app.post('/add-note')
def add_note(author: str, text: str):
    return db.add(author, text)

# just like with getting a note with by ID, we add in the prefix
@app.delete('/delete-note/{note_id}')
def delete_note_by_id(note_id: str):
    return db.remove_by_id(f'Note/{note_id}')

@app.put('/update-note/')
def update_note(note_obj: Note):
    return db.update(note_obj.dict())

@app.get('/branches')
def get_branches():
    return db.get_branches()

@app.get('/current-branch')
def get_current_branch_name():
    return db.current_branch

@app.put('/create-branch/{name}')
def create_branch(name: str):
    return db.create_branch(name)

@app.delete('/delete-branch/{branch_name}')
def delete_branch(branch_name: str):
    return db.delete_branch(branch_name)

@app.put('/change-branch/{name}')
def change_branch(name: str):
    return db.change_branch(name)

@app.put('/apply-branch/{branch_name}')
def apply_branch(branch_name: str):
    return db.apply(branch_name)

@app.get('/diff/{branch_name_to_diff_on}')
def diff_branch(branch_name_to_diff_on: str):
    return db.diff(branch_name_to_diff_on)


# this needs to be the last item after all routes
app.mount('/', StaticFiles(directory='elegant-notes-ui/dist', html=True))
