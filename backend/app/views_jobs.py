import json

from django.http import HttpResponse, HttpResponseRedirect
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .jobs import _view_classes, enqueue, serialize_job, tool_for
from .models import ExportJob
from .views import get_client_ip


def _get_visible_job(request, public_id):
    job = ExportJob.objects.filter(public_id=public_id).first()
    if not job:
        return None
    if job.user_id and (not request.user.is_authenticated or job.user_id != request.user.id):
        return None
    return job


class ExportJobListCreateView(APIView):
    def get(self, request):
        if not request.user.is_authenticated:
            return Response({"detail": "Sign in to view export history."}, status=status.HTTP_401_UNAUTHORIZED)
        jobs = ExportJob.objects.filter(user=request.user)[:50]
        return Response([serialize_job(job) for job in jobs])

    def post(self, request):
        endpoint = request.data.get("endpoint", "")
        payload = request.data.get("payload", {})
        if endpoint not in _view_classes() or not isinstance(payload, dict):
            return Response({"detail": "Invalid job request."}, status=status.HTTP_400_BAD_REQUEST)
        job = ExportJob.objects.create(
            user=request.user if request.user.is_authenticated else None,
            client_ip=get_client_ip(request),
            tool=tool_for(endpoint, payload),
            endpoint=endpoint,
            origin=request.build_absolute_uri("/").rstrip("/"),
            request_data=payload,
        )
        enqueue(job.id)
        return Response(serialize_job(job), status=status.HTTP_202_ACCEPTED)


class ExportJobDetailView(APIView):
    def get(self, request, public_id):
        job = _get_visible_job(request, public_id)
        if not job:
            return Response({"detail": "Job not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(serialize_job(job))


class ExportJobRerunView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, public_id):
        source = ExportJob.objects.filter(public_id=public_id, user=request.user).first()
        if not source:
            return Response({"detail": "Job not found."}, status=status.HTTP_404_NOT_FOUND)
        job = ExportJob.objects.create(
            user=request.user,
            client_ip=get_client_ip(request),
            tool=source.tool,
            endpoint=source.endpoint,
            origin=request.build_absolute_uri("/").rstrip("/"),
            request_data=source.request_data,
        )
        enqueue(job.id)
        return Response(serialize_job(job), status=status.HTTP_202_ACCEPTED)


class ExportJobDownloadView(APIView):
    def get(self, request, public_id):
        # The unguessable UUID acts as the download capability because browser
        # download navigation cannot attach the JWT Authorization header.
        job = ExportJob.objects.filter(public_id=public_id).first()
        if not job or job.status != ExportJob.COMPLETED:
            return Response({"detail": "Completed job not found."}, status=status.HTTP_404_NOT_FOUND)
        result = job.result or {}
        for key in ("file_url", "pdf_url", "image_url"):
            if result.get(key):
                return HttpResponseRedirect(result[key])
        if "content" in result:
            response = HttpResponse(result["content"], content_type="text/markdown; charset=utf-8")
            extension = "md"
        else:
            response = HttpResponse(json.dumps(result.get("data", result), indent=2), content_type="application/json")
            extension = "json"
        response["Content-Disposition"] = f'attachment; filename="{job.tool}-{job.public_id}.{extension}"'
        return response
