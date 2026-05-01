from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import serializers


class PreviewRequestSerializer(serializers.Serializer):
    url = serializers.URLField(required=True)
    use_print_css = serializers.BooleanField(required=False, default=False)


class ExportRequestSerializer(serializers.Serializer):
    url = serializers.URLField(required=True)
    html_snapshot = serializers.CharField(required=False, allow_blank=True)
    base_url = serializers.URLField(required=False)
    use_print_css = serializers.BooleanField(required=False, default=False)
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
    download_credits = serializers.IntegerField()


# ---------------------------------------------------------------------------
# Payment serializers
# ---------------------------------------------------------------------------

class CreatePaymentSerializer(serializers.Serializer):
    package_id = serializers.IntegerField()

    def validate_package_id(self, value):
        packages = {pkg["id"]: pkg for pkg in settings.CREDIT_PACKAGES}
        if value not in packages:
            raise serializers.ValidationError("Invalid package ID.")
        return value

