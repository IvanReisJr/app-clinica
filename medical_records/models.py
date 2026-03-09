from django.db import models
from patients.models import Patient
from professionals.models import Professional
from appointments.models import Appointment

class MedicalRecord(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='records')
    professional = models.ForeignKey(Professional, on_delete=models.RESTRICT, related_name='records')
    appointment = models.ForeignKey(Appointment, on_delete=models.SET_NULL, null=True, blank=True, related_name='records')
    
    record_date = models.DateTimeField(auto_now_add=True)
    chief_complaint = models.TextField(blank=True, null=True, verbose_name="Queixa Principal")
    clinical_evolution = models.TextField(blank=True, null=True, verbose_name="Evolução Clínica")
    diagnosis = models.CharField(max_length=255, blank=True, null=True, verbose_name="Diagnóstico (CID)")
    notes = models.TextField(blank=True, null=True, verbose_name="Observações Livres")
    
    # Atestado
    atestado_dias = models.IntegerField(blank=True, null=True, verbose_name="Dias de Afastamento")
    atestado_inicio = models.DateField(blank=True, null=True, verbose_name="Início do Afastamento")
    atestado_retorno = models.DateField(blank=True, null=True, verbose_name="Retorno")
    atestado_observacoes = models.TextField(blank=True, null=True, verbose_name="Observações do Atestado")

    class Meta:
        ordering = ['-record_date']

    def __str__(self):
        return f"Record for {self.patient.full_name} on {self.record_date.date()}"

class Prescription(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='prescriptions')
    professional = models.ForeignKey(Professional, on_delete=models.RESTRICT, related_name='prescriptions')
    appointment = models.ForeignKey(Appointment, on_delete=models.SET_NULL, null=True, blank=True, related_name='prescriptions')
    
    medication = models.CharField(max_length=255, verbose_name="Medicamento")
    dose = models.CharField(max_length=255, blank=True, null=True, verbose_name="Dose")
    frequency = models.CharField(max_length=255, blank=True, null=True, verbose_name="Frequência")
    duration = models.CharField(max_length=255, blank=True, null=True, verbose_name="Duração")
    notes = models.TextField(blank=True, null=True, verbose_name="Observações")
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.medication} - {self.patient.full_name}"
