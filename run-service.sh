#!/bin/bash

npm run watch --prefix elegant-notes-ui & # watch for all file changes to compile on the frontend
FRONTEND_PID=$!
fastapi dev # run the backend
kill $FRONTEND_PID