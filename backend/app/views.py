import hashlib
import hmac
import json
import logging

import requests as http_requests
from django.conf import settings

logger = logging.getLogger("app.payments")
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
    BulkExportMarkdownSerializer,
    BulkExportPdfSerializer,
    BulkExportScreenshotSerializer,
    BulkExportStructuredJsonSerializer,
    CreatePaymentSerializer,
    ExportMarkdownSerializer,
    ExportRequestSerializer,
    ExportScreenshotSerializer,
    ExportStructuredJsonSerializer,
    GoogleAuthSerializer,
    LoginSerializer,
    PreviewRequestSerializer,
    RegisterSerializer,
)
from .services.cleaner import clean_html
from .services.custom_structured_extractor import (
    CustomStructuredExtractionError,
    extract_custom_structured_data,
)
from .services.credits import InsufficientCredits, charge, get_balance, grant
from .services.extractor import ContentExtractionError, extract_main_content
from .services.markdown_generator import MarkdownGenerationError, html_to_markdown
from .services.markdown_generator import (
    generate_bulk_markdown_zip,
    generate_combined_markdown,
)
from .services.screenshot_generator import (
    ScreenshotGenerationError,
    generate_bulk_screenshots_zip,
    generate_screenshot_from_snapshot,
    generate_screenshot_from_url,
)
from .services.structured_json_generator import (
    StructuredJsonGenerationError,
    generate_bulk_structured_json_zip,
    generate_combined_structured_json,
    html_to_structured_json,
)
from .services.pdf_generator import (
    PdfGenerationError,
    generate_bulk_pdfs_zip,
    generate_combined_pdf,
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


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["Auth"])
    def post(self, request):
        current = request.data.get("current_password", "")
        new = request.data.get("new_password", "")
        if not current or not new:
            return Response({"message": "current_password and new_password are required."}, status=status.HTTP_400_BAD_REQUEST)
        if not request.user.check_password(current):
            return Response({"message": "Current password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)
        request.user.set_password(new)
        request.user.save()
        return Response({"success": True, "message": "Password changed successfully."})


class ForgotPasswordView(APIView):
    @extend_schema(tags=["Auth"])
    def post(self, request):
        email = request.data.get("email", "").lower().strip()
        if not email:
            return Response({"message": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            from django.contrib.auth.forms import PasswordResetForm
            from django.http import HttpRequest as DjangoRequest
            form = PasswordResetForm({"email": email})
            if form.is_valid():
                req = DjangoRequest()
                req.META["SERVER_NAME"] = request.META.get("HTTP_HOST", "distillpage.com")
                req.META["SERVER_PORT"] = "443"
                form.save(request=req, use_https=True, email_template_name="registration/password_reset_email.html")
        except Exception:
            pass
        return Response({"success": True, "message": "If an account with that email exists, a reset link has been sent."})


class ResetPasswordView(APIView):
    @extend_schema(tags=["Auth"])
    def post(self, request):
        uid = request.data.get("uid", "")
        token = request.data.get("code", "")
        new_password = request.data.get("new_password", "")
        if not uid or not token or not new_password:
            return Response({"message": "uid, code, and new_password are required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            from django.contrib.auth.tokens import default_token_generator
            from django.utils.http import urlsafe_base64_decode
            user_pk = urlsafe_base64_decode(uid).decode()
            user = User.objects.get(pk=user_pk)
            if not default_token_generator.check_token(user, token):
                return Response({"message": "Invalid or expired reset token."}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(new_password)
            user.save()
            return Response({"success": True, "message": "Password reset successfully."})
        except Exception:
            return Response({"message": "Invalid reset link."}, status=status.HTTP_400_BAD_REQUEST)


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
            if get_balance(request.user) < 1:
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
        ai_cleanup = serializer.validated_data.get("ai_cleanup", False)

        # --- Generate PDF ---
        try:
            if html_snapshot and base_url:
                generated = generate_pdf_from_snapshot(
                    html_snapshot,
                    base_url,
                    selectors=selectors,
                    use_print_css=use_print_css,
                    ai_cleanup=ai_cleanup,
                )
            else:
                generated = generate_pdf_from_url(
                    url,
                    selectors=selectors,
                    use_print_css=use_print_css,
                    ai_cleanup=ai_cleanup,
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

        # --- Validate PDF was created successfully ---
        from pathlib import Path
        pdf_file_path = Path(settings.MEDIA_ROOT) / generated.relative_path
        if not pdf_file_path.exists() or pdf_file_path.stat().st_size == 0:
            return Response(
                {"detail": "PDF generation completed but file is invalid. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # --- Record usage after successful generation ---
        if request.user.is_authenticated:
            try:
                charge(request.user, "pdf.export")
            except InsufficientCredits:
                return Response(
                    {"detail": "No download credits remaining. Please purchase more."},
                    status=status.HTTP_402_PAYMENT_REQUIRED,
                )
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
# Markdown export view
# ---------------------------------------------------------------------------

class ExportMarkdownView(APIView):
    @extend_schema(
        tags=["Export"],
        request=ExportMarkdownSerializer,
        responses={
            200: OpenApiResponse(description="Markdown generated successfully"),
            400: OpenApiResponse(description="Validation error"),
            402: OpenApiResponse(description="No download credits remaining"),
            403: OpenApiResponse(description="Free anonymous download limit reached"),
            500: OpenApiResponse(description="Markdown generation error"),
        },
    )
    def post(self, request):
        # --- Access control ---
        if request.user.is_authenticated:
            if get_balance(request.user) < 1:
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
        serializer = ExportMarkdownSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        url = serializer.validated_data["url"]
        html_snapshot = serializer.validated_data.get("html_snapshot")
        selectors = serializer.validated_data.get("selectors") or []
        ai_cleanup = serializer.validated_data.get("ai_cleanup", False)

        # --- Fetch HTML if no snapshot provided ---
        try:
            if html_snapshot:
                from bs4 import BeautifulSoup
                soup = BeautifulSoup(html_snapshot, "html.parser")
                title = (
                    soup.title.string.strip()
                    if soup.title and soup.title.string
                    else "Exported Page"
                )
                source_html = html_snapshot
            else:
                extracted = extract_main_content(url)
                title = extracted.title
                source_html = extracted.html
        except ContentExtractionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response(
                {"detail": "Failed to fetch page"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # --- Convert to Markdown ---
        try:
            generated = html_to_markdown(source_html, title, selectors=selectors, ai_cleanup=ai_cleanup)
        except MarkdownGenerationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception:
            return Response(
                {"detail": "Failed to generate Markdown"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # --- Record usage ---
        if request.user.is_authenticated:
            try:
                charge(request.user, "markdown.export")
            except InsufficientCredits:
                return Response(
                    {"detail": "No download credits remaining. Please purchase more."},
                    status=status.HTTP_402_PAYMENT_REQUIRED,
                )
        else:
            ip = get_client_ip(request)
            AnonymousDownload.objects.create(ip_address=ip)

        return Response(
            {
                "title": generated.title,
                "content": generated.content,
            },
            status=status.HTTP_200_OK,
        )


# ---------------------------------------------------------------------------
# Structured JSON export view
# ---------------------------------------------------------------------------

class ExportStructuredJsonView(APIView):
    @extend_schema(
        tags=["Export"],
        request=ExportStructuredJsonSerializer,
        responses={
            200: OpenApiResponse(description="Structured JSON generated successfully"),
            400: OpenApiResponse(description="Validation error"),
            402: OpenApiResponse(description="No download credits remaining"),
            403: OpenApiResponse(description="Free anonymous download limit reached"),
            500: OpenApiResponse(description="Structured JSON generation error"),
        },
    )
    def post(self, request):
        # --- Access control ---
        if request.user.is_authenticated:
            if get_balance(request.user) < 1:
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
        serializer = ExportStructuredJsonSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        url = serializer.validated_data["url"]
        html_snapshot = serializer.validated_data.get("html_snapshot")
        base_url = serializer.validated_data.get("base_url") or url
        selectors = serializer.validated_data.get("selectors") or []
        ai_cleanup = serializer.validated_data.get("ai_cleanup", False)
        extraction_mode = serializer.validated_data.get("extraction_mode", "standard")
        extraction_prompt = serializer.validated_data.get("extraction_prompt", "")
        json_schema = serializer.validated_data.get("json_schema")
        if extraction_mode == "custom":
            selectors = []
            ai_cleanup = False

        # --- Fetch HTML if no snapshot provided ---
        try:
            if html_snapshot:
                from bs4 import BeautifulSoup
                soup = BeautifulSoup(html_snapshot, "html.parser")
                title = (
                    soup.title.string.strip()
                    if soup.title and soup.title.string
                    else "Exported Website"
                )
                source_html = html_snapshot
            else:
                extracted = extract_main_content(url)
                title = extracted.title
                source_html = extracted.html
        except ContentExtractionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response(
                {"detail": "Failed to fetch page"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # --- Extract structured JSON ---
        try:
            if extraction_mode == "custom":
                custom_data = extract_custom_structured_data(
                    source_html,
                    extraction_prompt,
                    schema=json_schema,
                    selectors=selectors,
                    ai_cleanup=ai_cleanup,
                )
                generated_title = title
                generated_data = custom_data
            else:
                generated = html_to_structured_json(
                    source_html,
                    title,
                    source_url=base_url,
                    selectors=selectors,
                    ai_cleanup=ai_cleanup,
                )
                generated_title = generated.title
                generated_data = generated.data
        except (StructuredJsonGenerationError, CustomStructuredExtractionError) as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception:
            return Response(
                {"detail": "Failed to generate structured JSON"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # --- Record usage ---
        if request.user.is_authenticated:
            try:
                charge(request.user, "structured_json.export")
            except InsufficientCredits:
                return Response(
                    {"detail": "No download credits remaining. Please purchase more."},
                    status=status.HTTP_402_PAYMENT_REQUIRED,
                )
        else:
            ip = get_client_ip(request)
            AnonymousDownload.objects.create(ip_address=ip)

        return Response(
            {
                "title": generated_title,
                "data": generated_data,
            },
            status=status.HTTP_200_OK,
        )


# ---------------------------------------------------------------------------
# Screenshot export view
# ---------------------------------------------------------------------------

class ExportScreenshotView(APIView):
    @extend_schema(
        tags=["Export"],
        request=ExportScreenshotSerializer,
        responses={
            200: OpenApiResponse(description="Screenshot generated successfully"),
            400: OpenApiResponse(description="Validation error"),
            402: OpenApiResponse(description="No download credits remaining"),
            403: OpenApiResponse(description="Free anonymous download limit reached"),
            500: OpenApiResponse(description="Screenshot generation error"),
        },
    )
    def post(self, request):
        # --- Access control ---
        if request.user.is_authenticated:
            if get_balance(request.user) < 1:
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
        serializer = ExportScreenshotSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        url = serializer.validated_data["url"]
        html_snapshot = serializer.validated_data.get("html_snapshot")
        base_url = serializer.validated_data.get("base_url")
        selectors = serializer.validated_data.get("selectors") or []
        width = serializer.validated_data.get("width", 1440)
        ai_cleanup = serializer.validated_data.get("ai_cleanup", False)

        # --- Generate screenshot ---
        try:
            if html_snapshot and base_url:
                generated = generate_screenshot_from_snapshot(
                    html_snapshot,
                    base_url,
                    selectors=selectors,
                    width=width,
                    ai_cleanup=ai_cleanup,
                )
            else:
                generated = generate_screenshot_from_url(
                    url,
                    selectors=selectors,
                    width=width,
                    ai_cleanup=ai_cleanup,
                )
        except ScreenshotGenerationError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        except Exception:
            return Response(
                {"detail": "Failed to generate screenshot"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # --- Record usage ---
        if request.user.is_authenticated:
            try:
                charge(request.user, "screenshot.export")
            except InsufficientCredits:
                return Response(
                    {"detail": "No download credits remaining. Please purchase more."},
                    status=status.HTTP_402_PAYMENT_REQUIRED,
                )
        else:
            ip = get_client_ip(request)
            AnonymousDownload.objects.create(ip_address=ip)

        image_url = request.build_absolute_uri(f"/media/{generated.relative_path}")
        return Response(
            {
                "title": generated.title,
                "image_url": image_url,
            },
            status=status.HTTP_200_OK,
        )


# ---------------------------------------------------------------------------
# Bulk export views
# ---------------------------------------------------------------------------

class BulkExportPdfView(APIView):
    @extend_schema(tags=["Export"])
    def post(self, request):
        # Bulk export requires authentication — no anonymous bulk exports
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Sign in to use bulk export."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = BulkExportPdfSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        urls = serializer.validated_data["urls"]
        output_mode = serializer.validated_data["output_mode"]
        use_print_css = serializer.validated_data.get("use_print_css", False)
        ai_cleanup = serializer.validated_data.get("ai_cleanup", False)
        n = len(urls)

        # Check credits upfront
        from .services.credits import credit_cost, has_credits
        cost_per = credit_cost("pdf.export")
        total_cost = cost_per * n
        if get_balance(request.user) < total_cost:
            return Response(
                {"detail": f"Not enough credits. This export requires {total_cost} credits ({n} URLs × {cost_per})."},
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        try:
            if output_mode == "combined":
                title, relative_path = generate_combined_pdf(urls, use_print_css=use_print_css, ai_cleanup=ai_cleanup)
                file_ext = "pdf"
            else:
                _titles, relative_path = generate_bulk_pdfs_zip(urls, use_print_css=use_print_css, ai_cleanup=ai_cleanup)
                title = "Bulk PDF Export"
                file_ext = "zip"
        except PdfGenerationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception:
            return Response({"detail": "Failed to generate bulk PDFs"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Charge for successfully generated URLs only (charge n credits)
        try:
            charge(request.user, "pdf.export", units=n)
        except InsufficientCredits:
            return Response(
                {"detail": "No download credits remaining. Please purchase more."},
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        file_url = request.build_absolute_uri(f"/media/{relative_path}")
        return Response(
            {"title": title, "file_url": file_url, "file_ext": file_ext},
            status=status.HTTP_200_OK,
        )


class BulkExportMarkdownView(APIView):
    @extend_schema(tags=["Export"])
    def post(self, request):
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Sign in to use bulk export."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = BulkExportMarkdownSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        urls = serializer.validated_data["urls"]
        output_mode = serializer.validated_data["output_mode"]
        ai_cleanup = serializer.validated_data.get("ai_cleanup", False)
        n = len(urls)

        from .services.credits import credit_cost, has_credits
        cost_per = credit_cost("markdown.export")
        total_cost = cost_per * n
        if get_balance(request.user) < total_cost:
            return Response(
                {"detail": f"Not enough credits. This export requires {total_cost} credits ({n} URLs × {cost_per})."},
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        try:
            from .services.markdown_generator import MarkdownGenerationError
            if output_mode == "combined":
                title, relative_path = generate_combined_markdown(urls, ai_cleanup=ai_cleanup)
                file_ext = "md"
            else:
                _titles, relative_path = generate_bulk_markdown_zip(urls, ai_cleanup=ai_cleanup)
                title = "Bulk Markdown Export"
                file_ext = "zip"
        except MarkdownGenerationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception:
            return Response({"detail": "Failed to generate bulk Markdown"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            charge(request.user, "markdown.export", units=n)
        except InsufficientCredits:
            return Response(
                {"detail": "No download credits remaining. Please purchase more."},
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        file_url = request.build_absolute_uri(f"/media/{relative_path}")
        return Response(
            {"title": title, "file_url": file_url, "file_ext": file_ext},
            status=status.HTTP_200_OK,
        )


class BulkExportStructuredJsonView(APIView):
    @extend_schema(tags=["Export"])
    def post(self, request):
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Sign in to use bulk export."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = BulkExportStructuredJsonSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        urls = serializer.validated_data["urls"]
        output_mode = serializer.validated_data["output_mode"]
        ai_cleanup = serializer.validated_data.get("ai_cleanup", False)
        n = len(urls)

        from .services.credits import credit_cost
        cost_per = credit_cost("structured_json.export")
        total_cost = cost_per * n
        if get_balance(request.user) < total_cost:
            return Response(
                {"detail": f"Not enough credits. This export requires {total_cost} credits ({n} URLs × {cost_per})."},
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        try:
            if output_mode == "combined":
                title, relative_path = generate_combined_structured_json(urls, ai_cleanup=ai_cleanup)
                file_ext = "json"
            else:
                _titles, relative_path = generate_bulk_structured_json_zip(urls, ai_cleanup=ai_cleanup)
                title = "Bulk JSON Export"
                file_ext = "zip"
        except StructuredJsonGenerationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception:
            return Response({"detail": "Failed to generate bulk JSON"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            charge(request.user, "structured_json.export", units=n)
        except InsufficientCredits:
            return Response(
                {"detail": "No download credits remaining. Please purchase more."},
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        file_url = request.build_absolute_uri(f"/media/{relative_path}")
        return Response(
            {"title": title, "file_url": file_url, "file_ext": file_ext},
            status=status.HTTP_200_OK,
        )


class BulkExportScreenshotView(APIView):
    @extend_schema(tags=["Export"])
    def post(self, request):
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Sign in to use bulk export."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = BulkExportScreenshotSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        urls = serializer.validated_data["urls"]
        width = serializer.validated_data.get("width", 1440)
        ai_cleanup = serializer.validated_data.get("ai_cleanup", False)
        n = len(urls)

        from .services.credits import credit_cost
        cost_per = credit_cost("screenshot.export")
        total_cost = cost_per * n
        if get_balance(request.user) < total_cost:
            return Response(
                {"detail": f"Not enough credits. This export requires {total_cost} credits ({n} URLs × {cost_per})."},
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        try:
            _titles, relative_path = generate_bulk_screenshots_zip(urls, width=width, ai_cleanup=ai_cleanup)
        except ScreenshotGenerationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception:
            return Response({"detail": "Failed to generate bulk screenshots"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            charge(request.user, "screenshot.export", units=n)
        except InsufficientCredits:
            return Response(
                {"detail": "No download credits remaining. Please purchase more."},
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        file_url = request.build_absolute_uri(f"/media/{relative_path}")
        return Response(
            {"title": "Bulk Screenshot Export", "file_url": file_url, "file_ext": "zip"},
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
        logger.info("=== IPN WEBHOOK RECEIVED ===")
        logger.info("Remote IP: %s", get_client_ip(request))
        logger.info(
            "Headers: %s",
            {k: v for k, v in request.headers.items()},
        )
        raw_body = request.body.decode("utf-8", errors="replace")
        logger.info("Raw body: %s", raw_body)

        try:
            body = json.loads(request.body)
        except json.JSONDecodeError:
            logger.error("Failed to parse JSON body")
            return Response({"detail": "Invalid JSON"}, status=status.HTTP_400_BAD_REQUEST)

        logger.info("Parsed body: %s", json.dumps(body, indent=2))

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
            logger.info("HMAC check — received_sig: %s", received_sig)
            logger.info("HMAC check — expected_sig: %s", expected_sig)
            logger.info("HMAC check — sorted_body:  %s", sorted_body)
            if not hmac.compare_digest(received_sig, expected_sig):
                logger.error("HMAC signature MISMATCH — rejecting webhook")
                return Response({"detail": "Invalid signature"}, status=status.HTTP_403_FORBIDDEN)
            logger.info("HMAC signature OK")
        else:
            logger.warning("NOWPAYMENTS_IPN_SECRET not set — skipping signature check")

        # NOWPayments IPN body contains both `payment_id` (the crypto payment) and
        # `invoice_id` (the invoice created via /v1/invoice). The CryptoPayment record
        # is stored with the invoice ID, so look up by invoice_id.
        invoice_id = str(body.get("invoice_id", ""))
        payment_status = body.get("payment_status", "")
        logger.info(
            "invoice_id=%r  payment_id=%r  payment_status=%r",
            invoice_id,
            body.get("payment_id"),
            payment_status,
        )

        try:
            payment = CryptoPayment.objects.get(nowpayments_payment_id=invoice_id)
            logger.info(
                "DB record found — CryptoPayment id=%s user=%s status=%s credits=%s",
                payment.id,
                payment.user.email,
                payment.status,
                payment.download_credits,
            )
        except CryptoPayment.DoesNotExist:
            logger.error(
                "CryptoPayment NOT FOUND for invoice_id=%r — "
                "the invoice_id in the IPN body does not match any stored record",
                invoice_id,
            )
            # Log recent records to help diagnose field mismatch
            recent = list(CryptoPayment.objects.order_by("-created_at")[:10])
            logger.error("Recent CryptoPayment records (newest first):")
            for p in recent:
                logger.error(
                    "  pk=%s  nowpayments_payment_id=%r  user=%s  status=%s  created=%s",
                    p.id,
                    p.nowpayments_payment_id,
                    p.user.email,
                    p.status,
                    p.created_at,
                )
            return Response({"detail": "Payment not found"}, status=status.HTTP_404_NOT_FOUND)

        if (
            payment_status in ("finished", "confirmed")
            and payment.status not in ("finished", "confirmed")
        ):
            payment.status = payment_status
            payment.confirmed_at = timezone.now()
            payment.save()

            new_balance = grant(
                payment.user,
                payment.download_credits,
                action="topup",
                reference=str(payment.nowpayments_payment_id),
            )
            logger.info(
                "Credits APPLIED — %s credits added to user %s (total now: %s)",
                payment.download_credits,
                payment.user.email,
                new_balance,
            )
        elif payment_status in ("finished", "confirmed"):
            logger.info(
                "Payment already processed (db status=%s) — skipping duplicate IPN",
                payment.status,
            )
        else:
            logger.info(
                "payment_status=%r does not trigger credit award — no action taken",
                payment_status,
            )

        logger.info("=== IPN WEBHOOK DONE ===")
        return Response({"detail": "ok"})


class PaymentDebugView(APIView):
    """
    GET /api/payments/<payment_id>/debug/
    Returns the local DB state for the payment plus the live NOWPayments API state.
    Restricted to the owner of the payment OR staff users.
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["Payments"])
    def get(self, request, payment_id):
        qs = CryptoPayment.objects.filter(nowpayments_payment_id=str(payment_id))
        if not request.user.is_staff:
            qs = qs.filter(user=request.user)
        try:
            payment = qs.get()
        except CryptoPayment.DoesNotExist:
            return Response({"detail": "Payment not found"}, status=status.HTTP_404_NOT_FOUND)

        profile, _ = UserProfile.objects.get_or_create(user=payment.user)

        db_state = {
            "db_pk": payment.id,
            "nowpayments_payment_id": payment.nowpayments_payment_id,
            "db_status": payment.status,
            "download_credits": payment.download_credits,
            "amount_usd": str(payment.amount_usd),
            "created_at": payment.created_at.isoformat(),
            "confirmed_at": payment.confirmed_at.isoformat() if payment.confirmed_at else None,
            "user_email": payment.user.email,
            "user_current_credits": profile.download_credits,
        }

        # Poll the NOWPayments invoice endpoint for live status
        api_base = (
            "https://api-sandbox.nowpayments.io/v1/"
            if settings.NOWPAYMENTS_SANDBOX
            else "https://api.nowpayments.io/v1/"
        )
        nowpayments_data = None
        nowpayments_error = None
        try:
            resp = http_requests.get(
                f"{api_base}invoice/{payment_id}",
                headers={"x-api-key": settings.NOWPAYMENTS_API_KEY},
                timeout=15,
            )
            nowpayments_data = resp.json()
        except Exception as exc:
            nowpayments_error = str(exc)

        return Response(
            {
                "db_state": db_state,
                "nowpayments_sandbox_mode": settings.NOWPAYMENTS_SANDBOX,
                "nowpayments_ipn_callback_url": settings.NOWPAYMENTS_IPN_CALLBACK_URL,
                "nowpayments_api_response": nowpayments_data,
                "nowpayments_api_error": nowpayments_error,
            }
        )


class PaymentForceConfirmView(APIView):
    """
    POST /api/payments/<payment_id>/force-confirm/
    Staff-only: manually applies credits for a payment that the IPN never delivered.
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["Payments"])
    def post(self, request, payment_id):
        if not request.user.is_staff:
            return Response({"detail": "Staff only."}, status=status.HTTP_403_FORBIDDEN)

        try:
            payment = CryptoPayment.objects.get(nowpayments_payment_id=str(payment_id))
        except CryptoPayment.DoesNotExist:
            return Response({"detail": "Payment not found"}, status=status.HTTP_404_NOT_FOUND)

        if payment.status in ("finished", "confirmed"):
            return Response(
                {
                    "detail": "Payment already confirmed — credits were already applied.",
                    "status": payment.status,
                }
            )

        profile, _ = UserProfile.objects.get_or_create(user=payment.user)
        profile.download_credits += payment.download_credits
        profile.save()

        payment.status = "finished"
        payment.confirmed_at = timezone.now()
        payment.save()

        logger.info(
            "FORCE-CONFIRM by staff %s — payment_id=%s user=%s credits=%s (total now %s)",
            request.user.email,
            payment_id,
            payment.user.email,
            payment.download_credits,
            profile.download_credits,
        )

        return Response(
            {
                "detail": "Credits applied successfully.",
                "credits_added": payment.download_credits,
                "user_total_credits": profile.download_credits,
            }
        )
