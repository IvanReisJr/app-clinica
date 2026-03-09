from django.db import models
from django.conf import settings

class Professional(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='professional_profile')
    name = models.CharField(max_length=255, db_index=True)
    specialty = models.CharField(max_length=255, null=True, blank=True, db_index=True)
    crm = models.CharField(max_length=50, null=True, blank=True, db_index=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    email = models.EmailField(null=True, blank=True, db_index=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
