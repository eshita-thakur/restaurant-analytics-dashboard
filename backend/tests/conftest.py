import pytest
from app import create_app
from app.extensions import db
from config_test import TestConfig
from app.models.role import Role


@pytest.fixture
def app():
    app = create_app(TestConfig)

    with app.app_context():
        db.drop_all()
        db.create_all()

        db.session.add_all([
            Role(role_name="owner", description="Full system access"),
            Role(role_name="manager", description="Operational access"),
            Role(role_name="staff", description="Order and payment entry only"),
        ])
        db.session.commit()

        yield app

        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def owner_token(client):
    client.post("/api/auth/register", json={
        "username": "testowner",
        "email": "owner@test.com",
        "password": "testpass123",
        "role_name": "owner"
    })
    response = client.post("/api/auth/login", json={
        "email": "owner@test.com",
        "password": "testpass123"
    })
    return response.get_json()["access_token"]