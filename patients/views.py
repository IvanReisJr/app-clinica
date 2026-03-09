from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Patient
from .serializers import PatientSerializer

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all().order_by('full_name')
    serializer_class = PatientSerializer
    
    def destroy(self, request, *args, **kwargs):
        # Soft Delete
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
