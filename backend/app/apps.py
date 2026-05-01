from django.apps import AppConfig as DjangoAppConfig


class AppConfig(DjangoAppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "app"

    def ready(self):
        from django.contrib.auth.models import User
        from django.db.models.signals import post_save

        from .models import UserProfile

        def _create_user_profile(sender, instance, created, **kwargs):
            if created:
                UserProfile.objects.get_or_create(user=instance)

        post_save.connect(_create_user_profile, sender=User)
