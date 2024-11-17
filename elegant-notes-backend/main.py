from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from .elegant_notes_backend.routers import block_router, page_router, user_router

app = FastAPI()
app.include_router(block_router.router)
app.include_router(page_router.router)
app.include_router(user_router.router)

# this needs to be the last item after all routes
app.mount('/', StaticFiles(directory='../elegant-notes-ui/dist', html=True))
