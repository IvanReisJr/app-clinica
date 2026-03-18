import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from professionals.models import ProfessionalSchedule

print(list(ProfessionalSchedule.objects.all().values()))
