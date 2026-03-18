from rest_framework import viewsets, status
from rest_framework.response import Response
from django.utils import timezone
from .models import Appointment, ScheduleBlock, PanelCall
from .serializers import AppointmentSerializer, ScheduleBlockSerializer, PanelCallSerializer
from rest_framework.permissions import IsAuthenticated
import django_filters
from django_filters.rest_framework import DjangoFilterBackend

class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        professional_id = self.request.query_params.get('professional_id')
        date = self.request.query_params.get('date')
        status = self.request.query_params.get('status')
        
        # Filtros Opcionais
        if professional_id:
            queryset = queryset.filter(professional_id=professional_id)
        if date:
            queryset = queryset.filter(appointment_date=date)
        if status:
            queryset = queryset.filter(status=status)
            
        return queryset

    def partial_update(self, request, *args, **kwargs):
        appointment = self.get_object()
        if 'status' in request.data and request.data['status'] == 'finished' and not appointment.attendance_finished_at:
            appointment.attendance_finished_at = timezone.now()
            appointment.save()

        return super().partial_update(request, *args, **kwargs)

class ScheduleBlockViewSet(viewsets.ModelViewSet):
    queryset = ScheduleBlock.objects.all()
    serializer_class = ScheduleBlockSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['professional', 'block_date']
    permission_classes = [IsAuthenticated]

class PanelCallViewSet(viewsets.ModelViewSet):
    queryset = PanelCall.objects.filter(is_active=True).order_by('-called_at')
    serializer_class = PanelCallSerializer
    permission_classes = [IsAuthenticated]
