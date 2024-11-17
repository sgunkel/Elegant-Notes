#!/bin/bash

npm run watch --prefix elegant-notes-ui & # watch for all file changes to compile on the frontend
FRONTEND_PID=$!
pushd . && cd ./elegant-notes-backend
fastapi dev # run the backend
popd
kill $FRONTEND_PID