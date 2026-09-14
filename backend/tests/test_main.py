from datetime import UTC, datetime, timedelta

import pytest
from httpx import AsyncClient
from sqlalchemy import select

import models
from database import get_session
from main import SESSION_COOKIE, app, token_digest


async def signup(client: AsyncClient, username: str = "casey") -> dict:
    response = await client.post("/auth/signup", json={"username": username, "password": "secure-password"})
    assert response.status_code == 201
    return response.json()


async def create_ticket(client: AsyncClient, **overrides) -> dict:
    response = await client.post("/tickets", json={"title": "Login page is broken", "status": "In Progress", "description": "The submit button does not respond.", **overrides})
    assert response.status_code == 200
    return response.json()


async def test_signin_issues_httponly_session_cookie(client: AsyncClient):
    user = await signup(client)
    client.cookies.clear()
    response = await client.post("/auth/signin", json={"username": "casey", "password": "secure-password"})
    assert response.status_code == 200
    assert response.json() == user
    assert f"{SESSION_COOKIE}=" in response.headers["set-cookie"]
    assert "HttpOnly" in response.headers["set-cookie"]
    assert "Max-Age=43200" in response.headers["set-cookie"]
    assert (await client.get("/auth/me")).json() == user


@pytest.mark.parametrize(("method", "path", "json"), [("post", "/tickets", {"title": "No credentials"}), ("patch", "/tickets/1", {"status": "Completed"}), ("delete", "/tickets/1", None)])
async def test_mutations_require_credentials(client: AsyncClient, method: str, path: str, json: dict | None):
    response = await client.request(method, path, json=json)
    assert response.status_code == 401
    assert response.json() == {"detail": "Authentication required"}


async def test_invalid_credentials_are_rejected(client: AsyncClient):
    client.cookies.set(SESSION_COOKIE, "fabricated-token")
    response = await client.post("/tickets", json={"title": "Forged"})
    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid session"}


async def test_expired_credentials_are_rejected_and_removed(client: AsyncClient):
    user = await signup(client)
    token = "expired-token"
    session_override = app.dependency_overrides[get_session]
    async for db in session_override():
        db.add(models.AuthSession(token_hash=token_digest(token), expires_at=datetime.now(UTC) - timedelta(seconds=1), user_id=user["id"]))
        await db.commit()
        break
    client.cookies.set(SESSION_COOKIE, token)
    response = await client.get("/auth/me")
    assert response.status_code == 401
    assert response.json() == {"detail": "Session expired"}
    async for db in session_override():
        assert await db.scalar(select(models.AuthSession).where(models.AuthSession.token_hash == token_digest(token))) is None
        break


async def test_signout_invalidates_session(client: AsyncClient):
    await signup(client)
    token = client.cookies[SESSION_COOKIE]
    response = await client.post("/auth/signout")
    assert response.status_code == 204
    client.cookies.set(SESSION_COOKIE, token)
    assert (await client.get("/auth/me")).status_code == 401


async def test_create_ticket_assigns_only_authenticated_user(client: AsyncClient):
    user = await signup(client)
    ticket = await create_ticket(client, assigned_to_me=True)
    assert ticket["user_id"] == user["id"]
    assert ticket["owner_username"] == "casey"
    response = await client.post("/tickets", json={"title": "Forged owner", "user_id": user["id"] + 1})
    assert response.status_code == 422


async def test_owner_can_update_and_release_ticket(client: AsyncClient):
    await signup(client)
    ticket = await create_ticket(client, assigned_to_me=True)
    response = await client.patch(f"/tickets/{ticket['id']}", json={"status": "Completed", "assigned_to_me": False})
    assert response.status_code == 200
    assert response.json() == {**ticket, "status": "Completed", "user_id": None, "owner_username": None}


async def test_authenticated_user_can_claim_unowned_ticket(client: AsyncClient):
    user = await signup(client)
    ticket = await create_ticket(client)
    response = await client.patch(f"/tickets/{ticket['id']}", json={"assigned_to_me": True})
    assert response.status_code == 200
    assert response.json()["user_id"] == user["id"]


@pytest.mark.parametrize("method", ["patch", "delete"])
async def test_user_cannot_mutate_another_users_ticket(client: AsyncClient, method: str):
    await signup(client, "casey")
    ticket = await create_ticket(client, assigned_to_me=True)
    await signup(client, "morgan")
    kwargs = {"json": {"status": "Completed"}} if method == "patch" else {}
    response = await client.request(method, f"/tickets/{ticket['id']}", **kwargs)
    assert response.status_code == 403
    assert response.json() == {"detail": "Ticket is owned by another user"}
    assert (await client.get(f"/tickets/{ticket['id']}")).json() == ticket


async def test_owner_can_delete_ticket(client: AsyncClient):
    await signup(client)
    ticket = await create_ticket(client, assigned_to_me=True)
    assert (await client.delete(f"/tickets/{ticket['id']}")).status_code == 204
    assert (await client.get(f"/tickets/{ticket['id']}")).status_code == 404


async def test_public_ticket_reads_remain_available(client: AsyncClient):
    assert (await client.get("/")).json() == []
    await signup(client)
    ticket = await create_ticket(client)
    client.cookies.clear()
    assert (await client.get("/")).json() == [ticket]
    assert (await client.get(f"/tickets/{ticket['id']}")).json() == ticket


async def test_create_ticket_rejects_missing_title(client: AsyncClient):
    await signup(client)
    response = await client.post("/tickets", json={"status": "Backlog"})
    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["body", "title"]
