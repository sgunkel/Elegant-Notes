from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.responses import RedirectResponse

from .routers.page_router import router as page_router_obj
from .routers.meta_router import router as meta_router_obj
from .routers.auth_router import router as auth_router_obj

from .utilities.db_utils import init_users_db

init_users_db()
app = FastAPI()
app.include_router(page_router_obj)
app.include_router(meta_router_obj)
app.include_router(auth_router_obj)

# to fix some frustrations
@app.router.get('/page-create')
@app.router.get('/page-content')
@app.router.get('/pages')
def redirect_pages_to_home():
    return RedirectResponse(url='/')



# this needs to be the last item after all routes
app.mount('/', StaticFiles(directory='../Frontend/Elegant-Notes/dist', html=True))
