from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from .models import Medication, MedicationMovement
from .serializers import MedicationSerializer, MedicationMovementSerializer

class MedicationViewSet(viewsets.ModelViewSet):
    queryset = Medication.objects.all()
    serializer_class = MedicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        return queryset

    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        medication = self.get_object()
        medication.is_active = not medication.is_active
        medication.save()
        return Response({
            'status': 'success',
            'is_active': medication.is_active
        })

class MedicationMovementViewSet(viewsets.ModelViewSet):
    queryset = MedicationMovement.objects.all()
    serializer_class = MedicationMovementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        medication_id = self.request.query_params.get('medication_id')
        if medication_id:
            queryset = queryset.filter(medication_id=medication_id)
        return queryset

    def perform_create(self, serializer):
        with transaction.atomic():
            movement = serializer.save(user=self.request.user)
            medication = movement.medication
            
            # Atualiza o saldo do medicamento
            if movement.type == 'entrada':
                medication.quantity += movement.quantity
            elif movement.type in ['saida', 'vencimento']:
                medication.quantity -= movement.quantity
            elif movement.type == 'ajuste':
                # No ajuste, a quantidade enviada é a nova quantidade total
                # ou a diferença? Vamos tratar como diferença para manter consistência
                medication.quantity += movement.quantity
            
            medication.save()
