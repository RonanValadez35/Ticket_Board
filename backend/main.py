from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import Base, engine, get_session
import models
from schemas import TicketCreate, TicketRead, TicketUpdate


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", response_model=list[TicketRead])
async def root( session: AsyncSession = Depends(get_session)):
    query = select(models.Ticket)
    result = await session.execute(query)
    tickets = result.scalars().all()
    return tickets


@app.post("/tickets", response_model=TicketRead)
async def create_ticket(
    ticket: TicketCreate,
    session: AsyncSession = Depends(get_session),
):
    db_ticket = models.Ticket(
        title=ticket.title,
        status=ticket.status,
        description=ticket.description,
    )
    session.add(db_ticket)
    await session.commit()
    await session.refresh(db_ticket)
    return db_ticket


@app.get("/tickets/{ticket_id}", response_model=TicketRead)
async def get_ticket(
    ticket_id: int,
    session: AsyncSession = Depends(get_session),
):
    ticket = await session.get(models.Ticket, ticket_id)
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")

    return ticket


@app.patch("/tickets/{ticket_id}", response_model=TicketRead)
async def edit_ticket(
    ticket_id: int,
    changes: TicketUpdate,
    session: AsyncSession = Depends(get_session),
):
    ticket = await session.get(models.Ticket, ticket_id)
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    for field, value in changes.model_dump(
        exclude_unset=True,
        exclude_none=True,
    ).items():
        setattr(ticket, field, value)

    await session.commit()
    await session.refresh(ticket)
    return ticket

@app.delete("/tickets/{ticket_id}", status_code=204)
async def delete_ticket(
    ticket_id: int,
    session: AsyncSession = Depends(get_session),
):
    ticket = await session.get(models.Ticket, ticket_id)

    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")

    await session.delete(ticket)
    await session.commit()