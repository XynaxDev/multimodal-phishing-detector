import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "version" in data


def test_status():
    res = client.get("/api/v1/status")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "models" in data
    assert "llm" in data
    assert data["llm"]["provider"] == "groq"
    assert data["llm"]["model"] == "qwen/qwen3.8-27b"


def test_analyze_text():
    res = client.post(
        "/api/v1/analyze/text",
        json={"text": "URGENT: Your account has been suspended. Click here to verify immediately."},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["mode"] == "text"
    assert data["label"] in ["benign", "phishing"]
    assert "probs" in data
    assert "explanation" in data
    assert "phishing_score" in data
    assert "latency_ms" in data


def test_analyze_url():
    res = client.post(
        "/api/v1/analyze/url",
        json={"url": "http://paypal-verification-update.com/login"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["mode"] == "url"
    assert data["label"] in ["benign", "phishing", "malware"]
    assert "probs" in data
    assert "benign" in data["probs"]
    assert "phishing" in data["probs"]
    assert "malware" in data["probs"]


def test_chat():
    res = client.post(
        "/api/v1/chat",
        data={"query": "Hello, how can you help me?"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] in ["chat", "url_check", "text_message", "image_check"]
    assert "reply" in data or "explanation" in data


def test_validation_error():
    res = client.post(
        "/api/v1/analyze/text",
        json={"text": ""},
    )
    assert res.status_code == 422
    data = res.json()
    assert "error" in data


def test_legacy_text_check():
    res = client.post(
        "/api/text_check",
        json={"text": "Your account has been suspended."},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["mode"] == "text"
    assert "label" in data
    assert "probs" in data


def test_legacy_url_check():
    res = client.post(
        "/api/url_check",
        json={"url": "http://google.com"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["mode"] == "url"
    assert "probs" in data


def test_uber_otp_calibration():
    res = client.post(
        "/api/v1/analyze/text",
        json={"text": "Your Uber verification code is 492104. Never share this code with anyone."},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["label"] == "benign"
    assert data["probs"]["benign"] > 0.95


def test_github_url_calibration():
    res = client.post(
        "/api/v1/analyze/url",
        json={"url": "https://github.com/XynaxDev"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["label"] == "benign"
    assert data["probs"]["benign"] > 0.95


def test_malware_url_preservation():
    res = client.post(
        "/api/v1/analyze/url",
        json={"url": "http://196.251.115.74/golden/check0spamhaus0org.i686"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["label"] == "malware"
    assert data["probs"]["malware"] > 0.90


def test_stackoverflow_subpath_url():
    res = client.post(
        "/api/v1/analyze/url",
        json={"url": "https://stackoverflow.com/questions/12345/how-to-fix-bug"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["label"] == "benign"
    assert data["probs"]["benign"] > 0.90


def test_phishing_lookalike_url():
    res = client.post(
        "/api/v1/analyze/url",
        json={"url": "http://paypal-verification-update.com/login"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["label"] == "phishing"
    assert data["probs"]["phishing"] > 0.90


def test_security_headers():
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    assert res.headers.get("X-Content-Type-Options") == "nosniff"
    assert res.headers.get("X-Frame-Options") == "DENY"
    assert "strict-origin" in res.headers.get("Referrer-Policy", "")


def test_health_exempt_from_rate_limit():
    # Health checks should never be rate limited
    for _ in range(10):
        res = client.get("/api/v1/health")
        assert res.status_code == 200


def test_byo_llm_headers():
    res = client.post(
        "/api/v1/analyze/text",
        headers={
            "X-LLM-Provider": "gemini",
            "X-LLM-Api-Key": "test-mock-gemini-key",
            "X-LLM-Model": "gemini-1.5-flash",
        },
        json={"text": "Your account has been suspended. Click here to verify."},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["mode"] == "text"
    assert data["llm_provider"] == "gemini"
    assert data["llm_model"] == "gemini-1.5-flash"


def test_custom_key_rate_limit_bypass():
    for _ in range(5):
        res = client.post(
            "/api/v1/analyze/text",
            headers={"X-LLM-Api-Key": "my-custom-key", "X-LLM-Provider": "groq"},
            json={"text": "URGENT verification needed: account security update."},
        )
        assert res.status_code == 200


def test_cooldown_extraction_logic():
    from app.services.llm import extract_retry_seconds
    import requests
    from unittest.mock import MagicMock

    # Test Header
    mock_resp1 = MagicMock(spec=requests.Response)
    mock_resp1.headers = {"retry-after": "22.5"}
    mock_resp1.text = ""
    assert extract_retry_seconds(mock_resp1) == 22.5

    # Test Groq error body regex
    mock_resp2 = MagicMock(spec=requests.Response)
    mock_resp2.headers = {}
    mock_resp2.text = '{"error": {"message": "Rate limit reached. Please try again in 14.8s."}}'
    assert extract_retry_seconds(mock_resp2) == 14.8

    # Test "retry after Xs"
    mock_resp3 = MagicMock(spec=requests.Response)
    mock_resp3.headers = {}
    mock_resp3.text = '{"error": {"message": "Rate limit exceeded, retry after 9.2s"}}'
    assert extract_retry_seconds(mock_resp3) == 9.2


def test_llm_models_missing_key():
    res = client.get("/api/v1/llm/models", params={"provider": "groq"})
    assert res.status_code == 422  # missing header


def test_llm_verify_bad_key():
    # Bad key to Groq returns 401
    res = client.post(
        "/api/v1/llm/verify",
        params={"provider": "groq", "model": "qwen/qwen3.8-27b"},
        headers={"X-LLM-Api-Key": "gsk_invalid_test_key_12345"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["ok"] is False
    assert data["status"] in [401, 403]
