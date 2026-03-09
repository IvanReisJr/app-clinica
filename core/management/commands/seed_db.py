import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from users.models import CustomUser
from patients.models import Patient
from professionals.models import Professional
from appointments.models import Appointment
from medical_records.models import MedicalRecord

class Command(BaseCommand):
    help = 'Seeds the database with test data for clinical workflow'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Iniciando semeadura de dados...'))

        # 1. Limpar dados existentes (opcional, mas recomendado para testes limpos)
        # Appointment.objects.all().delete()
        # MedicalRecord.objects.all().delete()
        # Patient.objects.all().delete()
        # Professional.objects.all().delete()

        # 2. Criar Profissionais
        specialties = ['Cardiologia', 'Neurologia', 'Clínica Geral', 'Ortopedia', 'Pediatria']
        prof_data = [
            {'username': 'dr_joao', 'name': 'Dr. João Silva', 'specialty': 'Cardiologia', 'crm': '11111-SP'},
            {'username': 'dra_maria', 'name': 'Dra. Maria Souza', 'specialty': 'Neurologia', 'crm': '22222-SP'},
            {'username': 'dr_pedro', 'name': 'Dr. Pedro Santos', 'specialty': 'Ortopedia', 'crm': '33333-SP'},
        ]

        professionals = []
        for p in prof_data:
            user, created = CustomUser.objects.get_or_create(
                username=p['username'],
                defaults={
                    'role': 'doctor',
                    'first_name': p['name'].split(' ')[1],
                    'last_name': p['name'].split(' ')[2] if len(p['name'].split(' ')) > 2 else '',
                    'is_staff': True
                }
            )
            if created:
                user.set_password('123456a')
                user.save()
            
            prof, _ = Professional.objects.get_or_create(
                user=user,
                defaults={
                    'name': p['name'],
                    'specialty': p['specialty'],
                    'crm': p['crm'],
                    'is_active': True
                }
            )
            professionals.append(prof)

        self.stdout.write(f'- {len(professionals)} profissionais criados.')

        # 3. Criar Pacientes (10)
        patients = []
        patient_names = [
            'Carlos Alberto Almeida', 'Maite Proênça Silva', 'Felipe Santos Martins', 
            'Ana Paula Gouveia', 'Ricardo Pereira Lima', 'Juliana Costa Ferreira',
            'Marcos Oliveira Souza', 'Beatriz Rebouças Lima', 'Luiz Gustavo Dias',
            'Fernanda Rocha Melo'
        ]
        
        for i, name in enumerate(patient_names):
            cpf = f'{(i+1)*111:03}.{(i+1)*111:03}.{(i+1)*111:03}-{(i+1)*11:02}'
            pt, _ = Patient.objects.get_or_create(
                cpf=cpf,
                defaults={
                    'full_name': name,
                    'gender': random.choice(['M', 'F']),
                    'phone': f'119{random.randint(7000, 9999)}{random.randint(1000, 9999)}',
                    'date_of_birth': (timezone.now() - timedelta(days=random.randint(7000, 25000))).date(),
                    'is_active': True
                }
            )
            patients.append(pt)

        self.stdout.write(f'- {len(patients)} pacientes criados.')

        # 4. Criar Agendamentos (15)
        hoje = timezone.now().date()
        status_list = ['agendado', 'confirmado', 'aguardando', 'triagem', 'em_atendimento', 'atendido']
        
        # Agendamentos passados (para histórico)
        for i in range(5):
            pt = random.choice(patients)
            prof = random.choice(professionals)
            data_past = hoje - timedelta(days=random.randint(1, 30))
            Appointment.objects.create(
                patient=pt,
                professional=prof,
                appointment_date=data_past,
                appointment_time=timezone.now().replace(hour=random.randint(8, 17), minute=0).time(),
                status='atendido'
            )

        # Agendamentos hoje (fila de atendimento)
        horas_hoje = [8, 9, 10, 11, 14, 15, 16]
        for i, hora in enumerate(horas_hoje):
            pt = patients[i % len(patients)]
            status = 'agendado'
            if hora < timezone.now().hour:
                status = random.choice(['atendido', 'faltou'])
            elif hora == timezone.now().hour:
                status = 'em_atendimento'
            
            Appointment.objects.create(
                patient=pt,
                professional=random.choice(professionals),
                appointment_date=hoje,
                appointment_time=timezone.now().replace(hour=hora, minute=0, second=0).time(),
                status=status,
                attendance_number=1000 + i,
                room=f'Sala {random.randint(1, 3)}'
            )

        self.stdout.write('- 15 agendamentos gerados (passados e hoje).')

        # 5. Criar Histórico Médico (5 registros)
        for i in range(5):
            # Pegar compromissos que marcamos como atendidos
            past_apps = Appointment.objects.filter(status='atendido')[:5]
            if past_apps.count() > i:
                app = past_apps[i]
                MedicalRecord.objects.get_or_create(
                    patient=app.patient,
                    professional=app.professional,
                    appointment=app,
                    defaults={
                        'chief_complaint': 'Paciente relata dor persistente e desconforto.',
                        'clinical_evolution': 'Apresentou melhora significativa após medicação inicial. Retorno em 15 dias.',
                        'diagnosis': 'M54.5 - Dor Lombar Baixa',
                        'notes': 'Solicitado exames laboratoriais complementares.'
                    }
                )

        self.stdout.write(self.style.SUCCESS('- 5 registros de prontuário (histórico) criados.'))
        self.stdout.write(self.style.SUCCESS('Banco de dados semeado com sucesso!'))
