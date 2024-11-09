from setuptools import setup, find_packages

VERSION = '0.0.1' 
DESCRIPTION = 'Database config and schema'
LONG_DESCRIPTION = 'Small package with database configurations and schema'

# Setting up
setup(
    name="elegant_notes_database", 
    version=VERSION,
    author="Seth Gunkel",
    author_email="noreply@example.com",
    description=DESCRIPTION,
    long_description=LONG_DESCRIPTION,
    packages=find_packages(),
    keywords=['python', 'first package'],
    classifiers= [
        "Programming Language :: Python :: 3",
        "Operating System :: Platform Independent",
    ]
)
