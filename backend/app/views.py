from drf_spectacular.utils import OpenApiExample, OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import ExportRequestSerializer
from .services.pdf_generator import PdfGenerationError, generate_pdf_from_url


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
            )
        ],
    )
    def post(self, request):
        serializer = ExportRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        url = serializer.validated_data["url"]

        try:
            generated = generate_pdf_from_url(url)
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
