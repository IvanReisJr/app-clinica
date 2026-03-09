import os
import sys
import django
import json

sys.path.append('.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.test.client import Client
from professionals.views import ProfessionalViewSet

ProfessionalViewSet.permission_classes = []

c = Client()

data = {
    'name': 'São Carlos',
    'specialty': 'dddddd',
    'crm': '3123123123',
    'phone': '(21) 981239054',
    'email': 'eu@nao.sei'
}

resp = c.post('/api/v1/professionals/', json.dumps(data), content_type='application/json')
print(f'Status: {resp.status_code}')
print(f'Body: {resp.content.decode("utf-8")}')
