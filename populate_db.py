import os
import django
from datetime import timedelta
from django.utils import timezone

# Configure Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import CustomUser
from patients.models import Patient
from professionals.models import Professional
from appointments.models import Appointment

def run():
    print("Iniciando população de dados...")

    # 1. Profissionais
    print("- Criando Profissionais...")
    u1, _ = CustomUser.objects.get_or_create(username='dr_joao', defaults={'role': 'doctor', 'first_name': 'João', 'last_name': 'Silva'})
    u1.set_password('123456a')
    u1.save()
    p1, _ = Professional.objects.get_or_create(user=u1, defaults={'name': 'Dr. João Silva', 'specialty': 'Cardiologia', 'crm': '101010-SP', 'is_active': True})

    u2, _ = CustomUser.objects.get_or_create(username='dra_maria', defaults={'role': 'doctor', 'first_name': 'Maria', 'last_name': 'Souza'})
    u2.set_password('123456a')
    u2.save()
    p2, _ = Professional.objects.get_or_create(user=u2, defaults={'name': 'Dra. Maria Souza', 'specialty': 'Neurologia', 'crm': '202020-SP', 'is_active': True})

    # 2. Pacientes
    print("- Criando Pacientes...")
    pt1, _ = Patient.objects.get_or_create(cpf='111.111.111-11', defaults={'full_name': 'Carlos Almeida', 'gender': 'M', 'phone': '11999999999'})
    pt2, _ = Patient.objects.get_or_create(cpf='222.222.222-22', defaults={'full_name': 'Maite', 'gender': 'F', 'phone': '11988888888'})
    pt3, _ = Patient.objects.get_or_create(cpf='333.333.333-33', defaults={'full_name': 'Felipe Martins', 'gender': 'M', 'phone': '11977777777'})

    # 3. Agendamentos
    print("- Criando Agendamentos de Hoje...")
    hoje = timezone.now().date()
    agora = timezone.now()

    # Um na fila aguardando (passado)
    Appointment.objects.get_or_create(
        professional=p1,
        patient=pt2,
        appointment_date=hoje,
        appointment_time=(agora - timedelta(minutes=45)).time(),
        defaults={'status': 'aguardando', 'attendance_number': 1001, 'room': 'Sala 1'}
    )

    # Um em atendimento
    Appointment.objects.get_or_create(
        professional=p1,
        patient=pt1,
        appointment_date=hoje,
        appointment_time=(agora - timedelta(minutes=10)).time(),
        defaults={'status': 'em_atendimento', 'attendance_number': 1002, 'room': 'Sala 1'}
    )

    # Um futuro (agendado)
    Appointment.objects.get_or_create(
        professional=p2,
        patient=pt3,
        appointment_date=hoje,
        appointment_time=(agora + timedelta(hours=1)).time(),
        defaults={'status': 'confirmado', 'attendance_number': 1003, 'room': 'Consultório Neurologia'}
    )

    print("Dados gerados com sucesso!")

if __name__ == '__main__':
    run()
