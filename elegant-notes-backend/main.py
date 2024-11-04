from fastapi import FastAPI

from .elegant_notes_backend.routers import block_router, page_router

app = FastAPI()
app.include_router(block_router.router)
app.include_router(page_router.router)
