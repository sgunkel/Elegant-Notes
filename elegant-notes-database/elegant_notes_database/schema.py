####
# This is the script for storing the schema of your TerminusDB
# database for your project.
# Use 'tdbpy commit' to commit changes to the database and
# use 'tdbpy sync' to change this file according to
# the existing database schema
####
"""
Title: Elegant Notes Storage
Description: Storage to be used by the Elegant Notes application
Authors: Seth Gunkel
"""
from typing import List

from terminusdb_client.woqlschema import DocumentTemplate, Schema

_custom_schema = Schema()
def get_schema():
    global _custom_schema
    return _custom_schema

class Block(DocumentTemplate):
    """The base object that holds all user-entered information in the application

    Attributes
    ----------
    children : List['Block']
        Nested Block objects belonging to this parent object.
    text : str
        User entered text, optionally in Markdown format.
    """

    _schema = _custom_schema
    children: List["Block"]
    text: str

class Page(DocumentTemplate):
    """Root/high-level object with children objects for user-entered text

    Attributes
    ----------
    children : List['Block']
        Block objects that make up the structure of the page
    name : str
        Name of the page
    """

    _schema = _custom_schema
    children: List["Block"]
    name: str
