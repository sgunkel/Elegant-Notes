## Elegant Notes
- SLQite3 version of storing information in a relational way
    - This came together smoother that I thought, though there are a lot of added complexities for retrieving all the child data
    - Time ran out and we were not able to explore version control on this version; however, it was estimated to be quite difficult, as the idea was to create a dump file (the whole database as encrypted `insert` statements) and a way to view it on the application to users
- This version has a problem with bulk loads on notes
    - The query to retrieve notes in bulk (many note IDs at once) is nearly identical to the bulk load of blocks, but does not want to work