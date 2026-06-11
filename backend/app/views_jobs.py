import json
import secrets

from django.core.exceptions import ValidationError
from django.core.validators import URLValidator
from django.db import IntegrityError, transaction
from django.http import HttpResponse, HttpResponseRedirect
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .jobs import _view_classes, enqueue, serialize_job, tool_for
from .models import DeveloperAPIKey, ExportJob, ExportSchedule
from .views import get_client_ip


def _get_visible_job(request, public_id):
    job = ExportJob.objects.filter(public_id=public_id).first()
    if not job:
        return None
    if job.user_id and (not request.user.is_authenticated or job.user_id != request.user.id):
        return None
    return job


def _serialize_schedule(schedule, reveal_secret=False):
    data = {
        "id": str(schedule.public_id),
        "name": schedule.name,
        "tool": schedule.tool,
        "endpoint": schedule.endpoint,
        "payload": schedule.request_data,
        "frequency": schedule.frequency,
        "webhook_url": schedule.webhook_url,
        "webhook_configured": bool(schedule.webhook_url),
        "is_active": schedule.is_active,
        "next_run_at": schedule.next_run_at,
        "last_run_at": schedule.last_run_at,
        "created_at": schedule.created_at,
    }
    if reveal_secret:
        data["webhook_secret"] = schedule.webhook_secret
    return data


def _validated_schedule_data(data, partial=False):
    result = {}
    if not partial or "frequency" in data:
        frequency = data.get("frequency")
        if frequency not in dict(ExportSchedule.FREQUENCY_CHOICES):
            raise ValueError("Frequency must be hourly, daily, weekly, or monthly.")
        result["frequency"] = frequency
    if not partial or "next_run_at" in data:
        value = data.get("next_run_at")
        next_run_at = parse_datetime(value) if isinstance(value, str) else value
        if not next_run_at:
            raise ValueError("A valid next_run_at date and time is required.")
        if timezone.is_naive(next_run_at):
            next_run_at = timezone.make_aware(next_run_at)
        result["next_run_at"] = next_run_at
    if "name" in data:
        result["name"] = str(data.get("name", ""))[:120]
    if "is_active" in data:
        result["is_active"] = bool(data["is_active"])
    if "webhook_url" in data:
        webhook_url = str(data.get("webhook_url", "")).strip()
        if webhook_url:
            try:
                URLValidator(schemes=["http", "https"])(webhook_url)
            except ValidationError as exc:
                raise ValueError("Webhook URL must be a valid HTTP or HTTPS URL.") from exc
        result["webhook_url"] = webhook_url
    if "webhook_secret" in data:
        webhook_secret = str(data.get("webhook_secret", "")).strip()
        if len(webhook_secret) > 128:
            raise ValueError("Webhook secret must be 128 characters or fewer.")
        result["webhook_secret"] = webhook_secret
    return result


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
        idempotency_key = request.headers.get("Idempotency-Key", "").strip()
        if len(idempotency_key) > 200:
            return Response({"detail": "Idempotency-Key must be 200 characters or fewer."}, status=status.HTTP_400_BAD_REQUEST)
        if idempotency_key and not request.user.is_authenticated:
            return Response({"detail": "Authentication is required when using Idempotency-Key."}, status=status.HTTP_401_UNAUTHORIZED)
        if idempotency_key:
            existing = ExportJob.objects.filter(user=request.user, idempotency_key=idempotency_key).first()
            if existing:
                return Response({**serialize_job(existing), "idempotent_replay": True}, status=status.HTTP_202_ACCEPTED)

        webhook_url = str(request.data.get("webhook_url", "")).strip()
        webhook_secret = str(request.data.get("webhook_secret", "")).strip()
        if webhook_url and not request.user.is_authenticated:
            return Response({"detail": "Authentication is required when using webhooks."}, status=status.HTTP_401_UNAUTHORIZED)
        if webhook_url:
            try:
                URLValidator(schemes=["http", "https"])(webhook_url)
            except ValidationError:
                return Response({"detail": "Webhook URL must be a valid HTTP or HTTPS URL."}, status=status.HTTP_400_BAD_REQUEST)
            webhook_secret = webhook_secret or secrets.token_urlsafe(32)
        if len(webhook_secret) > 128:
            return Response({"detail": "Webhook secret must be 128 characters or fewer."}, status=status.HTTP_400_BAD_REQUEST)

        values = {
            "user": request.user if request.user.is_authenticated else None,
            "api_key": request.auth if isinstance(request.auth, DeveloperAPIKey) else None,
            "client_ip": get_client_ip(request),
            "idempotency_key": idempotency_key,
            "tool": tool_for(endpoint, payload),
            "endpoint": endpoint,
            "origin": request.build_absolute_uri("/").rstrip("/"),
            "request_data": payload,
            "webhook_url": webhook_url,
            "webhook_secret": webhook_secret,
        }
        try:
            with transaction.atomic():
                job = ExportJob.objects.create(**values)
        except IntegrityError:
            existing = ExportJob.objects.get(user=request.user, idempotency_key=idempotency_key)
            return Response({**serialize_job(existing), "idempotent_replay": True}, status=status.HTTP_202_ACCEPTED)
        enqueue(job.id)
        data = serialize_job(job)
        if webhook_url:
            data["webhook_secret"] = webhook_secret
        return Response(data, status=status.HTTP_202_ACCEPTED)


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


class ExportScheduleListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        schedules = ExportSchedule.objects.filter(user=request.user)
        return Response([_serialize_schedule(schedule) for schedule in schedules])

    def post(self, request):
        try:
            values = _validated_schedule_data(request.data)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        source_job_id = request.data.get("source_job_id")
        if source_job_id:
            source = ExportJob.objects.filter(public_id=source_job_id, user=request.user).first()
            if not source:
                return Response({"detail": "Source job not found."}, status=status.HTTP_404_NOT_FOUND)
            endpoint, payload, tool, origin = source.endpoint, source.request_data, source.tool, source.origin
        else:
            endpoint = request.data.get("endpoint", "")
            payload = request.data.get("payload", {})
            if endpoint not in _view_classes() or not isinstance(payload, dict):
                return Response({"detail": "Invalid scheduled export request."}, status=status.HTTP_400_BAD_REQUEST)
            tool = tool_for(endpoint, payload)
            origin = request.build_absolute_uri("/").rstrip("/")

        webhook_secret = values.pop("webhook_secret", "")
        if values.get("webhook_url"):
            webhook_secret = webhook_secret or secrets.token_urlsafe(32)
        schedule = ExportSchedule.objects.create(
            user=request.user,
            endpoint=endpoint,
            request_data=payload,
            tool=tool,
            origin=origin,
            webhook_secret=webhook_secret,
            **values,
        )
        return Response(_serialize_schedule(schedule, reveal_secret=True), status=status.HTTP_201_CREATED)


class ExportScheduleDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get(self, request, public_id):
        return ExportSchedule.objects.filter(public_id=public_id, user=request.user).first()

    def patch(self, request, public_id):
        schedule = self._get(request, public_id)
        if not schedule:
            return Response({"detail": "Schedule not found."}, status=status.HTTP_404_NOT_FOUND)
        try:
            values = _validated_schedule_data(request.data, partial=True)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        if values.get("webhook_url") and not values.get("webhook_secret") and not schedule.webhook_secret:
            values["webhook_secret"] = secrets.token_urlsafe(32)
        if "webhook_url" in values and not values["webhook_url"]:
            values["webhook_secret"] = ""
        for key, value in values.items():
            setattr(schedule, key, value)
        schedule.save()
        return Response(_serialize_schedule(schedule, reveal_secret="webhook_secret" in values))

    def delete(self, request, public_id):
        schedule = self._get(request, public_id)
        if not schedule:
            return Response({"detail": "Schedule not found."}, status=status.HTTP_404_NOT_FOUND)
        schedule.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
