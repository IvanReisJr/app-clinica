from rest_framework import serializers
from .models import Appointment
from django.utils import timezone

class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.get_full_name', read_only=True)

    class Meta:
        model = Appointment
        fields = ['id', 'patient', 'patient_name', 'doctor', 'doctor_name', 'scheduled_time', 'status']

    def validate_scheduled_time(self, value):
        if value < timezone.now():
            raise serializers.ValidationError("Não é possível agendar uma consulta no passado.")
        return value
