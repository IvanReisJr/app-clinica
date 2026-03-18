from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BillingLotViewSet, BillingItemViewSet

router = DefaultRouter()
router.register(r'lotes', BillingLotViewSet, basename='lotes')
router.register(r'itens-faturamento', BillingItemViewSet, basename='itens-faturamento')

urlpatterns = [
    path('', include(router.urls)),
]
