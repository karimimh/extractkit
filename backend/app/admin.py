from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User

from .models import (
    AnonymousDownload,
    CreditTransaction,
    CryptoPayment,
    DeveloperAPIKey,
    ExportJob,
    ExportSchedule,
    MonitorChange,
    MonitorSnapshot,
    UserProfile,
    WebpageMonitor,
)


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    extra = 0
    verbose_name_plural = "Wallet"
    fields = ("balance_cents",)


class ExtractKitUserAdmin(UserAdmin):
    inlines = UserAdmin.inlines + (UserProfileInline,)


admin.site.unregister(User)
admin.site.register(User, ExtractKitUserAdmin)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "balance_cents")
    search_fields = ("user__email", "user__username")
    autocomplete_fields = ("user",)


@admin.register(CryptoPayment)
class CryptoPaymentAdmin(admin.ModelAdmin):
    list_display = ("user", "balance_cents", "amount_usd", "status", "created_at", "confirmed_at")
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


@admin.register(DeveloperAPIKey)
class DeveloperAPIKeyAdmin(admin.ModelAdmin):
    list_display = ("name", "prefix", "user", "last_used_at", "created_at", "revoked_at")
    search_fields = ("name", "prefix", "user__email")
    readonly_fields = ("public_id", "prefix", "key_hash", "last_used_at", "created_at", "revoked_at")


@admin.register(ExportSchedule)
class ExportScheduleAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "tool", "frequency", "is_active", "next_run_at", "last_run_at")
    list_filter = ("frequency", "is_active")
    search_fields = ("name", "user__email", "webhook_url")
    readonly_fields = ("public_id", "created_at", "updated_at", "last_run_at")


admin.site.register(WebpageMonitor)
admin.site.register(MonitorSnapshot)
admin.site.register(MonitorChange)
