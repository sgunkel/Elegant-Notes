####
# This is the script for storing the schema of your TerminusDB
# database for your project.
# Use 'tdbpy startproject' to create a new project, and press enter on
#   endpoint information to use localhost setup
# Use 'tdbpy commit' to commit changes to the database and
# use 'tdbpy sync' to change this file according to
#   the existing database schema
####
"""
Title: Elegant Notes Storage
Description: Storage to be used by the Elegant Notes application
Authors: Seth Gunkel
"""
from typing import Set

from terminusdb_client.woqlschema import DocumentTemplate

class Block(DocumentTemplate):
    """The base object that holds all user-entered information in the application

        Attributes
        ----------
        text : str
            User entered text, optionally in Markdown format.
        children : iterable
            Nested Block objects belonging to this parent object.
    """
    text: str
    children: Set["Block"]

class Page(DocumentTemplate):
    """Root/high-level object with children objects for user-entered text

        Attributes
        ----------
        children : iterable
            Block objects that make up the structure of the page, providing
            (optional) Markdown text for extensibility.
    """
    children: Set[Block]
