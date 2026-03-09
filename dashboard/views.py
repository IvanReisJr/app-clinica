from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Count, Q
from datetime import timedelta
from patients.models import Patient
from appointments.models import Appointment
from medications.models import Medication

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        
        # Estatísticas de Agendamentos (Hoje)
        appointments_today = Appointment.objects.filter(appointment_date=today)
        total_today = appointments_today.count()
        completed_today = appointments_today.filter(status='atendido').count()
        waiting_today = appointments_today.filter(status='aguardando').count()
        triagem_today = appointments_today.filter(status='triagem').count()
        
        # Estatísticas de Pacientes
        total_patients = Patient.objects.filter(is_active=True).count()
        
        # Estatísticas de Medicamentos
        # Consideramos estoque baixo menos de 10 unidades
        low_stock_count = Medication.objects.filter(quantity__lt=10, is_active=True).count()
        total_medications = Medication.objects.filter(is_active=True).count()
        
        # Tendência de Agendamentos (Últimos 6 meses)
        # Vamos gerar um resumo simples baseado em meses
        six_months_ago = today - timedelta(days=180)
        monthly_trend = (
            Appointment.objects.filter(appointment_date__gte=six_months_ago)
            .values('appointment_date__month')
            .annotate(count=Count('id'))
            .order_by('appointment_date__month')
        )
        
        # Mapeamento de nomes de meses (opcional ou faz no front)
        month_names = {
            1: 'Jan', 2: 'Fev', 3: 'Mar', 4: 'Abr', 5: 'Mai', 6: 'Jun',
            7: 'Jul', 8: 'Ago', 9: 'Set', 10: 'Out', 11: 'Nov', 12: 'Dez'
        }
        
        trend_data = []
        for item in monthly_trend:
            month_num = item['appointment_date__month']
            trend_data.append({
                'month': month_names.get(month_num, str(month_num)),
                'count': item['count']
            })

        # Últimos agendamentos (5)
        recent_appointments = (
            Appointment.objects.select_related('patient', 'professional')
            .order_by('-created_at')[:5]
        )
        recent_data = []
        for appt in recent_appointments:
            recent_data.append({
                'id': appt.id,
                'patient': appt.patient.full_name,
                'professional': appt.professional.name if appt.professional else "N/A",
                'status': appt.status,
                'date': appt.appointment_date.strftime('%d/%m'),
                'time': appt.appointment_time.strftime('%H:%M')
            })

        data = {
            'appointments': {
                'today': total_today,
                'completed': completed_today,
                'waiting': waiting_today,
                'triagem': triagem_today,
            },
            'patients': {
                'total': total_patients,
            },
            'medications': {
                'total': total_medications,
                'low_stock': low_stock_count,
            },
            'trend': trend_data,
            'recent': recent_data
        }

        return Response(data)
