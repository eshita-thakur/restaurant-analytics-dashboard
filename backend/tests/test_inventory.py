def test_stock_in_increases_quantity(client, owner_token):
    create_response = client.post(
        "/api/inventory",
        json={"item_name": "Paneer", "unit": "kg", "quantity_in_stock": 10, "reorder_level": 5, "unit_cost": 320},
        headers={"Authorization": f"Bearer {owner_token}"}
    )
    inventory_id = create_response.get_json()["item"]["inventory_id"]

    response = client.post(
        f"/api/inventory/{inventory_id}/stock-in",
        json={"quantity": 15},
        headers={"Authorization": f"Bearer {owner_token}"}
    )

    assert response.status_code == 200
    assert response.get_json()["item"]["quantity_in_stock"] == 25.0


def test_stock_out_decreases_quantity(client, owner_token):
    create_response = client.post(
        "/api/inventory",
        json={"item_name": "Chicken", "unit": "kg", "quantity_in_stock": 20, "reorder_level": 5, "unit_cost": 220},
        headers={"Authorization": f"Bearer {owner_token}"}
    )
    inventory_id = create_response.get_json()["item"]["inventory_id"]

    response = client.post(
        f"/api/inventory/{inventory_id}/stock-out",
        json={"quantity": 8},
        headers={"Authorization": f"Bearer {owner_token}"}
    )

    assert response.status_code == 200
    assert response.get_json()["item"]["quantity_in_stock"] == 12.0


def test_stock_out_cannot_exceed_available_stock(client, owner_token):
    create_response = client.post(
        "/api/inventory",
        json={"item_name": "Rice", "unit": "kg", "quantity_in_stock": 5, "reorder_level": 2, "unit_cost": 90},
        headers={"Authorization": f"Bearer {owner_token}"}
    )
    inventory_id = create_response.get_json()["item"]["inventory_id"]

    response = client.post(
        f"/api/inventory/{inventory_id}/stock-out",
        json={"quantity": 100},
        headers={"Authorization": f"Bearer {owner_token}"}
    )

    assert response.status_code == 400
    assert "Not enough stock" in response.get_json()["error"]


def test_transaction_history_records_movements(client, owner_token):
    create_response = client.post(
        "/api/inventory",
        json={"item_name": "Oil", "unit": "litre", "quantity_in_stock": 10, "reorder_level": 3, "unit_cost": 150},
        headers={"Authorization": f"Bearer {owner_token}"}
    )
    inventory_id = create_response.get_json()["item"]["inventory_id"]

    client.post(
        f"/api/inventory/{inventory_id}/stock-in",
        json={"quantity": 5},
        headers={"Authorization": f"Bearer {owner_token}"}
    )
    client.post(
        f"/api/inventory/{inventory_id}/stock-out",
        json={"quantity": 2},
        headers={"Authorization": f"Bearer {owner_token}"}
    )

    response = client.get(
        f"/api/inventory/{inventory_id}/transactions",
        headers={"Authorization": f"Bearer {owner_token}"}
    )

    transactions = response.get_json()
    assert len(transactions) == 2
    assert transactions[0]["transaction_type"] == "out"
    assert transactions[1]["transaction_type"] == "in"