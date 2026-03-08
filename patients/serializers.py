from rest_framework import serializers
from .models import Patient, MedicalRecord
from users.serializers import CustomUserSerializer

class PatientSerializer(serializers.ModelSerializer):
    # Opcionalmente podemos retornar detalhes do usuário amarrado
    user_detail = CustomUserSerializer(source='user', read_only=True)

    class Meta:
        model = Patient
        fields = [
            'id', 'user', 'user_detail', 'full_name', 'cpf', 'date_of_birth',
            'gender', 'phone', 'email', 'address', 'insurance',
            'emergency_contact', 'notes', 'photo', 'created_at'
        ]

class MedicalRecordSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.get_full_name', read_only=True)

    class Meta:
        model = MedicalRecord
        fields = ['id', 'patient', 'doctor', 'doctor_name', 'notes', 'created_at']
