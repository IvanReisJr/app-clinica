from django.db import models
from convenios.models import Convenio
from appointments.models import Appointment

class BillingLot(models.Model):
    STATUS_CHOICES = (
        ('aberto', 'Aberto'),
        ('enviado', 'Enviado'),
    )
    convenio = models.ForeignKey(Convenio, on_delete=models.CASCADE, related_name='billing_lots')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='aberto', db_index=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Lote #{self.id} - {self.convenio.nome} ({self.status})"

    class Meta:
        verbose_name = 'Lote de Faturamento'
        verbose_name_plural = 'Lotes de Faturamento'
        ordering = ['-created_at']

class BillingItem(models.Model):
    STATUS_CHOICES = (
        ('pendente', 'Pendente'),
        ('pago', 'Pago'),
        ('glosa', 'Glosa'),
        ('recurso', 'Recurso'),
    )
    billing_lot = models.ForeignKey(BillingLot, on_delete=models.CASCADE, related_name='items')
    # Use OneToOneField so an appointment can only be billed in one lot at a time.
    appointment = models.OneToOneField(Appointment, on_delete=models.CASCADE, related_name='billing_item')
    status_conciliacao = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pendente', db_index=True)
    
    def __str__(self):
        return f"Item Lote {self.billing_lot.id} - Atendimento #{self.appointment.id}"

    class Meta:
        verbose_name = 'Item de Faturamento'
        verbose_name_plural = 'Itens de Faturamento'
        ordering = ['id']
