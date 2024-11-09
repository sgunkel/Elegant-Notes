from elegant_notes_database.db_maker import make_db
from elegant_notes_database.database_api import DatabaseAPI

_db_instance: DatabaseAPI = None
def get_db() -> DatabaseAPI:
    global _db_instance
    if _db_instance is None:
        _db_instance = make_db()
    return _db_instance
