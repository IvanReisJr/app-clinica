from rest_framework import viewsets
from .models import Professional
from .serializers import ProfessionalSerializer
from rest_framework.permissions import IsAuthenticated

class ProfessionalViewSet(viewsets.ModelViewSet):
    queryset = Professional.objects.all().order_by('name')
    serializer_class = ProfessionalSerializer
    permission_classes = [IsAuthenticated]
