from pydantic import BaseModel, Field

## TODO convert to a batter "success or fail" response model using below

class OperationResponse(BaseModel):
    msg: str = Field(default='Operation state Unknown')

class SuccessResponse(OperationResponse):
    pass

