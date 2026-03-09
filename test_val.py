import os
import sys
import django

sys.path.append('.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from professionals.serializers import ProfessionalSerializer

data = {
    'name': 'São Carlos',
    'specialty': 'dddddd',
    'crm': '3123123123',
    'phone': '(21) 981239054',
    'email': 'eu@nao.sei'
}

s = ProfessionalSerializer(data=data)
if not s.is_valid():
    print('Erros de Validacao:')
    print(s.errors)
else:
    print('Serializer Validou com Sucesso!')
