from rest_framework import serializers
from .models import Appointment
from patients.models import Patient
from professionals.models import Professional

class PatientNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = ['id', 'full_name', 'cpf', 'record_number']

class ProfessionalNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Professional
        fields = ['id', 'name']

class AppointmentSerializer(serializers.ModelSerializer):
    # Campos detalhados para exibição (Read-only)
    patient_detail = PatientNestedSerializer(source='patient', read_only=True)
    professional_detail = ProfessionalNestedSerializer(source='professional', read_only=True)

    class Meta:
        model = Appointment
        fields = [
            'id', 'patient', 'patient_detail', 'professional', 'professional_detail', 
            'appointment_date', 'appointment_time', 'status', 'notes', 
            'attendance_number', 'room', 'is_encaixe', 'confirmed_at', 
            'created_at', 'updated_at', 'is_active'
        ]

    def validate(self, data):
        # Impedir agendamentos sem data ou hora
        if not data.get('appointment_date') or not data.get('appointment_time'):
            raise serializers.ValidationError("A data e a hora do agendamento são obrigatórias.")
        return data
