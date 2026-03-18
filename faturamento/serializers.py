from rest_framework import serializers
from .models import BillingLot, BillingItem
from appointments.models import Appointment
from convenios.models import Convenio

class BillingItemSerializer(serializers.ModelSerializer):
    atendimento_id = serializers.IntegerField(source='appointment.id', read_only=True)
    data = serializers.DateField(source='appointment.appointment_date', read_only=True)
    paciente = serializers.CharField(source='appointment.patient.full_name', read_only=True)
    carteirinha = serializers.SerializerMethodField(read_only=True)
    profissional = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = BillingItem
        fields = ['id', 'atendimento_id', 'data', 'paciente', 'carteirinha', 'profissional', 'status_conciliacao']

    def get_carteirinha(self, obj):
        return obj.appointment.patient.numero_carteirinha or ""

    def get_profissional(self, obj):
        prof = obj.appointment.professional
        return prof.name if prof else "—"

class BillingLotSerializer(serializers.ModelSerializer):
    itens = BillingItemSerializer(many=True, read_only=True)
    convenio_nome = serializers.CharField(source='convenio.nome', read_only=True)

    class Meta:
        model = BillingLot
        fields = ['id', 'convenio', 'convenio_nome', 'status', 'created_at', 'sent_at', 'itens']
        read_only_fields = ['created_at']

class PendingAppointmentSerializer(serializers.ModelSerializer):
    """
    Serializer read-only to list appointments that are pending billing
    """
    convenio_nome = serializers.CharField(source='patient.convenio.nome', read_only=True)
    convenio_id = serializers.IntegerField(source='patient.convenio.id', read_only=True)
    paciente_nome = serializers.CharField(source='patient.full_name', read_only=True)
    carteirinha = serializers.CharField(source='patient.numero_carteirinha', read_only=True)
    profissional_nome = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = ['id', 'appointment_date', 'paciente_nome', 'carteirinha', 'profissional_nome', 'convenio_id', 'convenio_nome', 'status']

    def get_profissional_nome(self, obj):
        prof = obj.professional
        return prof.name if prof else "—"
