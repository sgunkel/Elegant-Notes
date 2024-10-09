from typing import Dict, List

from terminusdb_client import Client
from random import random

from fastapi import FastAPI

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
    def branch(self) -> str: return self._branch

    @property
    def schema(self) -> Dict[str, str]: return self._schema

    def get_all(self) -> List:
        raise NotImplementedError

    def get_by_id(self, _id: str) -> Dict:
        raise NotImplementedError
    
    def add(self, author: str, text: str) -> None:
        raise NotImplementedError
    
    def remove_by_id(self, _id: str) -> Dict:
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

    def get_all(self) -> List:
        return list(self._client.get_all_documents())
    
    def get_by_id(self, _id: str) -> Dict:
        try:
            return self._client.get_document(_id)
        except Exception as e:
            return e.__dict__
    
    def add(self, author: str, text: str) -> None:
        result = self._client.insert_document({'text': text, 'author': author})
        return {'status': 200, 'result': result}
    
    def remove_by_id(self, _id: str) -> Dict:
        try:
            self._client.delete_document(_id)
            return {'status': 200}
        except Exception as e:
            return e.__dict__
    
    ''' implement version control later '''

db = NotesDatabase()
app = FastAPI()

@app.get('/')
def read_root():
    return db.get_all()

# note that the IDs given from TerminusDB have a "Note/" prefix, which must be removed for the `note_id` value
@app.get('/notes/{note_id}')
def read_note_by_id(note_id):
    return db.get_by_id(f'Note/{note_id}')

@app.post('/add-note')
def add_note(author: str, text: str):
    return db.add(author, text)

# just like with getting a note with by ID, we add in the prefix
@app.delete('/delete-note/{note_id}')
def delete_note_by_id(note_id):
    return db.remove_by_id(f'Note/{note_id}')
