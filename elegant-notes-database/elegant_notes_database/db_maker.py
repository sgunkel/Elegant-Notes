from .database_api import DatabaseAPI
from .terminusdb_api import make_terminusdb_database

def make_db() -> DatabaseAPI:
    # future: add configuration support here
    return make_terminusdb_database("http://localhost:6363", "admin", "admin", "root", 'ElegantNotesDB')