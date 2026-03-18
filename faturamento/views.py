from rest_framework import viewsets, mixins, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from .models import BillingLot, BillingItem
from appointments.models import Appointment
from .serializers import BillingLotSerializer, BillingItemSerializer, PendingAppointmentSerializer
from django.utils import timezone

class BillingLotViewSet(viewsets.ModelViewSet):
    queryset = BillingLot.objects.all().select_related('convenio').prefetch_related('items__appointment__patient', 'items__appointment__professional')
    serializer_class = BillingLotSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def pendentes(self, request):
        """
        Lista todos os atendimentos finalizados que tenham convênio e que não
        estejam atrelados a nenhum item de lote.
        """
        # Supondo que "atendido" ou "em_atendimento" são status finais / faturáveis
        pendentes_qs = Appointment.objects.filter(
            patient__convenio__isnull=False,
            billing_item__isnull=True,
            status__in=['atendido', 'em_atendimento', 'aguardando', 'triagem', 'confirmado']  # para homologação testar
        ).select_related('patient__convenio', 'professional')
        
        serializer = PendingAppointmentSerializer(pendentes_qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def criar_lote(self, request):
        """
        Espera { "convenio_id": ID, "appointment_ids": [1, 2, 3] }
        """
        convenio_id = request.data.get('convenio_id')
        appointment_ids = request.data.get('appointment_ids', [])
        
        if not convenio_id or not appointment_ids:
            return Response({"error": "convenio_id e appointment_ids são necessários."}, status=status.HTTP_400_BAD_REQUEST)
            
        appointments = Appointment.objects.filter(id__in=appointment_ids, billing_item__isnull=True)
        if not appointments.exists():
            return Response({"error": "Nenhum atendimento válido para criar lote."}, status=status.HTTP_400_BAD_REQUEST)
            
        lote = BillingLot.objects.create(convenio_id=convenio_id, status='aberto')
        
        items_to_create = []
        for appt in appointments:
            items_to_create.append(BillingItem(billing_lot=lote, appointment=appt, status_conciliacao='pendente'))
            
        BillingItem.objects.bulk_create(items_to_create)
        
        serializer = self.get_serializer(lote)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'])
    def marcar_enviado(self, request, pk=None):
        lote = self.get_object()
        if lote.status == 'aberto':
            lote.status = 'enviado'
            lote.sent_at = timezone.now()
            lote.save()
            return Response({"status": "Lote enviado."})
        return Response({"error": "Lote não estava aberto."}, status=status.HTTP_400_BAD_REQUEST)


class BillingItemViewSet(viewsets.ModelViewSet):
    queryset = BillingItem.objects.all()
    serializer_class = BillingItemSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['patch'])
    def conciliar(self, request, pk=None):
        """
        Altera status_conciliacao entre 'pendente', 'pago', 'glosa', 'recurso'
        """
        item = self.get_object()
        novo_status = request.data.get('status_conciliacao')
        if novo_status in dict(BillingItem.STATUS_CHOICES).keys():
            item.status_conciliacao = novo_status
            item.save()
            return Response({"status": "Conciliação atualizada", "status_conciliacao": novo_status})
        return Response({"error": "Status inválido."}, status=status.HTTP_400_BAD_REQUEST)
