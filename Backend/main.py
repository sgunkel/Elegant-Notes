from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.requests import Request
from starlette.responses import Response, RedirectResponse
from traceback import print_exception

from .page_router import router as page_router_obj
from .meta_router import router as meta_router_obj

app = FastAPI()
app.include_router(page_router_obj)
app.include_router(meta_router_obj)

# to fix some frustrations
@app.router.get('/page-create')
@app.router.get('/page-content')
@app.router.get('/pages')
def redirect_pages_to_home():
    return RedirectResponse(url='/')

# this needs to be the last item after all routes
app.mount('/', StaticFiles(directory='../Frontend/Elegant-Notes/dist', html=True))
