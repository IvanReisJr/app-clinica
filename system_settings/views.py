from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import SystemSetting
from .serializers import SystemSettingSerializer

class SystemSettingViewSet(viewsets.ModelViewSet):
    queryset = SystemSetting.objects.all()
    serializer_class = SystemSettingSerializer
    lookup_field = 'key'

    @action(detail=False, methods=['get'])
    def all_as_dict(self, request):
        settings = SystemSetting.objects.all()
        data = {s.key: s.value for s in settings}
        return Response(data)

    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        # Expects a dict of key: value
        data = request.data
        for key, value in data.items():
            SystemSetting.objects.update_or_create(key=key, defaults={'value': value})
        return Response({'status': 'settings updated'})
