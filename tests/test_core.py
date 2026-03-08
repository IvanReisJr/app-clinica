"""
Testes Unitários Básicos - Módulo Core/Users
Valida se a configuração do ambiente mínimo de testes está operacional.
"""
import pytest

# Exemplo de teste simples sem necessidade inicial do BD (setup sanity check)
def test_environment_sanity():
    assert True

# @pytest.mark.django_db
# def test_user_creation():
#     from django.contrib.auth.models import User
#     user = User.objects.create_user('testuser', 'test@example.com', 'testpassword')
#     assert user.username == 'testuser'
#     assert user.check_password('testpassword') is True
