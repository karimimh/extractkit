from django.contrib import admin

from .models import AnonymousDownload, CreditTransaction, CryptoPayment, UserProfile


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
