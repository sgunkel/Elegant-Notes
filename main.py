from dataclasses import dataclass
from datetime import datetime
from typing import List, Dict, Union, Optional
import sqlite3

__db_connection = None
__db_name = 'example.db'
def get_db():
    global __db_connection
    if __db_connection is None:
        __db_connection = sqlite3.connect(__db_name)
    return __db_connection

def commit_db():
    db = get_db()
    db.commit()

def close_db():
    global __db_connection
    commit_db()
    get_db().close()
    __db_connection = None

def create_db():
    db = get_db()
    db.executescript('''
        CREATE TABLE IF NOT EXISTS user (
            id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS note (
            id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            last_edited TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (user_id) REFERENCES user (id)
        );
        CREATE TABLE IF NOT EXISTS block (
            id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            note_id INTEGER NOT NULL,
            block_text TEXT,
            created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (note_id) REFERENCES note (id)
        );
        CREATE TABLE IF NOT EXISTS reference (
            id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            is_note BOOLEAN NOT NULL,
            parent_id INTEGER NOT NULL,
            end_point_id INTEGER NOT NULL
        );
    ''')
    commit_db()

@dataclass
class User:
    id: int
    name: str

@dataclass
class Note:
    id: int
    user: User
    created: datetime
    last_edited: datetime
    blocks: List['Block']

@dataclass
class Block:
    id: int
    note: Note
    created: datetime
    text: str
    children: List[Union[Note, 'Block']]

NOT_ADDED_TO_DB = -1

unionChildType = Union[Block, Note]

def add_user(name: str) -> User:
    db = get_db()
    con = db.cursor()
    con.execute('INSERT INTO user (name) VALUES (?)', (name,))
    db.commit()
    return User(con.lastrowid or NOT_ADDED_TO_DB, name)

def get_user_by_id(id) -> Optional[User]:
    db = get_db()
    con = db.cursor()
    entry = con.execute('SELECT name FROM user WHERE id = ?', (id,)).fetchone()
    if entry:
        return User(id, entry[0])
    return None

def add_note(user: User, children: List[Block]) -> Note:
    db = get_db()
    con = db.cursor()
    con.execute('INSERT INTO note (user_id) VALUES (?)', (user.id,))
    note_id = con.lastrowid or NOT_ADDED_TO_DB

    # Metadata for tracking
    con.execute('INSERT INTO reference (is_note, parent_id, end_point_id) VALUES (?, ?, ?)',
                (True, user.id, note_id))
    db.commit()
    
    # Add the children (blocks)
    note = Note(con.lastrowid or NOT_ADDED_TO_DB, user, datetime.now(), datetime.now(), [])
    added_children: List[Block] = []
    for child in children:
        entry = child
        if entry.id is not NOT_ADDED_TO_DB:
            entry = add_block(note, child.text, child.children)
        added_children.append(entry)
    note.blocks = added_children
    return note

def get_note_by_id(id) -> Optional[Note]:
    db = get_db()
    con = db.cursor()
    result = con.execute('SELECT user_id, created, last_edited FROM note WHERE id = ?', (id,)).fetchone()
    if result:
        user = get_user_by_id(result[0])
        note = Note(id, user, result[1], result[2], [])
        note.blocks = get_blocks_by_note_id(note)
        return note
    return None

def get_note_bulk(note_ids: List[int]) -> List[Note]:
    if len(note_ids) == 0:
        return []
    
    db = get_db()
    con = db.cursor()
    note_ids = [str(_id) for _id in note_ids] # str.join() apparently only wants lists of strings
    bulk = con.execute('SELECT id, user_id, created, last_edited FROM note WHERE id IN (?)',
        (','.join(note_ids),)).fetchall() # this is almost identical to the bulk block load, but it's not working and I need to work on other parts
    
    users: Dict[int, User] = {}
    notes: List[Note] = []
    for meta in bulk:
        note_id = meta[0]
        user_id = meta[1]
        created = meta[2]
        last_edited = meta[3]

        # Get user
        if user_id not in users:
            new_user = get_user_by_id(user_id)
            if new_user is None:
                print(f'get_note_bulk: User ID "{user_id}" not found on Note with ID "{note_id}"')
                continue
            users[user_id] = new_user
        user = user[user_id]

        # Create and add the note
        note = Note(note_id, user, created, last_edited, [])
        note.blocks = get_blocks_by_note_id(note)
        notes.append(note)
    return notes

