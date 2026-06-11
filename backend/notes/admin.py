from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from django.utils.html import format_html
from .models import Label, Note, NoteImage, UserStorageStats
from app.models import CreditTransaction, UserProfile


@admin.register(Label)
class LabelAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'color', 'created_at')
    list_filter = ('user', 'created_at')
    search_fields = ('name', 'user__username')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('name', )


class NoteImageInline(admin.TabularInline):
    model = NoteImage
    extra = 0
    readonly_fields = ('uploaded_at', )
    fields = ('image', 'alt_text', 'uploaded_at')


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    inlines = [NoteImageInline]
    list_display = ('id', 'title', 'user', 'content_type', 'is_pinned',
                    'created_at')
    list_filter = ('content_type', 'is_pinned', 'created_at', 'user')
    search_fields = ('title', 'content', 'user__username')
    readonly_fields = ('created_at', 'updated_at')
    filter_horizontal = ('labels', )
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'title', 'content', 'content_type')
        }),
        ('Labels', {
            'fields': ('labels', )
        }),
        ('Status', {
            'fields': ('is_pinned', )
        }),
        ('Appearance', {
            'fields': ('color', 'bg_color')
        }),
        ('Ordering', {
            'fields': ('order', 'pin_order')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse', )
        }),
    )
    ordering = ('-created_at', )


@admin.register(NoteImage)
class NoteImageAdmin(admin.ModelAdmin):
    list_display = ('id', 'note', 'user_email', 'alt_text', 'uploaded_at')
    list_filter = ('uploaded_at', )
    search_fields = ('note__title', 'alt_text', 'note__user__email')
    readonly_fields = ('uploaded_at', )
    ordering = ('-uploaded_at', )

    def user_email(self, obj):
        return obj.note.user.email

    user_email.short_description = 'User Email'


@admin.register(UserStorageStats)
class UserStorageStatsAdmin(admin.ModelAdmin):
    list_display = ('user', 'storage_used_display', 'note_count',
                    'label_count', 'updated_at')
    list_filter = ('updated_at', )
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('user', 'storage_used_bytes', 'storage_used_mb',
                       'note_count', 'label_count', 'updated_at')
    ordering = ('-storage_used_bytes', )

    def storage_used_display(self, obj):
        """Display storage in a human-readable format"""
        mb = obj.storage_used_mb
        if mb >= 1024:
            gb = round(mb / 1024, 2)
            return format_html('<strong>{} GB</strong>', gb)
        return format_html('<strong>{} MB</strong>', mb)

    storage_used_display.short_description = 'Storage Used'

    def has_add_permission(self, request):
        """Prevent manual creation of storage stats"""
        return False

    actions = ['recalculate_stats']

    def recalculate_stats(self, request, queryset):
        """Admin action to recalculate statistics"""
        count = 0
        for stats in queryset:
            stats.recalculate_stats()
            count += 1
        self.message_user(
            request,
            f'Successfully recalculated statistics for {count} user(s).')

    recalculate_stats.short_description = 'Recalculate statistics'


# Custom User Admin with Notes inline and Storage Stats
class NoteInline(admin.TabularInline):
    model = Note
    extra = 0
    fields = ('title', 'content_type', 'is_pinned', 'created_at')
    readonly_fields = ('created_at', )
    show_change_link = True
    can_delete = False


class UserStorageStatsInline(admin.StackedInline):
    model = UserStorageStats
    extra = 0
    can_delete = False
    readonly_fields = ('storage_used_bytes', 'storage_used_mb', 'note_count',
                       'label_count', 'updated_at')
    fields = ('storage_used_mb', 'storage_used_bytes', 'note_count',
              'label_count', 'updated_at')

    def has_add_permission(self, request, obj=None):
        return False


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = "Wallet"
    fields = ("download_credits",)


class CustomUserAdmin(BaseUserAdmin):
    inlines = [UserProfileInline, UserStorageStatsInline, NoteInline]

    def save_formset(self, request, form, formset, change):
        instances = formset.save(commit=False)
        for instance in instances:
            if isinstance(instance, UserProfile) and instance.pk:
                try:
                    old = UserProfile.objects.get(pk=instance.pk)
                    delta = instance.download_credits - old.download_credits
                except UserProfile.DoesNotExist:
                    delta = 0
                instance.save()
                if delta != 0:
                    CreditTransaction.objects.create(
                        user=instance.user,
                        kind=CreditTransaction.GRANT if delta > 0 else CreditTransaction.SPEND,
                        action="admin_adjustment",
                        amount=delta,
                        balance_after=instance.download_credits,
                        reference=f"Admin adjustment by {request.user.get_username()}",
                    )
            else:
                instance.save()
        formset.save_m2m()


# Unregister the default User admin and register our custom one
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)
