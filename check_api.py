import sys
sys.path.append('c:/IvanReis/Projetos/Pessoal/Clinica/app_clinica')

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from rest_framework.test import APIClient
from professionals.models import ProfessionalSchedule

print("Records in DB:", ProfessionalSchedule.objects.filter(active=True).count())

client = APIClient()
# Add authentication if needed, but for GET it requires IsAuthenticated?
# Ah! ViewSet has permission_classes = [IsAuthenticated] !!
from users.models import CustomUser
user = CustomUser.objects.first()
client.force_authenticate(user=user)

resp = client.get('/api/v1/professional-schedules/?active=true')
print("Status:", resp.status_code)
print("Data:", resp.json() if resp.status_code == 200 else resp.content)
