from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User

from .models import AnonymousDownload, CryptoPayment, UserProfile


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = "Profile"
    fields = ("download_credits",)


class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)


admin.site.unregister(User)
admin.site.register(User, UserAdmin)


@admin.register(CryptoPayment)
class CryptoPaymentAdmin(admin.ModelAdmin):
    list_display = ("user", "download_credits", "amount_usd", "status", "created_at", "confirmed_at")
    list_filter = ("status",)
    search_fields = ("user__email", "nowpayments_payment_id")
    readonly_fields = ("nowpayments_payment_id", "created_at", "confirmed_at")


@admin.register(AnonymousDownload)
class AnonymousDownloadAdmin(admin.ModelAdmin):
    list_display = ("ip_address", "created_at")
    list_filter = ("created_at",)
    search_fields = ("ip_address",)
