from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from django.conf import settings
from django.conf.urls.static import static

# Importando as views das apps
from users.views import CustomUserViewSet, RolePermissionViewSet
from patients.views import PatientViewSet
from medical_records.views import MedicalRecordViewSet, PrescriptionViewSet
from medications.views import MedicationViewSet, MedicationMovementViewSet
from appointments.views import AppointmentViewSet
from professionals.views import ProfessionalViewSet
from dashboard.views import DashboardStatsView

router = DefaultRouter()
router.register(r'users', CustomUserViewSet, basename='user')
router.register(r'permissions', RolePermissionViewSet, basename='permission')
router.register(r'patients', PatientViewSet, basename='patient')
router.register(r'records', MedicalRecordViewSet, basename='record')
router.register(r'prescriptions', PrescriptionViewSet, basename='prescription')
router.register(r'medications', MedicationViewSet, basename='medication')
router.register(r'medication_movements', MedicationMovementViewSet, basename='medication_movement')
router.register(r'appointments', AppointmentViewSet, basename='appointment')
router.register(r'professionals', ProfessionalViewSet, basename='professional')

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Endpoints principais da API V1
    path('api/v1/', include(router.urls)),
    path('api/v1/dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    
    # Endpoints de Autenticação JWT
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Documentação Swagger / OpenAPI
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/docs/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
