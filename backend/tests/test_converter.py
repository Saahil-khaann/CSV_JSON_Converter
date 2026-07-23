import os
import uuid
import pickle
import pytest
import pandas as pd
from fastapi.testclient import TestClient
from backend.main import app
from backend.infrastructure.converters.csv_converter import CsvToPickleConverter
from backend.infrastructure.converters.json_converter import JsonToPickleConverter

def test_csv_converter_strategy():
    converter = CsvToPickleConverter()
    assert converter.supports("data.csv") is True
    assert converter.supports("data.txt") is False

    csv_data = b"name,age\nAlice,30\nBob,25"
    df, pickle_bytes, meta = converter.convert(csv_data, "data.csv")

    assert len(df) == 2
    assert meta["row_count"] == 2
    assert "name" in meta["columns"]

    unpickled_df = pickle.loads(pickle_bytes)
    assert isinstance(unpickled_df, pd.DataFrame)
    assert len(unpickled_df) == 2

def test_json_converter_strategy():
    converter = JsonToPickleConverter()
    assert converter.supports("data.json") is True

    json_data = b'[{"item": "laptop", "qty": 5}, {"item": "phone", "qty": 10}]'
    df, pickle_bytes, meta = converter.convert(json_data, "data.json")

    assert len(df) == 2
    assert meta["row_count"] == 2
    assert "item" in meta["columns"]

    unpickled_df = pickle.loads(pickle_bytes)
    assert isinstance(unpickled_df, pd.DataFrame)
    assert unpickled_df.iloc[0]["item"] == "laptop"

def test_user_registration_and_uniqueness():
    with TestClient(app) as client:
        unique_suffix = uuid.uuid4().hex[:6]
        username = f"tester_{unique_suffix}"
        
        # Register user
        res1 = client.post("/api/users/register", json={"username": username})
        assert res1.status_code == 201
        data = res1.json()
        assert data["username"] == username
        user_id = data["id"]

        # Try registering exact same username (must fail with 400 Bad Request)
        res2 = client.post("/api/users/register", json={"username": username})
        assert res2.status_code == 400
        assert "already exists" in res2.json()["detail"]

def test_end_to_end_file_conversion_and_download():
    with TestClient(app) as client:
        unique_suffix = uuid.uuid4().hex[:6]
        username = f"e2e_user_{unique_suffix}"

        # Register test user
        reg_res = client.post("/api/users/register", json={"username": username})
        assert reg_res.status_code == 201
        user_id = reg_res.json()["id"]

        # Upload CSV file
        csv_bytes = b"id,val\n1,100\n2,200\n3,300"
        files = {"file": ("test_sample.csv", csv_bytes, "text/csv")}
        data = {"user_id": user_id}

        convert_res = client.post("/api/convert", files=files, data=data)
        assert convert_res.status_code == 200
        res_json = convert_res.json()

        assert res_json["row_count"] == 3
        assert res_json["file_type"] == "csv"
        file_id = res_json["file_id"]

        # Download pickle file
        dl_res = client.get(f"/api/download/{file_id}")
        assert dl_res.status_code == 200
        assert dl_res.headers["content-type"] == "application/octet-stream"
        
        # Verify downloaded content is valid pickle
        df_downloaded = pickle.loads(dl_res.content)
        assert len(df_downloaded) == 3

def test_csv_to_json_and_pickle_content_search():
    with TestClient(app) as client:
        unique_suffix = uuid.uuid4().hex[:6]
        username = f"search_user_{unique_suffix}"

        reg_res = client.post("/api/users/register", json={"username": username})
        assert reg_res.status_code == 201
        user_id = reg_res.json()["id"]

        # Convert CSV to JSON
        csv_bytes = b"city,country\nTokyo,Japan\nParis,France"
        files = {"file": ("cities.csv", csv_bytes, "text/csv")}
        data = {"user_id": user_id, "target_format": "json"}

        convert_res = client.post("/api/convert", files=files, data=data)
        assert convert_res.status_code == 200
        res_json = convert_res.json()
        assert res_json["target_format"] == "json"

        # Search for row value "Tokyo" inside pickle/dataset data
        history_res = client.get("/api/history?q=Tokyo")
        assert history_res.status_code == 200
        history_data = history_res.json()
        assert len(history_data) >= 1
        assert any(item["original_filename"] == "cities.csv" for item in history_data)

def test_telemetry_endpoint():
    with TestClient(app) as client:
        res = client.get("/api/telemetry/stats")
        assert res.status_code == 200
        data = res.json()
        assert "total_requests" in data
        assert "avg_response_time_ms" in data
