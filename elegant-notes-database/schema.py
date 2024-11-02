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
Title: This is an Example
Description: Example to show how schema works
Authors: TerminusDB, Cheuk
"""
from typing import List, Optional, Set

from terminusdb_client.woqlschema import (
    DocumentTemplate,
    EnumTemplate,
    HashKey,
    RandomKey,
    TaggedUnion,
)


class Country(DocumentTemplate):
    """This is Country.
    Country is a class object in the schema. It's class attributes will be the properties of the object. Therefore, a Country object will have a name which is string and a list of alias names that is called 'also_know_as'
    """

    _key = HashKey(["name"])
    also_know_as: List[str]
    name: str


class Address(DocumentTemplate):
    """This is address"""

    _subdocument = []
    country: "Country"
    postal_code: str
    street: str


class Coordinate(DocumentTemplate):
    _key = RandomKey()
    _abstract = []
    x: float
    y: float


class Team(EnumTemplate):
    Information_Technology = "Information Technology"
    Marketing = ()


class Contact(TaggedUnion):
    """TaggedUnion allow options for types"""

    _key = RandomKey()
    international: str
    local_number: int


class Person(DocumentTemplate):
    """This is a person
    Can store the explanation to the attributes in the docstring. Docstrings needs to be in numpydoc format.

        Attributes
        ----------
        age : int
            Age of the person.
        name : str
            Name of the person.
    """

    _key = RandomKey()
    age: int
    friend_of: Set["Person"]
    name: str


class Employee(Person):
    """Employee will inherits the attributes from Person

    Attributes
    ----------
    age : int
        Age of the person.
    name : str
        Name of the person.
    """

    _key = RandomKey()
    address_of: "Address"
    age: int
    contact_number: Optional[str]
    friend_of: Set["Person"]
    managed_by: "Employee"
    name: str


class Location(Address, Coordinate):
    """Location is inherits from Address and Coordinate
    Class can have multiple inheritance. It will inherits both the attributes from Address and Coordinate.
    """

    _subdocument = []
    country: "Country"
    name: str
    postal_code: str
    street: str
    x: float
    y: float
