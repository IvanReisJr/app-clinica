from rest_framework import viewsets
from .models import MedicalRecord, Prescription
from .serializers import MedicalRecordSerializer, PrescriptionSerializer

class MedicalRecordViewSet(viewsets.ModelViewSet):
    queryset = MedicalRecord.objects.all()
    serializer_class = MedicalRecordSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        patient_id = self.request.query_params.get('patient_id')
        if patient_id is not None:
            queryset = queryset.filter(patient_id=patient_id)
        return queryset

class PrescriptionViewSet(viewsets.ModelViewSet):
    queryset = Prescription.objects.all()
    serializer_class = PrescriptionSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        patient_id = self.request.query_params.get('patient_id')
        if patient_id is not None:
            queryset = queryset.filter(patient_id=patient_id)
        return queryset
