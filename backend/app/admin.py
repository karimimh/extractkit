from django.contrib import admin

from .models import (
    AnonymousDownload,
    CreditTransaction,
    CryptoPayment,
    ExportJob,
    ExportSchedule,
    MonitorChange,
    MonitorSnapshot,
    UserProfile,
    WebpageMonitor,
)


@admin.register(CryptoPayment)
class CryptoPaymentAdmin(admin.ModelAdmin):
    list_display = ("user", "download_credits", "amount_usd", "status", "created_at", "confirmed_at")
    list_filter = ("status",)
    search_fields = ("user__email", "nowpayments_payment_id")


@admin.register(CreditTransaction)
class CreditTransactionAdmin(admin.ModelAdmin):
    list_display = ("user", "kind", "action", "amount", "balance_after", "reference", "created_at")
    list_filter = ("kind", "created_at")
    search_fields = ("user__email", "action", "reference")
    readonly_fields = ("user", "kind", "action", "amount", "balance_after", "reference", "created_at")


@admin.register(AnonymousDownload)
class AnonymousDownloadAdmin(admin.ModelAdmin):
    list_display = ("ip_address", "created_at")
    list_filter = ("created_at",)
    search_fields = ("ip_address",)


@admin.register(ExportJob)
class ExportJobAdmin(admin.ModelAdmin):
    list_display = ("public_id", "user", "tool", "status", "created_at", "finished_at")
    list_filter = ("tool", "status", "created_at")
    search_fields = ("public_id", "user__email", "title")
    readonly_fields = ("public_id", "created_at", "started_at", "finished_at")


@admin.register(ExportSchedule)
class ExportScheduleAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "tool", "frequency", "is_active", "next_run_at", "last_run_at")
    list_filter = ("frequency", "is_active")
    search_fields = ("name", "user__email", "webhook_url")
    readonly_fields = ("public_id", "created_at", "updated_at", "last_run_at")


admin.site.register(WebpageMonitor)
admin.site.register(MonitorSnapshot)
admin.site.register(MonitorChange)
