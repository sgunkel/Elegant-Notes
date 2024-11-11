from pydantic import BaseModel

class UserModel(BaseModel):
    username: str
    full_name: str
    disabled: bool

class UserModelWithPassword(UserModel):
    hashed_password: str
