from django.db import models
from django.conf import settings

class Medication(models.Model):
    name = models.CharField(max_length=255, verbose_name="Nome do Medicamento")
    lot_number = models.CharField(max_length=100, blank=True, null=True, verbose_name="Lote")
    expiration_date = models.DateField(blank=True, null=True, verbose_name="Data de Validade")
    quantity = models.IntegerField(default=0, verbose_name="Quantidade em Estoque")
    provider = models.CharField(max_length=255, blank=True, null=True, verbose_name="Fornecedor")
    observations = models.TextField(blank=True, null=True, verbose_name="Observações")
    is_active = models.BooleanField(default=True, verbose_name="Ativo")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = "Medicamento"
        verbose_name_plural = "Medicamentos"

    def __str__(self):
        return self.name

class MedicationMovement(models.Model):
    MOVEMENT_TYPES = (
        ('entrada', 'Entrada'),
        ('saida', 'Saída'),
        ('ajuste', 'Ajuste'),
        ('vencimento', 'Vencimento'),
    )

    medication = models.ForeignKey(Medication, on_delete=models.CASCADE, related_name='movements')
    quantity = models.IntegerField(verbose_name="Quantidade Movimentada")
    type = models.CharField(max_length=20, choices=MOVEMENT_TYPES, verbose_name="Tipo")
    description = models.TextField(blank=True, null=True, verbose_name="Descrição/Motivo")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, verbose_name="Usuário")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data/Hora")

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Movimentação de Medicamento"
        verbose_name_plural = "Movimentações de Medicamentos"

    def __str__(self):
        return f"{self.type} - {self.medication.name} ({self.quantity})"
