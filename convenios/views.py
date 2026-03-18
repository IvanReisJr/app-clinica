from rest_framework import viewsets
from .models import Convenio, ConvenioProcedimento
from .serializers import ConvenioSerializer, ConvenioProcedimentoSerializer
from rest_framework.permissions import IsAuthenticated

class ConvenioViewSet(viewsets.ModelViewSet):
    queryset = Convenio.objects.all()
    serializer_class = ConvenioSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        ativo = self.request.query_params.get('ativo', None)
        if ativo is not None:
            if ativo.lower() == 'true':
                queryset = queryset.filter(ativo=True)
            elif ativo.lower() == 'false':
                queryset = queryset.filter(ativo=False)
        return queryset

class ConvenioProcedimentoViewSet(viewsets.ModelViewSet):
    queryset = ConvenioProcedimento.objects.all()
    serializer_class = ConvenioProcedimentoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        convenio_id = self.request.query_params.get('convenio', None)
        ativo = self.request.query_params.get('ativo', None)
        if convenio_id:
            queryset = queryset.filter(convenio_id=convenio_id)
        if ativo is not None:
            if ativo.lower() == 'true':
                queryset = queryset.filter(ativo=True)
            elif ativo.lower() == 'false':
                queryset = queryset.filter(ativo=False)
        return queryset
