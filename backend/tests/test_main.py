import pytest
from httpx import AsyncClient


async def create_ticket(client: AsyncClient, **overrides) -> dict:
    payload = {
        "title": "Login page is broken",
        "status": "In Progress",
        "description": "The submit button does not respond.",
        **overrides,
    }
    response = await client.post("/tickets", json=payload)
    assert response.status_code == 200
    return response.json()


async def test_list_tickets_starts_empty(client: AsyncClient):
    response = await client.get("/")

    assert response.status_code == 200
    assert response.json() == []


async def test_create_ticket_uses_schema_defaults(client: AsyncClient):
    response = await client.post("/tickets", json={"title": "New ticket"})

    assert response.status_code == 200
    assert response.json() == {
        "id": 1,
        "title": "New ticket",
        "status": "Backlog",
        "description": "",
    }


async def test_created_ticket_appears_in_list(client: AsyncClient):
    ticket = await create_ticket(client)

    response = await client.get("/")

    assert response.status_code == 200
    assert response.json() == [ticket]


async def test_get_ticket_by_id(client: AsyncClient):
    ticket = await create_ticket(client)

    response = await client.get(f"/tickets/{ticket['id']}")

    assert response.status_code == 200
    assert response.json() == ticket


async def test_patch_ticket_changes_only_supplied_fields(client: AsyncClient):
    ticket = await create_ticket(client)

    response = await client.patch(
        f"/tickets/{ticket['id']}",
        json={"status": "Done"},
    )

    assert response.status_code == 200
    assert response.json() == {**ticket, "status": "Done"}

    persisted = await client.get(f"/tickets/{ticket['id']}")
    assert persisted.json() == response.json()


async def test_delete_ticket_removes_it(client: AsyncClient):
    ticket = await create_ticket(client)

    response = await client.delete(f"/tickets/{ticket['id']}")

    assert response.status_code == 204
    assert response.content == b""
    assert (await client.get("/")).json() == []


@pytest.mark.parametrize("method", ["get", "patch", "delete"])
async def test_missing_ticket_returns_404(client: AsyncClient, method: str):
    request = getattr(client, method)
    kwargs = {"json": {"title": "Updated"}} if method == "patch" else {}

    response = await request("/tickets/999", **kwargs)

    assert response.status_code == 404
    assert response.json() == {"detail": "Ticket not found"}


async def test_create_ticket_rejects_missing_title(client: AsyncClient):
    response = await client.post("/tickets", json={"status": "Backlog"})

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["body", "title"]


async def test_ticket_id_must_be_an_integer(client: AsyncClient):
    response = await client.get("/tickets/not-a-number")

    assert response.status_code == 422
