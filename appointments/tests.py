import pytest
from rest_framework.test import APITestCase
from rest_framework import status
from patients.models import Patient
from professionals.models import Professional
from users.models import CustomUser
from appointments.models import Appointment

@pytest.mark.django_db
class AppointmentOverbookingTests(APITestCase):
    def setUp(self):
        # Criar Usuario e Profissional
        self.user_doc = CustomUser.objects.create_user(username='doc_test', password='password123', role='doctor')
        self.professional = Professional.objects.create(user=self.user_doc, name="Dr. Teste", is_active=True)
        
        # Criar 2 pacientes
        self.patient1 = Patient.objects.create(full_name='Paciente Um', cpf='111.111.111-11')
        self.patient2 = Patient.objects.create(full_name='Paciente Dois', cpf='222.222.222-22')
        
        # Logar com user_doc para ter permissao na API via JWT bypass
        self.client.force_authenticate(user=self.user_doc)

        self.appointment_url = '/api/v1/appointments/'

    def test_overbooking_prevented_by_serializer(self):
        """Não deve permitir criar 2 consultas para o mesmo médico, na mesma hora, sem marcação de encaixe."""
        data1 = {
            'professional': self.professional.id,
            'patient': self.patient1.id,
            'appointment_date': '2030-10-10',
            'appointment_time': '10:00:00',
            'is_encaixe': False,
        }
        res1 = self.client.post(self.appointment_url, data1)
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)
        
        data2 = {
            'professional': self.professional.id,
            'patient': self.patient2.id,
            'appointment_date': '2030-10-10',
            'appointment_time': '10:00:00',
            'is_encaixe': False,
        }
        res2 = self.client.post(self.appointment_url, data2)
        
        # Deve ser bloqueado com 400 Bad Request contendo erro de Overbooking
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("já possui um agendamento para", res2.data['non_field_errors'][0])

    def test_overbooking_allowed_if_encaixe(self):
        """DEVE permitir criar consulta simultânea SE e somente SE a flag is_encaixe for verdadeira."""
        self.client.post(self.appointment_url, {
            'professional': self.professional.id,
            'patient': self.patient1.id,
            'appointment_date': '2030-10-10',
            'appointment_time': '11:00:00',
            'is_encaixe': False,
        })
        
        res2 = self.client.post(self.appointment_url, {
            'professional': self.professional.id,
            'patient': self.patient2.id,
            'appointment_date': '2030-10-10',
            'appointment_time': '11:00:00',
            'is_encaixe': True,  # <<
        })
        
        self.assertEqual(res2.status_code, status.HTTP_201_CREATED)
        
    def test_overbooking_allowed_if_status_cancelled(self):
        """Se o médico tem um horário 13:00 ocupado mas está cancelado ou faltou, pode agendar outro paciente."""
        Appointment.objects.create(
            professional=self.professional,
            patient=self.patient1,
            appointment_date='2030-10-10',
            appointment_time='13:00:00',
            status='cancelado'
        )
        
        res2 = self.client.post(self.appointment_url, {
            'professional': self.professional.id,
            'patient': self.patient2.id,
            'appointment_date': '2030-10-10',
            'appointment_time': '13:00:00',
            'is_encaixe': False,
        })
        
        self.assertEqual(res2.status_code, status.HTTP_201_CREATED)
