import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from medications.models import Medication

User = get_user_model()

@pytest.fixture
def api_client():
    client = APIClient()
    user = User.objects.create_user(username='testuser', password='password123')
    client.force_authenticate(user=user)
    return client

@pytest.mark.django_db
class TestMedicationAPI:
    def test_create_medication(self, api_client):
        payload = {
            "name": "Dipirona 500mg",
            "lot_number": "L-12345",
            "expiration_date": "2026-12-31",
            "quantity": 100,
            "provider": "MedLabs"
        }
        response = api_client.post("/api/v1/medications/", payload, format='json')
        assert response.status_code == 201
        assert response.data["name"] == "Dipirona 500mg"
        assert response.data["is_active"] is True

    def test_list_active_medications(self, api_client):
        Medication.objects.create(name="Ativo", is_active=True)
        Medication.objects.create(name="Inativo", is_active=False)
        
        response = api_client.get("/api/v1/medications/?is_active=true")
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]["name"] == "Ativo"

    def test_toggle_medication_status(self, api_client):
        med = Medication.objects.create(name="Remédio Teste", is_active=True)
        response = api_client.post(f"/api/v1/medications/{med.id}/toggle_status/")
        assert response.status_code == 200
        assert response.data["is_active"] is False
        
        med.refresh_from_db()
        assert med.is_active is False

    def test_update_medication(self, api_client):
        med = Medication.objects.create(name="Antigo", quantity=10)
        payload = {"name": "Novo", "quantity": 25}
        response = api_client.patch(f"/api/v1/medications/{med.id}/", payload, format='json')
        assert response.status_code == 200
        assert response.data["name"] == "Novo"
        assert response.data["quantity"] == 25
