import factory
from factory.django import DjangoModelFactory
from django.utils import timezone
from faker import Faker

from patients.models import Patient
from professionals.models import Professional, ProfessionalSchedule
from appointments.models import Appointment, ScheduleBlock
from users.models import CustomUser

fake = Faker('pt_BR')

class CustomUserFactory(DjangoModelFactory):
    class Meta:
        model = CustomUser

    username = factory.Sequence(lambda n: f'user_{n}')
    email = factory.Sequence(lambda n: f'user_{n}@example.com')
    # Required for login / view tests if you enforce active users
    is_active = True
    is_staff = False
    is_superuser = False

class PatientFactory(DjangoModelFactory):
    class Meta:
        model = Patient

    full_name = factory.Faker('name', locale='pt_BR')
    cpf = factory.Faker('cpf', locale='pt_BR')
    date_of_birth = factory.Faker('date_of_birth', maximum_age=90)
    phone = factory.Sequence(lambda n: f'1199999{n:04d}')
    email = factory.Sequence(lambda n: f'paciente{n}@example.com')
    is_active = True

class ProfessionalFactory(DjangoModelFactory):
    class Meta:
        model = Professional

    name = factory.Faker('name', locale='pt_BR')
    crm = factory.Sequence(lambda n: f'CRM-{n:06d}')
    specialty = 'Clínico Geral'
    is_active = True

class ProfessionalScheduleFactory(DjangoModelFactory):
    class Meta:
        model = ProfessionalSchedule

    professional = factory.SubFactory(ProfessionalFactory)
    day_of_week = 3 # 3 is Wednesday!
    start_time = "08:00:00"
    end_time = "17:00:00"
    slot_duration_minutes = 30
    active = True

class AppointmentFactory(DjangoModelFactory):
    class Meta:
        model = Appointment

    patient = factory.SubFactory(PatientFactory)
    professional = factory.SubFactory(ProfessionalFactory)
    appointment_date = factory.LazyFunction(timezone.now().date)
    appointment_time = "10:00:00"
    status = 'agendado'
    is_active = True

class ScheduleBlockFactory(DjangoModelFactory):
    class Meta:
        model = ScheduleBlock

    professional = factory.SubFactory(ProfessionalFactory)
    block_date = factory.LazyFunction(timezone.now().date)
    start_time = "12:00:00"
    end_time = "14:00:00"
    reason = "Almoco configurado no factory"
    block_type = 'almoco'
