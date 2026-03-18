import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from professionals.models import Professional
print("Professionals:", list(Professional.objects.values('id', 'name')))
