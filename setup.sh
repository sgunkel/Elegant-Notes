#/bin/bash

echo "Setting up Python virtual environmnent"
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

echo "Setting up TerminusDB system (Docker)"
git clone https://github.com/terminusdb/terminusdb
cd terminusdb
echo "BUFFER_AMOUNT=120000" > .env
docker compose up
