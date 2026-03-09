from django.db import models
from patients.models import Patient
from professionals.models import Professional

class Appointment(models.Model):
    STATUS_CHOICES = (
        ('agendado', 'Agendado'),
        ('confirmado', 'Confirmado'),
        ('aguardando', 'Aguardando'),
        ('triagem', 'Triagem'),
        ('em_atendimento', 'Em Atendimento'),
        ('atendido', 'Atendido'),
        ('faltou', 'Faltou'),
        ('cancelado', 'Cancelado'),
    )

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='appointments')
    professional = models.ForeignKey(Professional, on_delete=models.SET_NULL, null=True, blank=True, related_name='appointments')
    
    appointment_date = models.DateField(db_index=True)
    appointment_time = models.TimeField()
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='agendado', db_index=True)
    
    notes = models.TextField(blank=True, null=True)
    attendance_number = models.IntegerField(blank=True, null=True, help_text="Número da senha/fila de atendimento")
    room = models.CharField(max_length=50, blank=True, null=True, help_text="Consultório/Sala")
    
    is_encaixe = models.BooleanField(default=False)
    confirmed_at = models.DateTimeField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['appointment_date', 'appointment_time']
        verbose_name = 'Agendamento'
        verbose_name_plural = 'Agendamentos'

    def __str__(self):
        prof_name = self.professional.name if self.professional else "Sem Profissional"
        return f"{self.patient.full_name} com {prof_name} em {self.appointment_date} {self.appointment_time}"
