import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import CustomUser

u = CustomUser.objects.filter(username='admin').first()
if u:
    u.set_password('123')
    u.save()
    print('USER FOUND AND PASSWORD SET TO 123')
else:
    u = CustomUser.objects.create_superuser('admin', 'admin@example.com', '123')
    print('USER CREATED WITH PASSWORD 123')
