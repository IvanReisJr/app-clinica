from rest_framework import serializers
from .models import Patient
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


