from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    ChangePasswordView,
    CreatePaymentView,
    ExportPdfView,
    ForgotPasswordView,
    GoogleAuthView,
    LoginView,
    PaymentDebugView,
    PaymentForceConfirmView,
    PaymentWebhookView,
    PreviewPageView,
    RegisterView,
    ResetPasswordView,
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
    path("auth/change-password/", ChangePasswordView.as_view(), name="auth-change-password"),
    path("auth/forgot-password/", ForgotPasswordView.as_view(), name="auth-forgot-password"),
    path("auth/reset-password/", ResetPasswordView.as_view(), name="auth-reset-password"),
    # Payments
    path("payments/create/", CreatePaymentView.as_view(), name="payments-create"),
    path("payments/webhook/", PaymentWebhookView.as_view(), name="payments-webhook"),
    path("payments/ipn/", PaymentWebhookView.as_view(), name="payments-ipn"),  # legacy alias
    path("payments/<str:payment_id>/debug/", PaymentDebugView.as_view(), name="payments-debug"),
    path("payments/<str:payment_id>/force-confirm/", PaymentForceConfirmView.as_view(), name="payments-force-confirm"),
]

