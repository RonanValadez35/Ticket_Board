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
        "user_id": None,
        "owner_username": None,
    }


async def test_created_ticket_appears_in_list(client: AsyncClient):
    ticket = await create_ticket(client)

    response = await client.get("/")

    assert response.status_code == 200
    assert response.json() == [ticket]


async def test_create_ticket_can_assign_requesting_user_as_owner(client: AsyncClient):
    user = (
        await client.post(
            "/auth/signup",
            json={"username": "casey", "password": "secure-password"},
        )
    ).json()

    response = await client.post(
        "/tickets",
        json={"title": "Owned from creation", "user_id": user["id"]},
    )

    assert response.status_code == 200
    assert response.json()["user_id"] == user["id"]
    assert response.json()["owner_username"] == "casey"


async def test_create_ticket_rejects_unknown_owner(client: AsyncClient):
    response = await client.post(
        "/tickets",
        json={"title": "Invalid owner", "user_id": 999},
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "User not found"}


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


async def test_patch_ticket_assigns_an_existing_user_as_owner(client: AsyncClient):
    ticket = await create_ticket(client)
    signup = await client.post(
        "/auth/signup",
        json={"username": "casey", "password": "secure-password"},
    )
    user = signup.json()

    response = await client.patch(
        f"/tickets/{ticket['id']}",
        json={"user_id": user["id"]},
    )

    assert response.status_code == 200
    assert response.json() == {
        **ticket,
        "user_id": user["id"],
        "owner_username": "casey",
    }
    assert (await client.get(f"/tickets/{ticket['id']}")).json() == response.json()


async def test_patch_ticket_rejects_unknown_owner(client: AsyncClient):
    ticket = await create_ticket(client)

    response = await client.patch(
        f"/tickets/{ticket['id']}",
        json={"user_id": 999},
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "User not found"}


async def test_patch_ticket_cannot_replace_an_existing_owner(client: AsyncClient):
    ticket = await create_ticket(client)
    first_user = (
        await client.post(
            "/auth/signup",
            json={"username": "casey", "password": "secure-password"},
        )
    ).json()
    second_user = (
        await client.post(
            "/auth/signup",
            json={"username": "morgan", "password": "secure-password"},
        )
    ).json()
    await client.patch(
        f"/tickets/{ticket['id']}",
        json={"user_id": first_user["id"]},
    )

    response = await client.patch(
        f"/tickets/{ticket['id']}",
        json={"user_id": second_user["id"]},
    )

    assert response.status_code == 409
    assert response.json() == {"detail": "Ticket is already owned by another user"}


async def test_patch_ticket_can_release_its_owner(client: AsyncClient):
    user = (
        await client.post(
            "/auth/signup",
            json={"username": "casey", "password": "secure-password"},
        )
    ).json()
    ticket = await create_ticket(client, user_id=user["id"])

    response = await client.patch(
        f"/tickets/{ticket['id']}",
        json={"user_id": None},
    )

    assert response.status_code == 200
    assert response.json() == {
        **ticket,
        "user_id": None,
        "owner_username": None,
    }
    assert (await client.get(f"/tickets/{ticket['id']}")).json() == response.json()


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
