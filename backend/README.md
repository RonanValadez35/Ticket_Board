# Ticket Board backend

## Running the tests

Install the development dependencies and run the endpoint test suite from this
directory:

```bash
uv sync --dev
uv run pytest
uvx ruff@0.13.0 check .
```

The tests override FastAPI's `get_session` dependency. Every test gets a new
SQLite database in pytest's temporary directory, so tests never read from or
write to the PostgreSQL database configured for the application.
