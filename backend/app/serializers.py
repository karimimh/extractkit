from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import serializers

from .services.custom_structured_extractor import (
    CustomStructuredExtractionError,
    validate_json_schema,
)


class PreviewRequestSerializer(serializers.Serializer):
    url = serializers.URLField(required=True)
    use_print_css = serializers.BooleanField(required=False, default=False)


class WebsiteCrawlSerializer(serializers.Serializer):
    url = serializers.URLField(required=True)
    max_pages = serializers.IntegerField(required=False, default=50, min_value=1, max_value=50)
    max_depth = serializers.IntegerField(required=False, default=2, min_value=0, max_value=5)
    include_patterns = serializers.ListField(
        child=serializers.CharField(max_length=300),
        required=False,
        default=list,
        max_length=20,
    )
    exclude_patterns = serializers.ListField(
        child=serializers.CharField(max_length=300),
        required=False,
        default=list,
        max_length=20,
    )
    sitemap_only = serializers.BooleanField(required=False, default=False)


# ---------------------------------------------------------------------------
# Bulk export serializers
# ---------------------------------------------------------------------------

class BulkExportPdfSerializer(serializers.Serializer):
    urls = serializers.ListField(
        child=serializers.URLField(),
        min_length=1,
        max_length=50,
    )
    output_mode = serializers.ChoiceField(choices=["zip", "combined"], default="zip")
    use_print_css = serializers.BooleanField(required=False, default=False)
    ai_cleanup = serializers.BooleanField(required=False, default=False)


class BulkExportMarkdownSerializer(serializers.Serializer):
    urls = serializers.ListField(
        child=serializers.URLField(),
        min_length=1,
        max_length=50,
    )
    output_mode = serializers.ChoiceField(choices=["zip", "combined"], default="zip")
    ai_cleanup = serializers.BooleanField(required=False, default=False)


class BulkExportStructuredJsonSerializer(serializers.Serializer):
    urls = serializers.ListField(
        child=serializers.URLField(),
        min_length=1,
        max_length=50,
    )
    output_mode = serializers.ChoiceField(choices=["zip", "combined"], default="zip")
    ai_cleanup = serializers.BooleanField(required=False, default=False)


class BulkExportScreenshotSerializer(serializers.Serializer):
    urls = serializers.ListField(
        child=serializers.URLField(),
        min_length=1,
        max_length=50,
    )
    width = serializers.IntegerField(required=False, default=1440, min_value=320, max_value=3840)
    ai_cleanup = serializers.BooleanField(required=False, default=False)


class ExportMarkdownSerializer(serializers.Serializer):
    url = serializers.URLField(required=True)
    html_snapshot = serializers.CharField(required=False, allow_blank=True)
    base_url = serializers.URLField(required=False)
    selectors = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list,
        allow_empty=True,
    )
    ai_cleanup = serializers.BooleanField(required=False, default=False)

    def validate(self, attrs):
        html_snapshot = attrs.get("html_snapshot")
        base_url = attrs.get("base_url")
        if html_snapshot and not base_url:
            raise serializers.ValidationError(
                "base_url is required when html_snapshot is provided."
            )
        return attrs


class ExportStructuredJsonSerializer(serializers.Serializer):
    url = serializers.URLField(required=True)
    html_snapshot = serializers.CharField(required=False, allow_blank=True)
    base_url = serializers.URLField(required=False)
    extraction_mode = serializers.ChoiceField(
        choices=["standard", "custom"],
        required=False,
        default="standard",
    )
    extraction_prompt = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=4000,
    )
    json_schema = serializers.JSONField(required=False)
    selectors = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list,
        allow_empty=True,
    )
    ai_cleanup = serializers.BooleanField(required=False, default=False)

    def validate(self, attrs):
        html_snapshot = attrs.get("html_snapshot")
        base_url = attrs.get("base_url")
        if html_snapshot and not base_url:
            raise serializers.ValidationError(
                "base_url is required when html_snapshot is provided."
            )
        if attrs.get("extraction_mode") == "custom" and not attrs.get("extraction_prompt", "").strip():
            raise serializers.ValidationError(
                {"extraction_prompt": "Describe the data to extract."}
            )
        schema = attrs.get("json_schema")
        if schema is not None and not isinstance(schema, dict):
            raise serializers.ValidationError(
                {"json_schema": "JSON Schema must be a JSON object."}
            )
        if schema is not None:
            try:
                validate_json_schema(schema)
            except CustomStructuredExtractionError as exc:
                raise serializers.ValidationError({"json_schema": str(exc)}) from exc
        return attrs


class ExportTabularSerializer(ExportStructuredJsonSerializer):
    export_format = serializers.ChoiceField(choices=["csv", "xlsx"])


