from django.urls import path
from .views import ExportPatientsView, ExportAppointmentsView

urlpatterns = [
    path('patients/', ExportPatientsView.as_view(), name='report-patients'),
    path('appointments/', ExportAppointmentsView.as_view(), name='report-appointments'),
]
