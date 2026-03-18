import pytest
import factory
from django.contrib.auth import get_user_model
from patients.models import Patient

User = get_user_model()

class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    username = factory.Sequence(lambda n: f"user_{n}")
    email = factory.LazyAttribute(lambda o: f"{o.username}@example.com")
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    # Defina a role se for obrigatória. Exemplo:
    # role = 'coordenacao'
    is_active = True

class PatientFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Patient

    full_name = factory.Faker("name", locale="pt_BR")
    cpf = factory.Sequence(lambda n: f"000000000{n}"[-11:])
    date_of_birth = factory.Faker("date_of_birth", minimum_age=5, maximum_age=90)
    gender = factory.Iterator(['M', 'F'])
    # fk
    user = factory.SubFactory(UserFactory)

# Registrar no pytest para que possamos usar "user_factory" como argumento de fixture nas funções:
from pytest_factoryboy import register
register(UserFactory)
register(PatientFactory)

@pytest.fixture
def auth_client(client, user_factory):
    """Fixture para retornar um unauthenticated test client."""
    # Retorna o client padrão do Django e um usuario dummy
    user = user_factory()
    client.force_login(user)
    return client, user
