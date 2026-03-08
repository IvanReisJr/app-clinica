from rest_framework import viewsets
from .models import Patient, MedicalRecord
from .serializers import PatientSerializer, MedicalRecordSerializer

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all().order_by('-created_at')
    serializer_class = PatientSerializer
    
    # Poderíamos adicionar filters depois, ex:
    # filterset_fields = ['cpf', 'full_name']

class MedicalRecordViewSet(viewsets.ModelViewSet):
    queryset = MedicalRecord.objects.all().order_by('-created_at')
    serializer_class = MedicalRecordSerializer

    def get_queryset(self):
        # Filtra os prontuários por paciente, se passado na URL (?patient_id=X)
        queryset = super().get_queryset()
        patient_id = self.request.query_params.get('patient_id')
        if patient_id is not None:
            queryset = queryset.filter(patient_id=patient_id)
        return queryset
