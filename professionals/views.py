from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Professional, ProfessionalSchedule
from .serializers import ProfessionalSerializer, ProfessionalScheduleSerializer
from rest_framework.permissions import IsAuthenticated

class ProfessionalViewSet(viewsets.ModelViewSet):
    queryset = Professional.objects.all().order_by('name')
    serializer_class = ProfessionalSerializer
    permission_classes = [IsAuthenticated]

    def destroy(self, request, *args, **kwargs):
        # Soft Delete: LGPD Compliance
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

class ProfessionalScheduleViewSet(viewsets.ModelViewSet):
    queryset = ProfessionalSchedule.objects.all()
    serializer_class = ProfessionalScheduleSerializer
    filterset_fields = ['professional', 'day_of_week', 'active']
    permission_classes = [IsAuthenticated]
