import pytest


def _create_employee(client, owner_token):
    response = client.post(
        "/api/employees",
        json={
            "first_name": "Ravi", "last_name": "Kumar", "position": "Waiter",
            "salary": 20000, "hire_date": "2025-01-01"
        },
        headers={"Authorization": f"Bearer {owner_token}"}
    )
    return response.get_json()["employee"]["employee_id"]


def _create_menu_item(client, owner_token):
    category_response = client.post(
        "/api/menu/categories",
        json={"name": "Mains"},
        headers={"Authorization": f"Bearer {owner_token}"}
    )
    category_id = category_response.get_json()["category"]["category_id"]

    item_response = client.post(
        "/api/menu/items",
        json={"name": "Butter Chicken", "price": 380, "cost_price": 150, "category_id": category_id},
        headers={"Authorization": f"Bearer {owner_token}"}
    )
    return item_response.get_json()["item"]["item_id"]


@pytest.fixture
def setup_order_data(client, owner_token):
    return {
        "employee_id": _create_employee(client, owner_token),
        "item_id": _create_menu_item(client, owner_token),
    }


def test_create_order_calculates_total_correctly(client, owner_token, setup_order_data):
    response = client.post(
        "/api/orders",
        json={
            "employee_id": setup_order_data["employee_id"],
            "items": [{"item_id": setup_order_data["item_id"], "quantity": 2}]
        },
        headers={"Authorization": f"Bearer {owner_token}"}
    )

    assert response.status_code == 201
    data = response.get_json()["order"]
    assert data["total_amount"] == 760.0
    assert data["status"] == "pending"


def test_order_rejects_unavailable_item(client, owner_token, setup_order_data):
    client.put(
        f"/api/menu/items/{setup_order_data['item_id']}",
        json={"is_available": False},
        headers={"Authorization": f"Bearer {owner_token}"}
    )

    response = client.post(
        "/api/orders",
        json={
            "employee_id": setup_order_data["employee_id"],
            "items": [{"item_id": setup_order_data["item_id"], "quantity": 1}]
        },
        headers={"Authorization": f"Bearer {owner_token}"}
    )

    assert response.status_code == 400
    assert "unavailable" in response.get_json()["error"]


def test_order_rejects_invalid_item_id(client, owner_token, setup_order_data):
    response = client.post(
        "/api/orders",
        json={
            "employee_id": setup_order_data["employee_id"],
            "items": [{"item_id": 9999, "quantity": 1}]
        },
        headers={"Authorization": f"Bearer {owner_token}"}
    )

    assert response.status_code == 400


def test_order_status_lifecycle(client, owner_token, setup_order_data):
    create_response = client.post(
        "/api/orders",
        json={
            "employee_id": setup_order_data["employee_id"],
            "items": [{"item_id": setup_order_data["item_id"], "quantity": 1}]
        },
        headers={"Authorization": f"Bearer {owner_token}"}
    )
    order_id = create_response.get_json()["order"]["order_id"]

    for status in ["preparing", "served", "completed"]:
        response = client.put(
            f"/api/orders/{order_id}/status",
            json={"status": status},
            headers={"Authorization": f"Bearer {owner_token}"}
        )
        assert response.status_code == 200
        assert response.get_json()["order"]["status"] == status


def test_completed_order_cannot_be_cancelled(client, owner_token, setup_order_data):
    create_response = client.post(
        "/api/orders",
        json={
            "employee_id": setup_order_data["employee_id"],
            "items": [{"item_id": setup_order_data["item_id"], "quantity": 1}]
        },
        headers={"Authorization": f"Bearer {owner_token}"}
    )
    order_id = create_response.get_json()["order"]["order_id"]

    client.put(
        f"/api/orders/{order_id}/status",
        json={"status": "completed"},
        headers={"Authorization": f"Bearer {owner_token}"}
    )

    response = client.put(
        f"/api/orders/{order_id}/status",
        json={"status": "cancelled"},
        headers={"Authorization": f"Bearer {owner_token}"}
    )

    assert response.status_code == 400