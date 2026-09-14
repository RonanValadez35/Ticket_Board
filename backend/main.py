from contextlib import asynccontextmanager
from datetime import UTC, datetime, timedelta
import hashlib
import os
import secrets

from fastapi import Cookie, Depends, FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

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

FRONTEND_URL = os.getenv("FRONTEND_URL")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

SESSION_COOKIE = "ticket_board_session"
SESSION_TTL = timedelta(hours=12)


def token_digest(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


async def start_session(user: models.User, response: Response, db: AsyncSession) -> None:
    token = secrets.token_urlsafe(32)
    db.add(
        models.AuthSession(
            token_hash=token_digest(token),
            expires_at=datetime.now(UTC) + SESSION_TTL,
            user=user,
        )
    )
    await db.commit()
    response.set_cookie(
        SESSION_COOKIE,
        token,
        max_age=int(SESSION_TTL.total_seconds()),
        httponly=True,
        secure=os.getenv("COOKIE_SECURE", "false").lower() == "true",
        samesite="lax",
        path="/",
    )


async def get_auth_session(
    token: str | None = Cookie(default=None, alias=SESSION_COOKIE),
    db: AsyncSession = Depends(get_session),
) -> models.AuthSession:
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    auth_session = await db.scalar(
        select(models.AuthSession)
        .where(models.AuthSession.token_hash == token_digest(token))
        .options(joinedload(models.AuthSession.user))
    )
    if auth_session is None:
        raise HTTPException(status_code=401, detail="Invalid session")
    expires_at = auth_session.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=UTC)
    if expires_at <= datetime.now(UTC):
        await db.delete(auth_session)
        await db.commit()
        raise HTTPException(status_code=401, detail="Session expired")
    return auth_session


async def current_user(
    auth_session: models.AuthSession = Depends(get_auth_session),
) -> models.User:
    return auth_session.user


def ticket_response(ticket: models.Ticket) -> dict:
    """Build the public ticket representation, including its owner's name."""
    return {
        "id": ticket.id,
        "title": ticket.title,
        "status": ticket.status,
        "description": ticket.description,
        "user_id": ticket.user_id,
        "owner_username": ticket.owner.username if ticket.owner is not None else None,
    }


@app.post("/auth/signup", response_model=UserRead, status_code=201)
async def create_account(
    credentials: AccountCreate,
    response: Response,
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
    await start_session(user, response, session)
    return user


@app.post("/auth/signin", response_model=UserRead)
async def sign_in(
    credentials: SignIn,
    response: Response,
    session: AsyncSession = Depends(get_session),
):
    user = await session.scalar(
        select(models.User).where(models.User.username == credentials.username)
    )
    if user is None or not user.verify_password(credentials.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    await start_session(user, response, session)
    return user


@app.get("/auth/me", response_model=UserRead)
async def get_current_user(user: models.User = Depends(current_user)):
    return user


@app.post("/auth/signout", status_code=204)
async def sign_out(
    response: Response,
    auth_session: models.AuthSession = Depends(get_auth_session),
    session: AsyncSession = Depends(get_session),
):
    await session.delete(auth_session)
    await session.commit()
    response.delete_cookie(SESSION_COOKIE, path="/", samesite="lax")


@app.get("/", response_model=list[TicketRead])
async def root(session: AsyncSession = Depends(get_session)):
    query = select(models.Ticket).options(joinedload(models.Ticket.owner))
    result = await session.execute(query)
    tickets = result.scalars().all()
    return [ticket_response(ticket) for ticket in tickets]


@app.post("/tickets", response_model=TicketRead)
async def create_ticket(
    ticket: TicketCreate,
    user: models.User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
):
    db_ticket = models.Ticket(
        title=ticket.title,
        status=ticket.status,
        description=ticket.description,
        owner=user if ticket.assigned_to_me else None,
    )
    session.add(db_ticket)
    await session.commit()
    await session.refresh(db_ticket)
    return ticket_response(db_ticket)


@app.get("/tickets/{ticket_id}", response_model=TicketRead)
async def get_ticket(
    ticket_id: int,
    session: AsyncSession = Depends(get_session),
):
    ticket = await session.get(
        models.Ticket,
        ticket_id,
        options=(joinedload(models.Ticket.owner),),
    )
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")

    return ticket_response(ticket)


@app.patch("/tickets/{ticket_id}", response_model=TicketRead)
async def edit_ticket(
    ticket_id: int,
    changes: TicketUpdate,
    user: models.User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
):
    ticket = await session.get(
        models.Ticket,
        ticket_id,
        options=(joinedload(models.Ticket.owner),),
    )
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if ticket.user_id is not None and ticket.user_id != user.id:
        raise HTTPException(status_code=403, detail="Ticket is owned by another user")

    supplied_changes = changes.model_dump(exclude_unset=True)
    assignment = supplied_changes.pop("assigned_to_me", None)
    if assignment is True:
        ticket.owner = user
    elif assignment is False:
        ticket.owner = None

    for field, value in supplied_changes.items():
        setattr(ticket, field, value)

    await session.commit()
    await session.refresh(ticket)
    return ticket_response(ticket)


@app.delete("/tickets/{ticket_id}", status_code=204)
async def delete_ticket(
    ticket_id: int,
    user: models.User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
):
    ticket = await session.get(models.Ticket, ticket_id)

    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if ticket.user_id is not None and ticket.user_id != user.id:
        raise HTTPException(status_code=403, detail="Ticket is owned by another user")

    await session.delete(ticket)
    await session.commit()
