from rest_framework import serializers
from .models import Convenio, ConvenioProcedimento

class ConvenioProcedimentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConvenioProcedimento
        fields = ['id', 'convenio', 'codigo_tuss', 'descricao', 'valor', 'ativo', 'created_at']
        read_only_fields = ['id', 'created_at']

class ConvenioSerializer(serializers.ModelSerializer):
    procedimentos = ConvenioProcedimentoSerializer(many=True, read_only=True)

    class Meta:
        model = Convenio
        fields = ['id', 'nome', 'registro_ans', 'tipo', 'telefone', 'email', 'ativo', 'observacoes', 'created_at', 'updated_at', 'procedimentos']
        read_only_fields = ['id', 'created_at', 'updated_at']