class ExportRequestSerializer(serializers.Serializer):
    url = serializers.URLField(required=True)
    html_snapshot = serializers.CharField(required=False, allow_blank=True)
    base_url = serializers.URLField(required=False)
    use_print_css = serializers.BooleanField(required=False, default=False)
    ai_cleanup = serializers.BooleanField(required=False, default=False)
    selectors = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list,
        allow_empty=True,
    )

    def validate(self, attrs):
        html_snapshot = attrs.get("html_snapshot")
        base_url = attrs.get("base_url")

        if html_snapshot and not base_url:
            raise serializers.ValidationError(
                "base_url is required when html_snapshot is provided."
            )

        return attrs


class ExportScreenshotSerializer(serializers.Serializer):
    url = serializers.URLField(required=True)
    html_snapshot = serializers.CharField(required=False, allow_blank=True)
    base_url = serializers.URLField(required=False)
    selectors = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list,
        allow_empty=True,
    )
    width = serializers.IntegerField(required=False, default=1440, min_value=320, max_value=3840)
    ai_cleanup = serializers.BooleanField(required=False, default=False)

    def validate(self, attrs):
        html_snapshot = attrs.get("html_snapshot")
        base_url = attrs.get("base_url")
        if html_snapshot and not base_url:
            raise serializers.ValidationError(
                "base_url is required when html_snapshot is provided."
            )
        return attrs


# ---------------------------------------------------------------------------
# Public developer API serializers
# ---------------------------------------------------------------------------

class DeveloperJobCreateSerializer(serializers.Serializer):
    endpoint = serializers.ChoiceField(choices=[
        "crawl", "pdf", "markdown", "json", "tabular", "screenshot",
        "bulk-pdf", "bulk-markdown", "bulk-json", "bulk-screenshot",
    ])
    payload = serializers.JSONField()
    webhook_url = serializers.URLField(required=False)
    webhook_secret = serializers.CharField(required=False, max_length=128)


class DeveloperJobSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    tool = serializers.CharField()
    status = serializers.ChoiceField(choices=["pending", "running", "completed", "failed"])
    title = serializers.CharField()
    error = serializers.CharField()
    response_status = serializers.IntegerField(allow_null=True)
    result = serializers.JSONField(allow_null=True)
    download_url = serializers.CharField(allow_null=True)
    schedule_id = serializers.UUIDField(allow_null=True)
    idempotency_key = serializers.CharField()
    webhook_configured = serializers.BooleanField()
    webhook_status = serializers.IntegerField(allow_null=True)
    webhook_error = serializers.CharField()
    webhook_delivered_at = serializers.DateTimeField(allow_null=True)
    created_at = serializers.DateTimeField()
    started_at = serializers.DateTimeField(allow_null=True)
    finished_at = serializers.DateTimeField(allow_null=True)


class DeveloperMCPRequestSerializer(serializers.Serializer):
    jsonrpc = serializers.CharField(default="2.0")
    id = serializers.JSONField(required=False)
    method = serializers.CharField()
    params = serializers.JSONField(required=False)


class DeveloperMCPResponseSerializer(serializers.Serializer):
    jsonrpc = serializers.CharField()
    id = serializers.JSONField(required=False)
    result = serializers.JSONField(required=False)
    error = serializers.JSONField(required=False)


# ---------------------------------------------------------------------------
# Auth serializers
# ---------------------------------------------------------------------------

class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True)

    def validate_email(self, value):
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password2": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        return User.objects.create_user(
            username=validated_data["email"],
            email=validated_data["email"],
            password=validated_data["password"],
        )


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs["email"].lower()
        password = attrs["password"]
        # Django's default auth uses username; our username == email
        user = authenticate(username=email, password=password)
        if not user:
            raise serializers.ValidationError("Invalid email or password.")
        if not user.is_active:
            raise serializers.ValidationError("This account is inactive.")
        attrs["user"] = user
        return attrs


class GoogleAuthSerializer(serializers.Serializer):
    id_token = serializers.CharField()

    def validate_id_token(self, value):
        if not settings.GOOGLE_CLIENT_ID:
            raise serializers.ValidationError("Google OAuth is not configured on this server.")
        try:
            from google.auth.transport import requests as google_requests
            from google.oauth2 import id_token as google_id_token

            idinfo = google_id_token.verify_oauth2_token(
                value,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
            )
        except (ValueError, Exception) as exc:
            raise serializers.ValidationError(f"Invalid Google token: {exc}")
        return idinfo


class UserSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    email = serializers.EmailField()
    balance_cents = serializers.IntegerField()
    balance_usd = serializers.CharField()


# ---------------------------------------------------------------------------
# Payment serializers
# ---------------------------------------------------------------------------

class CreatePaymentSerializer(serializers.Serializer):
    package_id = serializers.IntegerField()

    def validate_package_id(self, value):
        packages = {pkg["id"]: pkg for pkg in settings.WALLET_PACKAGES}
        if value not in packages:
            raise serializers.ValidationError("Invalid package ID.")
        return value
