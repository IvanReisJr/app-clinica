from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Administrador'),
        ('receptionist', 'Recepção'),
        ('doctor', 'Médico'),
        ('enfermagem', 'Enfermagem'),
        ('farmacia', 'Farmácia'),
        ('financeiro', 'Financeiro'),
        ('painel', 'Painel'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='receptionist')
    full_name = models.CharField(max_length=255, null=True, blank=True)
    crm = models.CharField(max_length=20, null=True, blank=True)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
