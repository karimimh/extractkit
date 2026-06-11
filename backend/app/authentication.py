import hashlib

from django.utils import timezone
from drf_spectacular.extensions import OpenApiAuthenticationExtension
from rest_framework import authentication, exceptions

from .models import DeveloperAPIKey


class DeveloperAPIKeyAuthentication(authentication.BaseAuthentication):
    keyword = "ApiKey"

    def authenticate(self, request):
        raw_key = request.headers.get("X-API-Key", "").strip()
        authorization = request.headers.get("Authorization", "")
        if not raw_key and authorization.startswith(f"{self.keyword} "):
            raw_key = authorization[len(self.keyword) + 1 :].strip()
        if not raw_key and authorization.startswith("Bearer dp_live_"):
            raw_key = authorization[7:].strip()
        if not raw_key:
            return None
        if not raw_key.startswith("dp_live_"):
            raise exceptions.AuthenticationFailed("Invalid API key.")

        key = DeveloperAPIKey.objects.select_related("user").filter(
            key_hash=hashlib.sha256(raw_key.encode()).hexdigest(),
            revoked_at__isnull=True,
        ).first()
        if not key:
            raise exceptions.AuthenticationFailed("Invalid or revoked API key.")
        DeveloperAPIKey.objects.filter(pk=key.pk).update(last_used_at=timezone.now())
        return key.user, key

    def authenticate_header(self, request):
        return self.keyword


class DeveloperAPIKeyAuthenticationScheme(OpenApiAuthenticationExtension):
    target_class = "app.authentication.DeveloperAPIKeyAuthentication"
    name = "DeveloperAPIKey"

    def get_security_definition(self, auto_schema):
        return {"type": "apiKey", "in": "header", "name": "X-API-Key"}
