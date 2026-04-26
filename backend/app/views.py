from drf_spectacular.utils import OpenApiExample, OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import ExportRequestSerializer
from .services.cleaner import clean_html
from .services.extractor import ContentExtractionError, extract_main_content
from .services.pdf_generator import PdfGenerationError, generate_pdf


class ExportPdfView(APIView):
    @extend_schema(
        tags=["Export"],
        request=ExportRequestSerializer,
        responses={
            200: OpenApiResponse(description="PDF generated successfully"),
            400: OpenApiResponse(description="Validation or extraction error"),
        },
        examples=[
            OpenApiExample(
                "Basic request",
                value={"url": "https://example.com/article"},
                request_only=True,
            )
        ],
    )
    def post(self, request):
        serializer = ExportRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        url = serializer.validated_data["url"]

        try:
            extracted = extract_main_content(url)
            cleaned_html = clean_html(extracted.html)
            relative_pdf_path = generate_pdf(extracted.title, cleaned_html)
        except ContentExtractionError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
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

        pdf_url = request.build_absolute_uri(f"/media/{relative_pdf_path}")
        return Response(
            {
                "title": extracted.title,
                "pdf_url": pdf_url,
            },
            status=status.HTTP_200_OK,
        )
