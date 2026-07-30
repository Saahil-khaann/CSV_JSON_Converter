import os
import uuid
import pytest
from fastapi.testclient import TestClient
from backend.main import app

def test_dataset_records_crud_flow():
    with TestClient(app) as client:
        # 1. Register a user
        unique_suffix = uuid.uuid4().hex[:6]
        username = f"crud_tester_{unique_suffix}"
        user_res = client.post("/api/users/register", json={"username": username})
        assert user_res.status_code == 201
        user_id = user_res.json()["id"]

        # 2. Upload / Convert a CSV file to JSON format
        csv_content = b"name,city\nShelby,Dallas\nPhilip,Austin"
        files = {"file": ("people.csv", csv_content, "text/csv")}
        form_data = {
            "user_id": user_id,
            "remove_duplicates": "false",
            "target_format": "json"
        }
        convert_res = client.post("/api/convert", files=files, data=form_data)
        assert convert_res.status_code == 200
        result = convert_res.json()
        file_id = result["file_id"]
        assert result["row_count"] == 2

        # 3. GET /api/records/{file_id} - Read records
        read_res = client.get(f"/api/records/{file_id}")
        assert read_res.status_code == 200
        data = read_res.json()
        assert data["file_id"] == file_id
        assert len(data["rows"]) == 2
        assert data["rows"][0]["name"] == "Shelby"

        # 4. POST /api/records/{file_id} - Add a new record
        new_row = {"name": "Charlie", "city": "Houston"}
        add_res = client.post(f"/api/records/{file_id}", json=new_row)
        assert add_res.status_code == 200
        add_data = add_res.json()
        assert add_data["row_count"] == 3
        assert len(add_data["rows"]) == 3
        assert add_data["rows"][2]["name"] == "Charlie"

        # 5. PUT /api/records/{file_id}/{row_index} - Update the record
        updated_row = {"name": "Charlie Updated", "city": "Houston"}
        update_res = client.put(f"/api/records/{file_id}/2", json=updated_row)
        assert update_res.status_code == 200
        update_data = update_res.json()
        assert update_data["rows"][2]["name"] == "Charlie Updated"

        # 6. DELETE /api/records/{file_id}/{row_index} - Delete the record
        delete_res = client.delete(f"/api/records/{file_id}/2")
        assert delete_res.status_code == 200
        delete_data = delete_res.json()
        assert delete_data["row_count"] == 2
        assert len(delete_data["rows"]) == 2
        assert all(row["name"] != "Charlie Updated" for row in delete_data["rows"])
