from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Appointment
from .serializers import AppointmentSerializer

class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all().order_by('scheduled_time')
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        doctor_id = self.request.query_params.get('doctor_id')
        date = self.request.query_params.get('date')
        
        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)
        if date:
            # Filtra considerando apenas o dia (ignorando horas)
            queryset = queryset.filter(scheduled_time__date=date)
            
        return queryset
