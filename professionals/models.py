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

class ProfessionalSchedule(models.Model):
    professional = models.ForeignKey(Professional, on_delete=models.CASCADE, related_name='schedules')
    day_of_week = models.IntegerField(choices=[
        (0, 'Domingo'), (1, 'Segunda'), (2, 'Terça'), (3, 'Quarta'),
        (4, 'Quinta'), (5, 'Sexta'), (6, 'Sábado')
    ])
    start_time = models.TimeField()
    end_time = models.TimeField()
    slot_duration_minutes = models.IntegerField(default=30)
    active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('professional', 'day_of_week')

    def __str__(self):
        return f"{self.professional.name} - {self.day_of_week}: {self.start_time} às {self.end_time}"
