from django.contrib import admin
from .models import Convenio, ConvenioProcedimento

class ConvenioProcedimentoInline(admin.TabularInline):
    model = ConvenioProcedimento
    extra = 1

@admin.register(Convenio)
class ConvenioAdmin(admin.ModelAdmin):
    list_display = ('nome', 'registro_ans', 'tipo', 'ativo')
    list_filter = ('ativo', 'tipo')
    search_fields = ('nome', 'registro_ans')
    inlines = [ConvenioProcedimentoInline]

@admin.register(ConvenioProcedimento)
class ConvenioProcedimentoAdmin(admin.ModelAdmin):
    list_display = ('codigo_tuss', 'descricao', 'convenio', 'valor', 'ativo')
    list_filter = ('ativo', 'convenio')
    search_fields = ('codigo_tuss', 'descricao')
