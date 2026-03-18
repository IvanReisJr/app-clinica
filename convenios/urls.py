from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConvenioViewSet, ConvenioProcedimentoViewSet

router = DefaultRouter()
router.register(r'lista', ConvenioViewSet, basename='convenio')
router.register(r'procedimentos', ConvenioProcedimentoViewSet, basename='convenio-procedimento')

urlpatterns = [
    path('', include(router.urls)),
]
