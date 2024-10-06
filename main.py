from typing import Dict, List

from terminusdb_client import Client
from random import random

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
print('get_all', list(db.get_all()))
print()
print('add', db.add(str(random()), str(random())))
print()
print('get_all', list(db.get_all()))
print()
first = list(db.get_all())[0]
print('get_by_id', db.get_by_id(first['@id']))
print()
print('get_by_id', db.get_by_id('dis aint it'))
print()
print('remove_by_id', db.remove_by_id(first['@id']))
