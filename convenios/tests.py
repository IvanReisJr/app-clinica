import pytest
from rest_framework.test import APIClient
from convenios.models import Convenio, ConvenioProcedimento
from users.models import CustomUser

@pytest.fixture
def auth_client():
    client = APIClient()
    user = CustomUser.objects.create_user(username='testuser', password='testpassword123', full_name='Test User')
    client.force_authenticate(user=user)
    return client

@pytest.fixture
def convenio_data():
    return {
        "nome": "Unimed",
        "registro_ans": "123456",
        "tipo": "convenio",
        "telefone": "11999999999",
        "email": "contato@unimed.com.br",
        "ativo": True
    }

@pytest.mark.django_db
class TestConveniosAPI:
    def test_criar_convenio(self, auth_client, convenio_data):
        response = auth_client.post('/api/v1/convenios/lista/', convenio_data, format='json')
        assert response.status_code == 201
        assert response.data['nome'] == 'Unimed'
        assert Convenio.objects.count() == 1

    def test_listar_convenios(self, auth_client, convenio_data):
        Convenio.objects.create(**convenio_data)
        response = auth_client.get('/api/v1/convenios/lista/')
        assert response.status_code == 200
        # Dependendo da paginação global do DRF, pode ser uma lista direta ou ter chave 'results'
        results = response.data['results'] if 'results' in response.data else response.data
        assert len(results) == 1
        assert results[0]['nome'] == 'Unimed'

    def test_criar_procedimento_tuss(self, auth_client, convenio_data):
        convenio = Convenio.objects.create(**convenio_data)
        procedimento_data = {
            "convenio": str(convenio.id),
            "codigo_tuss": "10101012",
            "descricao": "Consulta em Consultório",
            "valor": "150.00"
        }
        response = auth_client.post('/api/v1/convenios/procedimentos/', procedimento_data, format='json')
        assert response.status_code == 201
        assert response.data['codigo_tuss'] == '10101012'
        assert ConvenioProcedimento.objects.count() == 1

    def test_listar_procedimentos_convenio(self, auth_client, convenio_data):
        convenio = Convenio.objects.create(**convenio_data)
        ConvenioProcedimento.objects.create(
            convenio=convenio,
            codigo_tuss="10101012",
            descricao="Consulta em Consultório",
            valor=150.00
        )
        # Filtra os procedimentos usando query param
        response = auth_client.get(f'/api/v1/convenios/procedimentos/?convenio={convenio.id}')
        assert response.status_code == 200
        results = response.data['results'] if 'results' in response.data else response.data
        assert len(results) == 1
        assert results[0]['codigo_tuss'] == '10101012'
