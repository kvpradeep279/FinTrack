"""
Test configuration.

For in-memory SQLite, all DB operations must share the SAME connection —
a new connection would see an empty database. We achieve this by binding
the sessionmaker to a shared connection rather than the engine directly.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from unittest.mock import patch

import app.database as db_module
from app.database import Base, get_db
from app.main import app

_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
)


@pytest.fixture()
def client():
    # Single connection shared across the whole test
    connection = _engine.connect()
    Base.metadata.create_all(bind=connection)

    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=connection)
    session = TestingSession()

    def override_get_db():
        try:
            yield session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with patch.object(db_module, "engine", _engine):
        with TestClient(app, raise_server_exceptions=True) as c:
            yield c

    app.dependency_overrides.clear()
    session.close()
    Base.metadata.drop_all(bind=connection)
    connection.close()


@pytest.fixture()
def no_raise_client():
    """
    Same as `client` but with raise_server_exceptions=False.
    Required for testing the global 500 exception handler — the default client
    re-raises unhandled exceptions before FastAPI's handler can respond.
    """
    connection = _engine.connect()
    Base.metadata.create_all(bind=connection)

    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=connection)
    session = TestingSession()

    def override_get_db():
        try:
            yield session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with patch.object(db_module, "engine", _engine):
        with TestClient(app, raise_server_exceptions=False) as c:
            yield c

    app.dependency_overrides.clear()
    session.close()
    Base.metadata.drop_all(bind=connection)
    connection.close()
