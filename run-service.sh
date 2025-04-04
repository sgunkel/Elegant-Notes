#!/bin/bash

npm run watch --prefix Frontend/Elegant-Notes & # watch for all file changes to compile on the frontend
pushd . && cd Backend/
fastapi dev # run the backend
popd
