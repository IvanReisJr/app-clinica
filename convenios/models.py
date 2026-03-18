import uuid
from django.db import models

class Convenio(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nome = models.CharField(max_length=255, verbose_name="Nome do Convênio")
    registro_ans = models.CharField(max_length=50, blank=True, null=True, verbose_name="Registro ANS")
    tipo = models.CharField(max_length=100, default='convenio', verbose_name="Tipo")
    telefone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Telefone")
    email = models.EmailField(blank=True, null=True, verbose_name="E-mail")
    ativo = models.BooleanField(default=True, verbose_name="Ativo")
    observacoes = models.TextField(blank=True, null=True, verbose_name="Observações")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nome

    class Meta:
        db_table = 'convenios'
        verbose_name = 'Convênio'
        verbose_name_plural = 'Convênios'
        ordering = ['nome']

class ConvenioProcedimento(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    convenio = models.ForeignKey(Convenio, on_delete=models.CASCADE, related_name='procedimentos')
    codigo_tuss = models.CharField(max_length=20, verbose_name="Código TUSS")
    descricao = models.CharField(max_length=255, verbose_name="Descrição TUSS")
    valor = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Valor (R$)")
    ativo = models.BooleanField(default=True, verbose_name="Ativo")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.codigo_tuss} - {self.descricao}"

    class Meta:
        db_table = 'convenio_procedimentos'
        verbose_name = 'Procedimento do Convênio'
        verbose_name_plural = 'Procedimentos do Convênio'
        ordering = ['codigo_tuss']
