from rest_framework import serializers
from .models import Professional, ProfessionalSchedule
from users.serializers import CustomUserSerializer

class ProfessionalSerializer(serializers.ModelSerializer):
    user_detail = CustomUserSerializer(source='user', read_only=True)

    class Meta:
        model = Professional
        fields = ['id', 'user', 'user_detail', 'name', 'specialty', 'crm', 'phone', 'email', 'is_active', 'created_at']

class ProfessionalScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfessionalSchedule
        fields = '__all__'
