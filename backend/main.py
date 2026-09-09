from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

import models
from database import Base, engine, get_session
from schemas import (
    AccountCreate,
    SignIn,
    TicketCreate,
    TicketRead,
    TicketUpdate,
    UserRead,
)


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


async def ticket_response(ticket: models.Ticket, session: AsyncSession) -> dict:
    """Build the public ticket representation, including its owner's name."""
    owner = (
        await session.get(models.User, ticket.user_id)
        if ticket.user_id is not None
        else None
    )
    return {
        "id": ticket.id,
        "title": ticket.title,
        "status": ticket.status,
        "description": ticket.description,
        "user_id": ticket.user_id,
        "owner_username": owner.username if owner is not None else None,
    }


@app.post("/auth/signup", response_model=UserRead, status_code=201)
async def create_account(
    credentials: AccountCreate,
    session: AsyncSession = Depends(get_session),
):
    existing_user = await session.scalar(
        select(models.User).where(models.User.username == credentials.username)
    )
    if existing_user is not None:
        raise HTTPException(status_code=409, detail="Username is already taken")

    user = models.User.with_password(credentials.username, credentials.password)
    session.add(user)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status_code=409,
            detail="Username is already taken",
        ) from None

    await session.refresh(user)
    return user


@app.post("/auth/signin", response_model=UserRead)
async def sign_in(
    credentials: SignIn,
    session: AsyncSession = Depends(get_session),
):
    user = await session.scalar(
        select(models.User).where(models.User.username == credentials.username)
    )
    if user is None or not user.verify_password(credentials.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    return user


@app.get("/", response_model=list[TicketRead])
async def root(session: AsyncSession = Depends(get_session)):
    query = select(models.Ticket)
    result = await session.execute(query)
    tickets = result.scalars().all()
    return [await ticket_response(ticket, session) for ticket in tickets]


@app.post("/tickets", response_model=TicketRead)
async def create_ticket(
    ticket: TicketCreate,
    session: AsyncSession = Depends(get_session),
):
    if ticket.user_id is not None:
        owner = await session.get(models.User, ticket.user_id)
        if owner is None:
            raise HTTPException(status_code=404, detail="User not found")

    db_ticket = models.Ticket(
        title=ticket.title,
        status=ticket.status,
        description=ticket.description,
        user_id=ticket.user_id,
    )
    session.add(db_ticket)
    await session.commit()
    await session.refresh(db_ticket)
    return await ticket_response(db_ticket, session)


@app.get("/tickets/{ticket_id}", response_model=TicketRead)
async def get_ticket(
    ticket_id: int,
    session: AsyncSession = Depends(get_session),
):
    ticket = await session.get(models.Ticket, ticket_id)
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")

    return await ticket_response(ticket, session)


@app.patch("/tickets/{ticket_id}", response_model=TicketRead)
async def edit_ticket(
    ticket_id: int,
    changes: TicketUpdate,
    session: AsyncSession = Depends(get_session),
):
    ticket = await session.get(models.Ticket, ticket_id)
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")

    supplied_changes = changes.model_dump(exclude_unset=True)
    owner_was_supplied = "user_id" in supplied_changes
    requested_owner_id = supplied_changes.pop("user_id", None)
    if owner_was_supplied and requested_owner_id is None:
        ticket.user_id = None
    elif requested_owner_id is not None:
        owner = await session.get(models.User, requested_owner_id)
        if owner is None:
            raise HTTPException(status_code=404, detail="User not found")
        if ticket.user_id is not None and ticket.user_id != requested_owner_id:
            raise HTTPException(
                status_code=409,
                detail="Ticket is already owned by another user",
            )
        ticket.user_id = requested_owner_id

    for field, value in supplied_changes.items():
        setattr(ticket, field, value)

    await session.commit()
    await session.refresh(ticket)
    return await ticket_response(ticket, session)


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
