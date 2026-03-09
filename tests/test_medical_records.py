import pytest
from rest_framework.test import APIClient
from patients.models import Patient
from professionals.models import Professional
from appointments.models import Appointment
from medical_records.models import MedicalRecord, Prescription
from users.models import CustomUser

@pytest.mark.django_db
class TestMedicalRecordsAPI:
    def setup_method(self):
        self.client = APIClient()
        
        # Create user and professional
        self.user = CustomUser.objects.create_user(username='dr_tester', role='doctor')
        self.user.set_password('pass123')
        self.user.save()
        self.professional = Professional.objects.create(
            user=self.user, 
            name='Dr. Tester', 
            specialty='Test', 
            crm='99999-SP'
        )
        
        # Create patient
        self.patient = Patient.objects.create(
            full_name='Patient Tester', 
            cpf='999.999.999-99', 
            is_active=True
        )
        
        # Create appointment
        from datetime import date, time
        self.appointment = Appointment.objects.create(
            patient=self.patient,
            professional=self.professional,
            appointment_date=date.today(),
            appointment_time=time(10, 0),
            status='em_atendimento'
        )
        
        # Authenticate
        self.client.force_authenticate(user=self.user)

    def test_create_medical_record_fail_due_to_depth(self):
        """
        Este teste deve falhar se depth=1 estiver presente no serializer,
        pois o DRF o tornará read-only ou esperará dados aninhados.
        """
        payload = {
            "patient": self.patient.id,
            "professional": self.professional.id,
            "appointment": self.appointment.id,
            "chief_complaint": "Dor de cabeça",
            "clinical_evolution": "Paciente estável",
            "diagnosis": "R51",
            "notes": "Observação de teste"
        }
        
        response = self.client.post("/api/v1/records/", payload, format='json')
        
        # Se depth=1 estiver causando o problema, o response provavelmente terá 
        # erros de validação dizendo que os campos são obrigatórios (porque os ignorou no input)
        # ou retornará 201 mas com os campos nulos no banco.
        
        assert response.status_code == 201
        
        # Verificar se os IDs foram salvos corretamente
        record = MedicalRecord.objects.get(id=response.data['id'])
        assert record.patient.id == self.patient.id
        assert record.professional.id == self.professional.id
        assert record.appointment.id == self.appointment.id

    def test_create_prescription_fail_due_to_depth(self):
        payload = {
            "patient": self.patient.id,
            "professional": self.professional.id,
            "appointment": self.appointment.id,
            "medication": "Dipirona 500mg",
            "dose": "1 comprimido",
            "frequency": "8/8h",
            "duration": "3 dias"
        }
        
        response = self.client.post("/api/v1/prescriptions/", payload, format='json')
        assert response.status_code == 201
        
        prescription = Prescription.objects.get(id=response.data['id'])
        assert prescription.patient.id == self.patient.id

    def test_full_attendance_flow(self):
        """
        Simula a finalização completa de um atendimento.
        Deve criar Record, Prescription e atualizar Appointment status.
        """
        # 1. Enviar Prontuário
        record_payload = {
            "patient": self.patient.id,
            "professional": self.professional.id,
            "appointment": self.appointment.id,
            "chief_complaint": "Dor abdominal",
            "clinical_evolution": "Paciente com suspeita de gastrite",
            "diagnosis": "K29.7"
        }
        res_rec = self.client.post("/api/v1/records/", record_payload, format='json')
        assert res_rec.status_code == 201

        # 2. Enviar Prescrição
        rx_payload = {
            "patient": self.patient.id,
            "professional": self.professional.id,
            "appointment": self.appointment.id,
            "medication": "Omeprazol 20mg",
            "dose": "1 cap",
            "frequency": "Jejum",
            "duration": "14 dias"
        }
        res_rx = self.client.post("/api/v1/prescriptions/", rx_payload, format='json')
        assert res_rx.status_code == 201

        # 3. Finalizar Agendamento (Alta)
        # O frontend envia atedance_finished_at
        from django.utils import timezone
        finish_payload = {
            "status": "atendido",
            "attendance_finished_at": timezone.now().isoformat()
        }
        res_finish = self.client.patch(f"/api/v1/appointments/{self.appointment.id}/", finish_payload, format='json')
        assert res_finish.status_code == 200

        # Verificações finais
        self.appointment.refresh_from_db()
        assert self.appointment.status == "atendido"
        assert self.appointment.attendance_finished_at is not None
        
        assert MedicalRecord.objects.filter(appointment=self.appointment).exists()
        assert Prescription.objects.filter(appointment=self.appointment).count() == 1
