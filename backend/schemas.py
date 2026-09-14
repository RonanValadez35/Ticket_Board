from pydantic import BaseModel, ConfigDict, Field, field_validator


class TicketCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str
    status: str = "Backlog"
    description: str = ""
    assigned_to_me: bool = False


class TicketRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    status: str
    description: str
    user_id: int | None = None
    owner_username: str | None = None


class TicketUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = None
    description: str | None = None
    status: str | None = None
    assigned_to_me: bool | None = None


class AccountCreate(BaseModel):
    username: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=8)

    @field_validator("username", mode="before")
    @classmethod
    def normalize_username(cls, username: object) -> object:
        return username.strip() if isinstance(username, str) else username

    @field_validator("password")
    @classmethod
    def validate_password_length(cls, password: str) -> str:
        if len(password.encode("utf-8")) > 72:
            raise ValueError("Password must be at most 72 bytes")
        return password


class SignIn(BaseModel):
    username: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=1)

    @field_validator("username", mode="before")
    @classmethod
    def normalize_username(cls, username: object) -> object:
        return username.strip() if isinstance(username, str) else username

    @field_validator("password")
    @classmethod
    def validate_password_length(cls, password: str) -> str:
        if len(password.encode("utf-8")) > 72:
            raise ValueError("Password must be at most 72 bytes")
        return password


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
