from terminusdb_client import Client
from random import random

#
# From Python example snippet: https://terminusdb.com/products/terminusdb/
#

CHANGES_BRANCH = 'changes'
MAIN_BRANCH = 'main'

client = Client("http://localhost:6363", account="admin", team="admin", key="root")
client.connect()
db_name = 'philosophers' + str(random())
client.create_database(db_name)
client.connect(db=db_name)

schema = {
    '@type': 'Class',
    '@id': 'Philosopher',
    'name': 'xsd:string',
}
client.insert_document(schema, graph_type='schema')
client.insert_document({'name': 'Socrates'})
print(list(client.get_all_documents()))

# version control
client.create_branch(CHANGES_BRANCH)
client.branch = CHANGES_BRANCH

# add to temp branch
client.insert_document({'name': 'Plato'})
client.insert_document({'name': 'Aristotle'})

# diff between the two branches
diff = client.diff_version(MAIN_BRANCH, CHANGES_BRANCH)
print(diff)

# apply new changes
applied = client.apply(MAIN_BRANCH, CHANGES_BRANCH, branch=MAIN_BRANCH)
print('Applied:')
print(applied)

# diff again
diff = client.diff_version(MAIN_BRANCH, CHANGES_BRANCH)
print('2nd diff')
print(diff)
