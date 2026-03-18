from rest_framework import serializers
from .models import Appointment, ScheduleBlock, PanelCall
from patients.models import Patient
from professionals.models import Professional

class PatientNestedSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='full_name', read_only=True)
    birth_date = serializers.DateField(source='date_of_birth', read_only=True)
    
    class Meta:
        model = Patient
        fields = [
            'id', 'name', 'cpf', 'phone', 'gender', 
            'birth_date', 'address', 'insurance', 'emergency_contact', 
            'convenio_id', 'numero_carteirinha', 'validade_plano', 'tipo_plano'
        ]

class ProfessionalNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Professional
        fields = ['id', 'name']

class AppointmentSerializer(serializers.ModelSerializer):
    # Campos detalhados para exibir pacientes/profissionais 
    patients = PatientNestedSerializer(source='patient', read_only=True)
    professionals = ProfessionalNestedSerializer(source='professional', read_only=True)

    class Meta:
        model = Appointment
        fields = [
            'id', 'patient', 'patients', 'professional', 'professionals', 
            'appointment_date', 'appointment_time', 'status', 'notes', 
            'attendance_number', 'room', 'is_encaixe', 'confirmed_at', 
            'attendance_started_at', 'attendance_finished_at',
            'procedimento_tuss', 'guia_number', 'authorization_number',
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
            
        # Trava Estrita de "Fechamento de Agenda" retroativa
        if date and time:
            from django.utils import timezone
            import datetime
            now_dt = timezone.now()
            
            # Checa se está tentando agendar num dia que já passou,
            # ou no dia de hoje em horário que já passou (considerando uma margem estrita)
            if date < now_dt.date() or (date == now_dt.date() and time < now_dt.time()):
                # Para updates, não queremos bloquear a edição de um agendamento antigo
                if not self.instance:
                    raise serializers.ValidationError({
                        "non_field_errors": ["Você não pode realizar novos agendamentos em horários passados/vencidos."]
                    })
        
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

class ScheduleBlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScheduleBlock
        fields = '__all__'

class PanelCallSerializer(serializers.ModelSerializer):
    class Meta:
        model = PanelCall
        fields = '__all__'

