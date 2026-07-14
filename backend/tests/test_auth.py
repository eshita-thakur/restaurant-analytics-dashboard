def test_register_creates_user(client):
    response = client.post("/api/auth/register", json={
        "username": "johndoe",
        "email": "john@test.com",
        "password": "password123",
        "role_name": "staff"
    })

    assert response.status_code == 201
    data = response.get_json()
    assert data["user"]["username"] == "johndoe"
    assert data["user"]["role"] == "staff"


def test_register_rejects_duplicate_email(client):
    client.post("/api/auth/register", json={
        "username": "user1", "email": "dup@test.com",
        "password": "pass123", "role_name": "staff"
    })
    response = client.post("/api/auth/register", json={
        "username": "user2", "email": "dup@test.com",
        "password": "pass123", "role_name": "staff"
    })

    assert response.status_code == 409


def test_login_with_correct_credentials(client):
    client.post("/api/auth/register", json={
        "username": "janedoe", "email": "jane@test.com",
        "password": "mypassword", "role_name": "owner"
    })

    response = client.post("/api/auth/login", json={
        "email": "jane@test.com",
        "password": "mypassword"
    })

    assert response.status_code == 200
    assert "access_token" in response.get_json()


def test_login_with_wrong_password_fails(client):
    client.post("/api/auth/register", json={
        "username": "bobsmith", "email": "bob@test.com",
        "password": "correctpass", "role_name": "staff"
    })

    response = client.post("/api/auth/login", json={
        "email": "bob@test.com",
        "password": "wrongpass"
    })

    assert response.status_code == 401


def test_protected_route_requires_token(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_protected_route_works_with_valid_token(client, owner_token):
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {owner_token}"}
    )
    assert response.status_code == 200
    assert response.get_json()["username"] == "testowner"