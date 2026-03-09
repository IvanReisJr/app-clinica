from rest_framework import serializers
from .models import Appointment
from patients.models import Patient
from professionals.models import Professional

class PatientNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = ['id', 'full_name', 'cpf']

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
            'attendance_started_at', 'attendance_finished_at',
            'created_at', 'updated_at', 'is_active'
        ]
        validators = []

    def validate(self, data):
        # Para atualizações parciais (PATCH), usamos os dados existentes da instância se não fornecidos no data
        date = data.get('appointment_date') or (self.instance.appointment_date if self.instance else None)
        time = data.get('appointment_time') or (self.instance.appointment_time if self.instance else None)
        professional = data.get('professional') or (self.instance.professional if self.instance else None)
        is_encaixe = data.get('is_encaixe', data.get('is_encaixe', self.instance.is_encaixe if self.instance else False))

        # Impedir agendamentos sem data ou hora
        if not date or not time:
            raise serializers.ValidationError("A data e a hora do agendamento são obrigatórias.")
        
        # Validar overbooking
        if professional and date and time and not is_encaixe:
            qs = Appointment.objects.filter(
                professional=professional,
                appointment_date=date,
                appointment_time=time
            ).exclude(status__in=['cancelado', 'faltou'])
            
            if self.instance and self.instance.id:
                qs = qs.exclude(id=self.instance.id)
                
            if qs.exists():
                raise serializers.ValidationError({
                    "non_field_errors": [
                        f"O profissional já possui um agendamento para {date.strftime('%d/%m/%Y')} às {time.strftime('%H:%M')}. Marque como 'Encaixe' para forçar o agendamento."
                    ]
                })

        return data
