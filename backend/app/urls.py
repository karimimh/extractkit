from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CreatePaymentView,
    ExportPdfView,
    GoogleAuthView,
    LoginView,
    PaymentWebhookView,
    PreviewPageView,
    RegisterView,
    UserMeView,
)

urlpatterns = [
    path("export/", ExportPdfView.as_view(), name="export-pdf"),
    path("preview/", PreviewPageView.as_view(), name="preview-page"),
    # Auth
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/google/", GoogleAuthView.as_view(), name="auth-google"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    path("auth/me/", UserMeView.as_view(), name="auth-me"),
    # Payments
    path("payments/create/", CreatePaymentView.as_view(), name="payments-create"),
    path("payments/webhook/", PaymentWebhookView.as_view(), name="payments-webhook"),
]

