from django.db import models

class SystemSetting(models.Model):
    key = models.CharField(max_length=255, unique=True, verbose_name="Chave")
    value = models.TextField(verbose_name="Valor")
    description = models.TextField(blank=True, null=True, verbose_name="Descrição")
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.key

    class Meta:
        verbose_name = "Configuração de Sistema"
        verbose_name_plural = "Configurações de Sistema"
