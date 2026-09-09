from pydantic import BaseModel, ConfigDict


class TicketCreate(BaseModel):
    title: str
    status: str


class TicketRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    status: str
