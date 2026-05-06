import hashlib
import hmac
import json

import requests as http_requests
from django.conf import settings
from django.contrib.auth.models import User
from django.utils import timezone
from drf_spectacular.utils import OpenApiExample, OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import AnonymousDownload, CryptoPayment, UserProfile
from .serializers import (
    CreatePaymentSerializer,
    ExportRequestSerializer,
    GoogleAuthSerializer,
    LoginSerializer,
    PreviewRequestSerializer,
    RegisterSerializer,
)
from .services.cleaner import clean_html
from .services.extractor import ContentExtractionError, extract_main_content
from .services.pdf_generator import (
    PdfGenerationError,
    generate_pdf_from_snapshot,
    generate_pdf_from_url,
    render_html_snapshot,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def get_client_ip(request):
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


# ---------------------------------------------------------------------------
# Auth views
# ---------------------------------------------------------------------------

class RegisterView(APIView):
    @extend_schema(tags=["Auth"])
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(get_tokens_for_user(user), status=status.HTTP_201_CREATED)


class LoginView(APIView):
    @extend_schema(tags=["Auth"])
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        return Response(get_tokens_for_user(user), status=status.HTTP_200_OK)


class GoogleAuthView(APIView):
    @extend_schema(tags=["Auth"])
    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        idinfo = serializer.validated_data["id_token"]
        email = idinfo["email"].lower()
        user, _ = User.objects.get_or_create(
            email=email,
            defaults={"username": email},
        )
        return Response(get_tokens_for_user(user), status=status.HTTP_200_OK)


class UserMeView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["Auth"])
    def get(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        return Response({
            "id": request.user.id,
            "email": request.user.email,
            "download_credits": profile.download_credits,
        })


# ---------------------------------------------------------------------------
# Export & preview views
# ---------------------------------------------------------------------------

class ExportPdfView(APIView):
    @extend_schema(
        tags=["Export"],
        request=ExportRequestSerializer,
        responses={
            200: OpenApiResponse(description="PDF generated successfully"),
            400: OpenApiResponse(description="Validation error"),
            402: OpenApiResponse(description="No download credits remaining"),
            403: OpenApiResponse(description="Free anonymous download limit reached"),
            500: OpenApiResponse(description="PDF generation error"),
        },
        examples=[
            OpenApiExample(
                "Basic request",
                value={"url": "https://example.com/article"},
                request_only=True,
            ),
            OpenApiExample(
                "With selections",
                value={
                    "url": "https://example.com/article",
                    "selectors": [".site-header", "#cookie-banner", ".sidebar"],
                },
                request_only=True,
            )
        ],
    )
    def post(self, request):
        # --- Access control ---
        if request.user.is_authenticated:
            profile, _ = UserProfile.objects.get_or_create(user=request.user)
            if profile.download_credits <= 0:
                return Response(
                    {"detail": "No download credits remaining. Please purchase more."},
                    status=status.HTTP_402_PAYMENT_REQUIRED,
                )
        else:
            ip = get_client_ip(request)
            if AnonymousDownload.objects.filter(ip_address=ip).exists():
                return Response(
                    {"detail": "Free download limit reached. Sign in to download more."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        # --- Validate input ---
        serializer = ExportRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        url = serializer.validated_data["url"]
        html_snapshot = serializer.validated_data.get("html_snapshot")
        base_url = serializer.validated_data.get("base_url")
        selectors = serializer.validated_data.get("selectors") or []
        use_print_css = serializer.validated_data.get("use_print_css", False)

        # --- Generate PDF ---
        try:
            if html_snapshot and base_url:
                generated = generate_pdf_from_snapshot(
                    html_snapshot,
                    base_url,
                    selectors=selectors,
                    use_print_css=use_print_css,
                )
            else:
                generated = generate_pdf_from_url(
                    url,
                    selectors=selectors,
                    use_print_css=use_print_css,
                )
        except PdfGenerationError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        except Exception:
            return Response(
                {"detail": "Failed to generate PDF"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # --- Record usage after successful generation ---
        if request.user.is_authenticated:
            profile.download_credits -= 1
            profile.save()
        else:
            AnonymousDownload.objects.create(ip_address=ip)

        pdf_url = request.build_absolute_uri(f"/media/{generated.relative_path}")
        return Response(
            {
                "title": generated.title,
                "pdf_url": pdf_url,
            },
            status=status.HTTP_200_OK,
        )


class PreviewPageView(APIView):
    @extend_schema(
        tags=["Preview"],
        request=PreviewRequestSerializer,
        responses={
            200: OpenApiResponse(description="Preview HTML fetched successfully"),
            400: OpenApiResponse(description="Validation error"),
            500: OpenApiResponse(description="Preview fetch error"),
        },
        examples=[
            OpenApiExample(
                "Preview request",
                value={"url": "https://example.com/article"},
                request_only=True,
            )
        ],
    )
    def post(self, request):
        serializer = PreviewRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        url = serializer.validated_data["url"]
        use_print_css = serializer.validated_data.get("use_print_css", False)

        try:
            if use_print_css:
                title, html_snapshot = render_html_snapshot(
                    url,
                    use_print_css=True,
                )
                safe_html = clean_html(html_snapshot)
                extracted_title = title
            else:
                extracted = extract_main_content(url)
                safe_html = clean_html(extracted.html)
                extracted_title = extracted.title
        except ContentExtractionError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception:
            return Response(
                {"detail": "Failed to fetch preview"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                "title": extracted_title,
                "html": safe_html,
                "base_url": url,
            },
            status=status.HTTP_200_OK,
        )


# ---------------------------------------------------------------------------
# Payment views
# ---------------------------------------------------------------------------

class CreatePaymentView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["Payments"])
    def post(self, request):
        serializer = CreatePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        package_id = serializer.validated_data["package_id"]
        packages = {pkg["id"]: pkg for pkg in settings.CREDIT_PACKAGES}
        package = packages[package_id]

        base_url = (
            "https://api-sandbox.nowpayments.io/v1/"
            if settings.NOWPAYMENTS_SANDBOX
            else "https://api.nowpayments.io/v1/"
        )

        invoice_payload = {
            "price_amount": package["price_usd"],
            "price_currency": "usd",
            "order_id": f"user-{request.user.id}-pkg-{package_id}",
            "order_description": f"{package['downloads']} PDF downloads",
        }
        if settings.NOWPAYMENTS_IPN_CALLBACK_URL:
            invoice_payload["ipn_callback_url"] = settings.NOWPAYMENTS_IPN_CALLBACK_URL
        if settings.NOWPAYMENTS_SUCCESS_URL:
            invoice_payload["success_url"] = settings.NOWPAYMENTS_SUCCESS_URL
        if settings.NOWPAYMENTS_CANCEL_URL:
            invoice_payload["cancel_url"] = settings.NOWPAYMENTS_CANCEL_URL

        try:
            response = http_requests.post(
                f"{base_url}invoice",
                headers={
                    "x-api-key": settings.NOWPAYMENTS_API_KEY,
                    "Content-Type": "application/json",
                },
                json=invoice_payload,
                timeout=15,
            )
            response.raise_for_status()
            data = response.json()
        except Exception as exc:
            return Response(
                {"detail": f"Payment provider error: {exc}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        payment = CryptoPayment.objects.create(
            user=request.user,
            nowpayments_payment_id=str(data["id"]),
            download_credits=package["downloads"],
            amount_usd=package["price_usd"],
            status="pending",
        )

        return Response(
            {
                "invoice_url": data["invoice_url"],
                "payment_id": payment.nowpayments_payment_id,
            },
            status=status.HTTP_201_CREATED,
        )


class PaymentWebhookView(APIView):
    """Receives IPN (Instant Payment Notification) from NOWPayments."""

    @extend_schema(tags=["Payments"])
    def post(self, request):
        try:
            body = json.loads(request.body)
        except json.JSONDecodeError:
            return Response({"detail": "Invalid JSON"}, status=status.HTTP_400_BAD_REQUEST)

        # Verify HMAC-SHA512 signature if IPN secret is configured
        ipn_secret = settings.NOWPAYMENTS_IPN_SECRET
        if ipn_secret:
            received_sig = request.headers.get("x-nowpayments-sig", "")
            sorted_body = json.dumps(body, sort_keys=True, separators=(",", ":"))
            expected_sig = hmac.new(
                ipn_secret.encode("utf-8"),
                sorted_body.encode("utf-8"),
                hashlib.sha512,
            ).hexdigest()
            if not hmac.compare_digest(received_sig, expected_sig):
                return Response({"detail": "Invalid signature"}, status=status.HTTP_403_FORBIDDEN)

        # NOWPayments IPN body contains both `payment_id` (the crypto payment) and
        # `invoice_id` (the invoice created via /v1/invoice). The CryptoPayment record
        # is stored with the invoice ID, so look up by invoice_id.
        invoice_id = str(body.get("invoice_id", ""))
        payment_status = body.get("payment_status", "")

        try:
            payment = CryptoPayment.objects.get(nowpayments_payment_id=invoice_id)
        except CryptoPayment.DoesNotExist:
            return Response({"detail": "Payment not found"}, status=status.HTTP_404_NOT_FOUND)

        if (
            payment_status in ("finished", "confirmed")
            and payment.status not in ("finished", "confirmed")
        ):
            payment.status = payment_status
            payment.confirmed_at = timezone.now()
            payment.save()

            profile, _ = UserProfile.objects.get_or_create(user=payment.user)
            profile.download_credits += payment.download_credits
            profile.save()

        return Response({"detail": "ok"})
