from drf_spectacular.utils import OpenApiExample, OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import ExportRequestSerializer, PreviewRequestSerializer
from .services.cleaner import clean_html
from .services.extractor import ContentExtractionError, extract_main_content
from .services.pdf_generator import (
    PdfGenerationError,
    generate_pdf_from_snapshot,
    generate_pdf_from_url,
)


class ExportPdfView(APIView):
    @extend_schema(
        tags=["Export"],
        request=ExportRequestSerializer,
        responses={
            200: OpenApiResponse(description="PDF generated successfully"),
            400: OpenApiResponse(description="Validation error"),
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
                    "mode": "include",
                    "selectors": ["main article", ".hero", "#pricing"],
                },
                request_only=True,
            )
        ],
    )
    def post(self, request):
        serializer = ExportRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        url = serializer.validated_data["url"]
        html_snapshot = serializer.validated_data.get("html_snapshot")
        base_url = serializer.validated_data.get("base_url")
        selectors = serializer.validated_data.get("selectors") or []
        mode = serializer.validated_data.get("mode", "exclude")

        try:
            if html_snapshot and base_url:
                generated = generate_pdf_from_snapshot(
                    html_snapshot,
                    base_url,
                    selectors=selectors,
                    mode=mode,
                )
            else:
                generated = generate_pdf_from_url(url, selectors=selectors, mode=mode)
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

        try:
            extracted = extract_main_content(url)
            safe_html = clean_html(extracted.html)
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
                "title": extracted.title,
                "html": safe_html,
                "base_url": url,
            },
            status=status.HTTP_200_OK,
        )
