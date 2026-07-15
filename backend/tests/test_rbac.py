import pytest
@pytest.fixture
def staff_token(client):
    client.post("/api/auth/register", json={
        "username": "teststaff",
        "email": "staff@test.com",
        "password": "testpass123",
        "role_name": "staff"
    })
    response = client.post("/api/auth/login", json={
        "email": "staff@test.com",
        "password": "testpass123"
    })
    return response.get_json()["access_token"]


def test_staff_cannot_view_employees(client, staff_token):
    response = client.get(
        "/api/employees",
        headers={"Authorization": f"Bearer {staff_token}"}
    )
    assert response.status_code == 403


def test_owner_can_view_employees(client, owner_token):
    response = client.get(
        "/api/employees",
        headers={"Authorization": f"Bearer {owner_token}"}
    )
    assert response.status_code == 200


def test_staff_cannot_delete_employee(client, staff_token, owner_token):
    create_response = client.post(
        "/api/employees",
        json={"first_name": "Test", "last_name": "Employee", "position": "Cook",
              "salary": 15000, "hire_date": "2025-01-01"},
        headers={"Authorization": f"Bearer {owner_token}"}
    )
    employee_id = create_response.get_json()["employee"]["employee_id"]

    response = client.delete(
        f"/api/employees/{employee_id}",
        headers={"Authorization": f"Bearer {staff_token}"}
    )
    assert response.status_code == 403


def test_staff_cannot_view_expenses(client, staff_token):
    response = client.get(
        "/api/expenses",
        headers={"Authorization": f"Bearer {staff_token}"}
    )
    assert response.status_code == 403


def test_staff_can_create_orders(client, staff_token):
    response = client.get(
        "/api/orders",
        headers={"Authorization": f"Bearer {staff_token}"}
    )
    assert response.status_code == 200