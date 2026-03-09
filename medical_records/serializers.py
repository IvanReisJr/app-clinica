from rest_framework import serializers
from .models import MedicalRecord, Prescription

class MedicalRecordSerializer(serializers.ModelSerializer):
    professional_detail = serializers.SerializerMethodField()

    class Meta:
        model = MedicalRecord
        fields = [
            'id', 'patient', 'professional', 'appointment', 'record_date',
            'chief_complaint', 'clinical_evolution', 'diagnosis', 'notes',
            'atestado_dias', 'atestado_inicio', 'atestado_retorno', 
            'atestado_observacoes', 'professional_detail'
        ]

    def get_professional_detail(self, obj):
        if obj.professional:
            return {'name': obj.professional.name, 'crm': obj.professional.crm}
        return None

class PrescriptionSerializer(serializers.ModelSerializer):
    professional_detail = serializers.SerializerMethodField()
    
    class Meta:
        model = Prescription
        fields = [
            'id', 'patient', 'professional', 'appointment', 'medication',
            'dose', 'frequency', 'duration', 'notes', 'created_at',
            'professional_detail'
        ]

    def get_professional_detail(self, obj):
        if obj.professional:
            return {'name': obj.professional.name, 'crm': obj.professional.crm}
        return None
