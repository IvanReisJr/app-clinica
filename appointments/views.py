from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Appointment
from .serializers import AppointmentSerializer

class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        professional_id = self.request.query_params.get('professional_id')
        date = self.request.query_params.get('date')
        
        # Filtros Opcionais
        if professional_id:
            queryset = queryset.filter(professional_id=professional_id)
        if date:
            queryset = queryset.filter(appointment_date=date)
            
        # Padrão: Não retornar cancelados na view root se não explicitamente pedido, 
        # mas como é uma API crua, vamos retornar tudo e o frontend filtra.
        return queryset