def add_block(note: Note, text: str, children: List[Union[Note, Block]]) -> Block:
    db = get_db()
    con = db.cursor()

    # Add the note object if it's not present
    if note.id is NOT_ADDED_TO_DB:
        note = add_note(note.user, note.blocks)
    con.execute('INSERT INTO block (block_text, note_id) VALUES (?, ?)', (text, note.id))
    block_id = con.lastrowid or NOT_ADDED_TO_DB

    # Metadata for tracking references
    con.execute('INSERT INTO reference (is_note, parent_id, end_point_id) VALUES (?, ?, ?)',
                (False, note.id, block_id))
    db.commit()

    # Add the children to the database
    added_children: List[Union[Note, Block]] = []
    for child in children:
        entry = child
        if child.id is NOT_ADDED_TO_DB:
            # Add whichever child type to the database
            if isinstance(child, Note):
                entry = add_note(note.user, note.blocks)
            else:
                entry = add_block(note, child.text, child.children)
        added_children.append(entry)
    return Block(block_id, note, datetime.now(), text, added_children)

def get_block_by_id(id) -> Optional[Block]:
    db = get_db()
    con = db.cursor()
    result = con.execute('SELECT note_id, block_text FROM block WHERE id = ?', (id,)).fetchone()
    if result:
        note = get_note_by_id(result[0])
        return Block(id, note, result[1], [])
    return None

# note -> note | block
def get_all_child_items(parent_id: int) -> List[unionChildType]:
    db = get_db()
    con = db.cursor()
    references = con.execute(
        'SELECT is_note, end_point_id FROM reference WHERE parent_id = ?',
        (parent_id,)).fetchall()
    note_ids = []
    block_ids = []
    for ref in references:
        is_note, ref_id = ref
        if is_note:
            note_ids.append(ref_id)
        else:
            block_ids.append(ref_id)
    
    # Bulk retrieve
    children: List[unionChildType] = get_note_bulk(note_ids) + get_block_bulk(block_ids)
    children.sort(key=lambda x: x.created) # sort mixed types by creation date
    return children

def get_blocks_by_note_id(note: unionChildType) -> List[Block]:
    if isinstance(note, int):
        note = get_note_by_id(note)

    db = get_db()
    con = db.cursor()
    result = con.execute('SELECT id, block_text, created FROM block WHERE note_id = ?', (note.id,)).fetchall()
    all_blocks: List[Block] = []
    if len(result) != 0:
        for block_raw in result:
            block_id = block_raw[0]
            text = block_raw[1]
            created = block_raw[2]
            all_blocks.append(Block(block_id, note, created, text, []))
    return all_blocks

def get_block_bulk(ids: List[int]) -> List[Block]:
    db = get_db()
    con = db.cursor()
    ids = [str(_id) for _id in ids] # dumb hack related to what str.join wants for arguments
    result = con.execute('SELECT id, block_text, created, note_id FROM block WHERE id IN (?)',
        (','.join(ids),)).fetchall()
    
    notes: Dict[int, Note] = {}
    all_blocks: List[Block] = []
    for block_raw in result:
        block_id = block_raw[0]
        text = block_raw[1]
        created = block_raw[2]
        note_id = block_raw[3]
        if note_id not in notes:
            new_note = get_note_by_id(note_id)
            if new_note is None:
                print(f'get_block_bulk: Cannot find note with ID "{note_id}" on block with ID "{block_id}"')
                continue
            notes[note_id] = new_note
        note = notes[note_id]

        children = [] # figure this out later....
        block = Block(block_id, note, created, text, children)
        all_blocks.append(block)
    return all_blocks

if __name__ == '__main__':
    create_db()
    me = add_user('Seth Gunkel')
    test_note = Note(NOT_ADDED_TO_DB, me, datetime.now(), datetime.now(), [])
    test_block = Block(NOT_ADDED_TO_DB, test_note, datetime.now(), 'this is a test block that was created as an object in main() and not through the nicer add_block() function', [])

    note_added_correctly = add_note(me, [])
    block_added_correctly = add_block(note_added_correctly, 'this was added correctly using the add_block() function', [])

    # add everything from above
    add_block(test_note, 'this will automatically added the original test objects to the database when creating this block', [test_block])

    retrieved_user = get_user_by_id(me.id)
    print('User retrieved from the database')
    def print_obj(obj, level=''):
        if isinstance(obj, Block):
            print(level, 'BLOCK', obj.id, obj.created, f'{len(obj.children)} child(ren)', obj.text)
            for child in obj.children:
                print_obj(child, level=f'{level}  ')
        elif isinstance(obj, Note):
            print(level, 'NOTE', obj.id, obj.user.name, obj.created, f'{len(obj.blocks)} child(ren)', obj.last_edited)
            for child in obj.blocks:
                print_obj(child, level=f'{level}  ')
        else:
            print(level, obj)
    if retrieved_user is not None:
        bulk = get_all_child_items(retrieved_user.id)
        for child in bulk:
            print_obj(child)
    else:
        print('user not found')

    close_db()
