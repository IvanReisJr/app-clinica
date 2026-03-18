import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from .factories import CustomUserFactory, PatientFactory, ProfessionalFactory, ProfessionalScheduleFactory

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def setup_data():
    def _create_data():
        # User for auth
        su = CustomUserFactory.create(username='test_admin', is_superuser=True, is_staff=True)
        su.set_password('123')
        su.save()

        # Database initial dependencies
        patient = PatientFactory.create()
        prof = ProfessionalFactory.create()
        sched = ProfessionalScheduleFactory.create(professional=prof)

        return {'user': su, 'patient': patient, 'professional': prof, 'schedule': sched}
    return _create_data

@pytest.mark.django_db
class TestClinicaCoreCRUD:
    
    def test_01_authentication(self, api_client, setup_data):
        """Teste de emissão do JWT, essencial para os CRUDS"""
        data = setup_data()
        url = '/api/v1/auth/token/'
        resp = api_client.post(url, data={'username': 'test_admin', 'password': '123'})
        assert resp.status_code == 200, "Login falhou"
        assert 'access' in resp.json(), "Não retornou o Token de Acesso JWT."

    def test_02_patient_lifecycle(self, api_client, setup_data):
        data = setup_data()
        api_client.force_authenticate(user=data['user'])
        
        # 1. CREATE
        create_payload = {
            'full_name': 'Paciente Testador',
            'cpf': '123.456.789-00',
            'phone': '11988887777',
            'email': 'novo@test.com'
        }
        res_create = api_client.post('/api/v1/patients/', data=create_payload)
        assert res_create.status_code == 201, f"Falha na Criação: {res_create.data}"
        patient_id = res_create.json()['id']

        # 2. READ (Lista paginada ou direta)
        res_read = api_client.get(f'/api/v1/patients/{patient_id}/')
        assert res_read.status_code == 200
        assert res_read.json()['full_name'] == 'Paciente Testador'

        # 3. UPDATE
        update_payload = {'full_name': 'Paciente Atualizado'}
        res_patch = api_client.patch(f'/api/v1/patients/{patient_id}/', data=update_payload)
        assert res_patch.status_code == 200
        assert res_patch.json()['full_name'] == 'Paciente Atualizado'

        # 4. EXCLUSÃO (Soft ou Hard dependendo do endpoint)
        res_del = api_client.delete(f'/api/v1/patients/{patient_id}/')
        assert res_del.status_code == 204

    def test_03_agenda_flow_validation(self, api_client, setup_data):
        data = setup_data()
        api_client.force_authenticate(user=data['user'])
        
        # Agendamento Válido
        payload = {
            'patient': data['patient'].id,
            'professional': data['professional'].id,
            'appointment_date': '2026-03-25',
            'appointment_time': '10:00:00',
            'status': 'agendado',
            'is_encaixe': False
        }
        res = api_client.post('/api/v1/appointments/', data=payload)
        assert res.status_code == 201, "A criação de agenda válida original falhou."
        
        # Tenta Double-Booking (Violção de Regra de Negócio Crítica)
        payload_conflict = {
            'patient': data['patient'].id,
            'professional': data['professional'].id,
            'appointment_date': '2026-03-25',
            'appointment_time': '10:00:00',
            'status': 'agendado',
            'is_encaixe': False
        }
        res_conflict = api_client.post('/api/v1/appointments/', data=payload_conflict)
        assert res_conflict.status_code == 400, "O Sistena permitiu Agendamento Duplo no mesmo horário! Falha Crítica."
        assert 'non_field_errors' in res_conflict.json()

        # Cria O Mesmo Horário mas marcando Is_Encaixe (DEVE PASSAR)
        payload_encaixe = payload_conflict.copy()
        payload_encaixe['is_encaixe'] = True
        res_encaixe = api_client.post('/api/v1/appointments/', data=payload_encaixe)
        assert res_encaixe.status_code == 201, "O Sistema falhou em permitir Encaixes."

    def test_04_schedule_block_validation(self, api_client, setup_data):
        """Valida que bloqueios de agenda sejam criados e obedeçam limites."""
        data = setup_data()
        api_client.force_authenticate(user=data['user'])
        
        payload_block = {
            'professional': data['professional'].id,
            'block_date': '2026-03-28',
            'all_day': False,
            'start_time': '12:00:00',
            'end_time': '14:00:00',
            'reason': 'Ausência no hospital externo', # Agora Reason tem blank=True
            'block_type': 'outro'
        }
        res_out = api_client.post('/api/v1/schedule-blocks/', data=payload_block)
        assert res_out.status_code == 201, f"Falha Inesperada ao salvar bloqueio: {res_out.data}"
