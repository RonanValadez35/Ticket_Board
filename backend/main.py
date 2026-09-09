from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import Base, engine, get_session
import models
from schemas import TicketCreate, TicketRead


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
    db_ticket = models.Ticket(title=ticket.title, status=ticket.status)
    session.add(db_ticket)
    await session.commit()
    await session.refresh(db_ticket)
    return db_ticket

    