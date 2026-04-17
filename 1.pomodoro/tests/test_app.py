import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from app import create_app


@pytest.fixture
def app():
    app = create_app(test_config={"TESTING": True})
    return app


@pytest.fixture
def client(app):
    return app.test_client()


class TestIndex:
    """GET / のテスト"""

    def test_returns_200(self, client):
        response = client.get("/")
        assert response.status_code == 200

    def test_content_type_is_html(self, client):
        response = client.get("/")
        assert "text/html" in response.content_type

    def test_contains_timer_display(self, client):
        response = client.get("/")
        html = response.data.decode("utf-8")
        assert 'id="timer-display"' in html

    def test_contains_start_button(self, client):
        response = client.get("/")
        html = response.data.decode("utf-8")
        assert 'id="btn-start"' in html

    def test_contains_pause_button(self, client):
        response = client.get("/")
        html = response.data.decode("utf-8")
        assert 'id="btn-pause"' in html

    def test_contains_reset_button(self, client):
        response = client.get("/")
        html = response.data.decode("utf-8")
        assert 'id="btn-reset"' in html

    def test_contains_skip_button(self, client):
        response = client.get("/")
        html = response.data.decode("utf-8")
        assert 'id="btn-skip"' in html

    def test_contains_settings_form(self, client):
        response = client.get("/")
        html = response.data.decode("utf-8")
        assert 'id="settings-form"' in html

    def test_contains_css_link(self, client):
        response = client.get("/")
        html = response.data.decode("utf-8")
        assert "style.css" in html

    def test_contains_js_link(self, client):
        response = client.get("/")
        html = response.data.decode("utf-8")
        assert "app.js" in html

    def test_contains_phase_label(self, client):
        response = client.get("/")
        html = response.data.decode("utf-8")
        assert 'id="phase-label"' in html

    def test_contains_set_count(self, client):
        response = client.get("/")
        html = response.data.decode("utf-8")
        assert 'id="set-count"' in html


class TestCreateApp:
    """create_app のテスト"""

    def test_creates_app(self):
        app = create_app()
        assert app is not None

    def test_testing_flag_off_by_default(self):
        app = create_app()
        assert app.testing is False

    def test_testing_flag_with_test_config(self):
        app = create_app(test_config={"TESTING": True})
        assert app.testing is True

    def test_custom_config_applied(self):
        app = create_app(test_config={"MY_KEY": "my_value"})
        assert app.config["MY_KEY"] == "my_value"


class TestStaticFiles:
    """静的ファイル配信のテスト"""

    def test_css_served(self, client):
        response = client.get("/static/css/style.css")
        assert response.status_code == 200
        assert "text/css" in response.content_type

    def test_js_served(self, client):
        response = client.get("/static/js/app.js")
        assert response.status_code == 200
        assert "javascript" in response.content_type
