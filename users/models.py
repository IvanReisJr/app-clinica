from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Administrador'),
        ('receptionist', 'Recepção'),
        ('doctor', 'Médico'),
        ('enfermagem', 'Enfermagem'),
        ('farmacia', 'Farmácia'),
        ('financeiro', 'Financeiro'),
        ('painel', 'Painel'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='receptionist')
    full_name = models.CharField(max_length=255, null=True, blank=True)
    crm = models.CharField(max_length=20, null=True, blank=True)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

class RolePermission(models.Model):
    # Associamos a permissão ao 'slug' do cargo (admin, doctor, etc)
    role = models.CharField(max_length=20, choices=CustomUser.ROLE_CHOICES)
    
    # Slugs das permissões baseados na imagem
    permissions = [
        ('view_agenda', 'Visualizar Agenda'),
        ('manage_agenda', 'Gerenciar Agenda'),
        ('view_patients', 'Visualizar Pacientes'),
        ('manage_patients', 'Gerenciar Pacientes'),
        ('view_records', 'Visualizar Prontuário'),
        ('register_records', 'Registrar Prontuário'),
        ('view_prescriptions', 'Visualizar Prescrições'),
        ('create_prescriptions', 'Criar Prescrições'),
        ('view_medications', 'Visualizar Medicamentos'),
        ('manage_medications', 'Gerenciar Medicamentos'),
        ('view_kardex', 'Visualizar Kardex'),
        ('manage_kardex', 'Gerenciar Kardex'),
        ('view_reports', 'Visualizar Relatórios'),
        ('view_users', 'Visualizar Usuários'),
        ('manage_users', 'Gerenciar Usuários'),
        ('view_professionals', 'Visualizar Profissionais'),
        ('manage_professionals', 'Gerenciar Profissionais'),
        ('manage_settings', 'Gerenciar Configurações'),
        ('start_attendance', 'Iniciar Atendimento'),
        ('end_attendance', 'Encerrar Atendimento'),
        ('confirm_arrival', 'Confirmar Chegada'),
    ]

    permission_slug = models.CharField(max_length=50) # O 'slug' (ex: view_agenda)
    is_granted = models.BooleanField(default=False)

    class Meta:
        unique_together = ('role', 'permission_slug')

    def __str__(self):
        return f"{self.role} - {self.permission_slug}: {self.is_granted}"
