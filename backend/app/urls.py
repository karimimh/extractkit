from django.conf import settings
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    BulkExportMarkdownView,
    BulkExportPdfView,
    BulkExportScreenshotView,
    BulkExportStructuredJsonView,
    ChangePasswordView,
    CreatePaymentView,
    ExportMarkdownView,
    ExportPdfView,
    ExportScreenshotView,
    ExportStructuredJsonView,
    ExportTabularView,
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
    WebsiteCrawlView,
)
from .views_jobs import (
    ExportJobDetailView,
    ExportJobDownloadView,
    ExportJobListCreateView,
    ExportJobRerunView,
    ExportScheduleDetailView,
    ExportScheduleListCreateView,
)
from .views_developer import (
    DeveloperAPIKeyDetailView,
    DeveloperAPIKeyListCreateView,
    DeveloperIntegrationsView,
    DeveloperUsageView,
)
from .views_monitoring import (
    MonitorChangeDetailView,
    MonitorChangeDownloadView,
    MonitorChangeListView,
    MonitorSnapshotListView,
    MonitorSnapshotRestoreView,
    WebpageMonitorDetailView,
    WebpageMonitorDuplicateView,
    WebpageMonitorListCreateView,
    WebpageMonitorResetBaselineView,
    WebpageMonitorRunView,
)
from .views_mcp import MCPView

urlpatterns = [
    path("developer/keys/", DeveloperAPIKeyListCreateView.as_view(), name="developer-api-keys"),
    path("developer/keys/<uuid:public_id>/", DeveloperAPIKeyDetailView.as_view(), name="developer-api-key-detail"),
    path("developer/usage/", DeveloperUsageView.as_view(), name="developer-usage"),
    path("developer/integrations/", DeveloperIntegrationsView.as_view(), name="developer-integrations"),
    path("mcp/", MCPView.as_view(), name="mcp"),
    path("jobs/", ExportJobListCreateView.as_view(), name="export-jobs"),
    path("jobs/<uuid:public_id>/", ExportJobDetailView.as_view(), name="export-job-detail"),
    path("jobs/<uuid:public_id>/rerun/", ExportJobRerunView.as_view(), name="export-job-rerun"),
    path("jobs/<uuid:public_id>/download/", ExportJobDownloadView.as_view(), name="export-job-download"),
    path("schedules/", ExportScheduleListCreateView.as_view(), name="export-schedules"),
    path("schedules/<uuid:public_id>/", ExportScheduleDetailView.as_view(), name="export-schedule-detail"),
    path("export/", ExportPdfView.as_view(), name="export-pdf"),
    path("export-markdown/", ExportMarkdownView.as_view(), name="export-markdown"),
    path("export-json/", ExportStructuredJsonView.as_view(), name="export-structured-json"),
    path("export-tabular/", ExportTabularView.as_view(), name="export-tabular"),
    path("export-screenshot/", ExportScreenshotView.as_view(), name="export-screenshot"),
    path("export/bulk-pdf/", BulkExportPdfView.as_view(), name="bulk-export-pdf"),
    path("export/bulk-markdown/", BulkExportMarkdownView.as_view(), name="bulk-export-markdown"),
    path("export/bulk-json/", BulkExportStructuredJsonView.as_view(), name="bulk-export-structured-json"),
    path("export/bulk-screenshot/", BulkExportScreenshotView.as_view(), name="bulk-export-screenshot"),
    path("preview/", PreviewPageView.as_view(), name="preview-page"),
    path("crawl/", WebsiteCrawlView.as_view(), name="website-crawl"),
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

if settings.CHANGE_MONITORING_ENABLED:
    urlpatterns += [
        path("monitors/", WebpageMonitorListCreateView.as_view(), name="webpage-monitors"),
        path("monitors/<uuid:public_id>/", WebpageMonitorDetailView.as_view(), name="webpage-monitor-detail"),
        path("monitors/<uuid:public_id>/run/", WebpageMonitorRunView.as_view(), name="webpage-monitor-run"),
        path("monitors/<uuid:public_id>/duplicate/", WebpageMonitorDuplicateView.as_view(), name="webpage-monitor-duplicate"),
        path("monitors/<uuid:public_id>/reset-baseline/", WebpageMonitorResetBaselineView.as_view(), name="webpage-monitor-reset-baseline"),
        path("monitors/<uuid:public_id>/changes/", MonitorChangeListView.as_view(), name="monitor-changes"),
        path("monitor-changes/<uuid:public_id>/", MonitorChangeDetailView.as_view(), name="monitor-change-detail"),
        path("monitors/<uuid:public_id>/snapshots/", MonitorSnapshotListView.as_view(), name="monitor-snapshots"),
        path("monitors/<uuid:public_id>/snapshots/<int:snapshot_id>/restore/", MonitorSnapshotRestoreView.as_view(), name="monitor-snapshot-restore"),
        path("monitor-changes/<uuid:public_id>/download/", MonitorChangeDownloadView.as_view(), name="monitor-change-download"),
    ]
