from datetime import timedelta

from django.db.models import Count
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import DeveloperAPIKey, ExportJob


def serialize_api_key(key, raw_key=None):
    data = {
        "id": str(key.public_id),
        "name": key.name,
        "prefix": key.prefix,
        "created_at": key.created_at,
        "last_used_at": key.last_used_at,
        "revoked_at": key.revoked_at,
    }
    if raw_key:
        data["key"] = raw_key
    return data


class DeveloperAPIKeyListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        keys = DeveloperAPIKey.objects.filter(user=request.user)
        return Response([serialize_api_key(key) for key in keys])

    def post(self, request):
        name = str(request.data.get("name", "")).strip()
        if not name:
            return Response({"detail": "API key name is required."}, status=status.HTTP_400_BAD_REQUEST)
        if len(name) > 120:
            return Response({"detail": "API key name must be 120 characters or fewer."}, status=status.HTTP_400_BAD_REQUEST)
        key, raw_key = DeveloperAPIKey.create_key(user=request.user, name=name)
        return Response(serialize_api_key(key, raw_key), status=status.HTTP_201_CREATED)


class DeveloperAPIKeyDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, public_id):
        key = DeveloperAPIKey.objects.filter(public_id=public_id, user=request.user, revoked_at__isnull=True).first()
        if not key:
            return Response({"detail": "API key not found."}, status=status.HTTP_404_NOT_FOUND)
        key.revoked_at = timezone.now()
        key.save(update_fields=["revoked_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class DeveloperUsageView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        since = timezone.now() - timedelta(days=30)
        jobs = ExportJob.objects.filter(user=request.user, created_at__gte=since)
        by_status = {item["status"]: item["count"] for item in jobs.values("status").annotate(count=Count("id"))}
        by_tool = list(jobs.values("tool").annotate(count=Count("id")).order_by("-count", "tool"))
        daily = list(
            jobs.annotate(date=TruncDate("created_at"))
            .values("date")
            .annotate(count=Count("id"))
            .order_by("date")
        )
        return Response({
            "period_days": 30,
            "total_jobs": jobs.count(),
            "successful_jobs": by_status.get(ExportJob.COMPLETED, 0),
            "failed_jobs": by_status.get(ExportJob.FAILED, 0),
            "active_jobs": by_status.get(ExportJob.PENDING, 0) + by_status.get(ExportJob.RUNNING, 0),
            "by_tool": by_tool,
            "daily": daily,
        })


class DeveloperIntegrationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        origin = request.build_absolute_uri("/").rstrip("/")
        return Response({
            "api_base_url": f"{origin}/api",
            "async_job_endpoint": f"{origin}/api/jobs/",
            "documentation_url": f"{origin}/api/developer/docs/",
            "openapi_schema_url": f"{origin}/api/developer/schema/",
            "authentication": {
                "header": "X-API-Key",
                "alternative": "Authorization: ApiKey <key>",
            },
            "automation": {
                "zapier": {"app": "Webhooks by Zapier", "event": "Custom Request"},
                "make": {"app": "HTTP", "event": "Make a request"},
                "n8n": {"node": "HTTP Request", "authentication": "Header Auth"},
            },
            "mcp": {
                "transport": "Streamable HTTP JSON-RPC",
                "url": f"{origin}/api/mcp/",
                "authentication": "X-API-Key",
            },
            "events": ["export.completed", "export.failed"],
        })
