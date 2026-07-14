def test_create_category_requires_auth(client):
    response = client.post("/api/menu/categories", json={"name": "Starters"})
    assert response.status_code == 401


def test_create_category_with_auth(client, owner_token):
    response = client.post(
        "/api/menu/categories",
        json={"name": "Starters", "description": "Small plates"},
        headers={"Authorization": f"Bearer {owner_token}"}
    )
    assert response.status_code == 201
    assert response.get_json()["category"]["name"] == "Starters"


def test_get_categories_is_public(client, owner_token):
    client.post(
        "/api/menu/categories",
        json={"name": "Mains"},
        headers={"Authorization": f"Bearer {owner_token}"}
    )

    response = client.get("/api/menu/categories")
    assert response.status_code == 200
    assert len(response.get_json()) == 1


def test_create_item_requires_valid_category(client, owner_token):
    response = client.post(
        "/api/menu/items",
        json={"name": "Fake Dish", "price": 100, "category_id": 999},
        headers={"Authorization": f"Bearer {owner_token}"}
    )
    assert response.status_code == 400


def test_create_and_fetch_item(client, owner_token):
    category_response = client.post(
        "/api/menu/categories",
        json={"name": "Desserts"},
        headers={"Authorization": f"Bearer {owner_token}"}
    )
    category_id = category_response.get_json()["category"]["category_id"]

    item_response = client.post(
        "/api/menu/items",
        json={"name": "Gulab Jamun", "price": 80, "category_id": category_id},
        headers={"Authorization": f"Bearer {owner_token}"}
    )
    assert item_response.status_code == 201

    list_response = client.get("/api/menu/items")
    items = list_response.get_json()
    assert len(items) == 1
    assert items[0]["name"] == "Gulab Jamun"


def test_toggle_item_availability(client, owner_token):
    category_response = client.post(
        "/api/menu/categories",
        json={"name": "Drinks"},
        headers={"Authorization": f"Bearer {owner_token}"}
    )
    category_id = category_response.get_json()["category"]["category_id"]

    item_response = client.post(
        "/api/menu/items",
        json={"name": "Lassi", "price": 60, "category_id": category_id},
        headers={"Authorization": f"Bearer {owner_token}"}
    )
    item_id = item_response.get_json()["item"]["item_id"]

    update_response = client.put(
        f"/api/menu/items/{item_id}",
        json={"is_available": False},
        headers={"Authorization": f"Bearer {owner_token}"}
    )
    assert update_response.status_code == 200

    get_response = client.get(f"/api/menu/items/{item_id}")
    assert get_response.get_json()["is_available"] is False