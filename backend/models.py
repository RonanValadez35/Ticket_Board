import bcrypt
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    title: Mapped[str] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(String(50))
    description: Mapped[str] = mapped_column(String(1000), default="")
    owner: Mapped["User | None"] = relationship(back_populates="tickets")


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(60))
    tickets: Mapped[list[Ticket]] = relationship(back_populates="owner")

    @classmethod
    def with_password(cls, username: str, password: str) -> "User":
        """Create a user while ensuring the plain-text password is never stored."""
        hashed_password = bcrypt.hashpw(
            password.encode("utf-8"),
            bcrypt.gensalt(),
        ).decode("utf-8")
        return cls(username=username, hashed_password=hashed_password)

    def verify_password(self, password: str) -> bool:
        """Return whether a plain-text password matches this user's bcrypt hash."""
        return bcrypt.checkpw(
            password.encode("utf-8"),
            self.hashed_password.encode("utf-8"),
        )
