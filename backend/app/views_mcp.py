import json

from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication

from .authentication import DeveloperAPIKeyAuthentication
from .jobs import _view_classes, enqueue, serialize_job, tool_for
from .models import DeveloperAPIKey, ExportJob
from .serializers import DeveloperMCPRequestSerializer, DeveloperMCPResponseSerializer
from .views import get_client_ip


TOOLS = [
    {
        "name": "create_export_job",
        "description": "Create an asynchronous DistillPage webpage export job.",
        "inputSchema": {
            "type": "object",
            "required": ["endpoint", "payload"],
            "properties": {
                "endpoint": {"type": "string", "enum": list(_view_classes())},
                "payload": {"type": "object"},
            },
        },
    },
    {
        "name": "get_export_job",
        "description": "Get an export job by its public ID.",
        "inputSchema": {
            "type": "object",
            "required": ["id"],
            "properties": {"id": {"type": "string"}},
        },
    },
    {
        "name": "list_export_jobs",
        "description": "List the authenticated account's recent export jobs.",
        "inputSchema": {"type": "object", "properties": {}},
    },
]


def _result(request_id, value):
    return Response({"jsonrpc": "2.0", "id": request_id, "result": value})


def _error(request_id, code, message, http_status=status.HTTP_400_BAD_REQUEST):
    return Response(
        {"jsonrpc": "2.0", "id": request_id, "error": {"code": code, "message": message}},
        status=http_status,
    )


class MCPView(APIView):
    authentication_classes = [DeveloperAPIKeyAuthentication, JWTAuthentication]
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="developer_mcp",
        tags=["MCP"],
        request=DeveloperMCPRequestSerializer,
        responses={200: DeveloperMCPResponseSerializer},
    )
    def post(self, request):
        request_id = request.data.get("id")
        method = request.data.get("method")
        params = request.data.get("params", {})

        if method == "initialize":
            return _result(request_id, {
                "protocolVersion": "2025-03-26",
                "capabilities": {"tools": {}},
                "serverInfo": {"name": "distillpage", "version": "1.0.0"},
            })
        if method == "notifications/initialized":
            return Response(status=status.HTTP_204_NO_CONTENT)
        if method == "tools/list":
            return _result(request_id, {"tools": TOOLS})
        if method != "tools/call":
            return _error(request_id, -32601, "Method not found.")

        name = params.get("name")
        arguments = params.get("arguments", {})
        if not isinstance(arguments, dict):
            return _error(request_id, -32602, "Tool arguments must be an object.")
        if name == "list_export_jobs":
            value = [serialize_job(job) for job in ExportJob.objects.filter(user=request.user)[:50]]
        elif name == "get_export_job":
            job = ExportJob.objects.filter(public_id=arguments.get("id"), user=request.user).first()
            if not job:
                return _error(request_id, -32602, "Job not found.", status.HTTP_404_NOT_FOUND)
            value = serialize_job(job)
        elif name == "create_export_job":
            endpoint = arguments.get("endpoint", "")
            payload = arguments.get("payload", {})
            if endpoint not in _view_classes() or not isinstance(payload, dict):
                return _error(request_id, -32602, "Invalid export job request.")
            job = ExportJob.objects.create(
                user=request.user,
                api_key=request.auth if isinstance(request.auth, DeveloperAPIKey) else None,
                client_ip=get_client_ip(request),
                tool=tool_for(endpoint, payload),
                endpoint=endpoint,
                origin=request.build_absolute_uri("/").rstrip("/"),
                request_data=payload,
            )
            enqueue(job.id)
            value = serialize_job(job)
        else:
            return _error(request_id, -32602, "Unknown tool.")

        return _result(request_id, {
            "content": [{"type": "text", "text": json.dumps(value, default=str)}],
            "structuredContent": value,
        })
