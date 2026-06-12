import json
import secrets

from django.core.exceptions import ValidationError
from django.core.validators import URLValidator
from django.http import HttpResponse
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import MonitorChange, WebpageMonitor
from .monitoring import enqueue_monitor, serialize_change


def serialize_monitor(monitor, reveal_secret=False):
    latest_change = monitor.changes.first()
    data = {
        "id": str(monitor.public_id),
        "name": monitor.name,
        "url": monitor.url,
        "mode": monitor.mode,
        "selectors": monitor.selectors,
        "fields": monitor.fields,
        "ai_cleanup": monitor.ai_cleanup,
        "frequency": monitor.frequency,
        "webhook_url": monitor.webhook_url,
        "webhook_configured": bool(monitor.webhook_url),
        "notify_email": monitor.notify_email,
        "is_active": monitor.is_active,
        "is_running": monitor.is_running,
        "next_run_at": monitor.next_run_at,
        "last_run_at": monitor.last_run_at,
        "last_changed_at": monitor.last_changed_at,
        "last_error": monitor.last_error,
        "latest_change": serialize_change(latest_change) if latest_change else None,
        "created_at": monitor.created_at,
    }
    if reveal_secret:
        data["webhook_secret"] = monitor.webhook_secret
    return data


def validated_monitor_data(data, partial=False):
    result = {}
    required = () if partial else ("url", "mode", "frequency", "next_run_at")
    for key in required:
        if not data.get(key):
            raise ValueError(f"{key} is required.")
    if "url" in data:
        try:
            URLValidator(schemes=["http", "https"])(data["url"])
        except ValidationError as exc:
            raise ValueError("URL must be a valid HTTP or HTTPS URL.") from exc
        result["url"] = data["url"]
    if "mode" in data:
        if data["mode"] not in dict(WebpageMonitor.MODE_CHOICES):
            raise ValueError("Invalid monitoring mode.")
        result["mode"] = data["mode"]
    if "frequency" in data:
        if data["frequency"] not in dict(WebpageMonitor.FREQUENCY_CHOICES):
            raise ValueError("Invalid frequency.")
        result["frequency"] = data["frequency"]
    if "next_run_at" in data:
        value = parse_datetime(data["next_run_at"]) if isinstance(data["next_run_at"], str) else data["next_run_at"]
        if not value:
            raise ValueError("A valid next_run_at date and time is required.")
        if timezone.is_naive(value):
            value = timezone.make_aware(value)
        result["next_run_at"] = value
    for key in ("selectors", "fields"):
        if key in data:
            values = data[key]
            if not isinstance(values, list) or not all(isinstance(value, str) for value in values):
                raise ValueError(f"{key} must be a list of strings.")
            result[key] = [value.strip() for value in values if value.strip()][:50]
    if "name" in data:
        result["name"] = str(data["name"])[:120]
    for key in ("ai_cleanup", "notify_email", "is_active"):
        if key in data:
            result[key] = bool(data[key])
    if "webhook_url" in data:
        webhook_url = str(data["webhook_url"]).strip()
        if webhook_url:
            try:
                URLValidator(schemes=["http", "https"])(webhook_url)
            except ValidationError as exc:
                raise ValueError("Webhook URL must be a valid HTTP or HTTPS URL.") from exc
        result["webhook_url"] = webhook_url
    if "webhook_secret" in data:
        secret = str(data["webhook_secret"]).strip()
        if len(secret) > 128:
            raise ValueError("Webhook secret must be 128 characters or fewer.")
        result["webhook_secret"] = secret
    mode = result.get("mode", data.get("mode"))
    selectors = result.get("selectors", data.get("selectors", []))
    if mode == WebpageMonitor.SELECTED and not selectors:
        raise ValueError("Selected-element monitors require at least one CSS selector.")
    return result


class WebpageMonitorListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        monitors = WebpageMonitor.objects.filter(user=request.user).prefetch_related("changes")
        return Response([serialize_monitor(monitor) for monitor in monitors])

    def post(self, request):
        try:
            values = validated_monitor_data(request.data)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        webhook_secret = values.pop("webhook_secret", "")
        if values.get("webhook_url"):
            webhook_secret = webhook_secret or secrets.token_urlsafe(32)
        monitor = WebpageMonitor.objects.create(user=request.user, webhook_secret=webhook_secret, **values)
        enqueue_monitor(monitor.id)
        return Response(serialize_monitor(monitor, reveal_secret=True), status=status.HTTP_201_CREATED)


class WebpageMonitorDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get(self, request, public_id):
        return WebpageMonitor.objects.filter(public_id=public_id, user=request.user).first()

    def get(self, request, public_id):
        monitor = self._get(request, public_id)
        if not monitor:
            return Response({"detail": "Monitor not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(serialize_monitor(monitor))

    def patch(self, request, public_id):
        monitor = self._get(request, public_id)
        if not monitor:
            return Response({"detail": "Monitor not found."}, status=status.HTTP_404_NOT_FOUND)
        try:
            values = validated_monitor_data(request.data, partial=True)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        effective_mode = values.get("mode", monitor.mode)
        effective_selectors = values.get("selectors", monitor.selectors)
        if effective_mode == WebpageMonitor.SELECTED and not effective_selectors:
            return Response(
                {"detail": "Selected-element monitors require at least one CSS selector."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if values.get("webhook_url") and not values.get("webhook_secret") and not monitor.webhook_secret:
            values["webhook_secret"] = secrets.token_urlsafe(32)
        if "webhook_url" in values and not values["webhook_url"]:
            values["webhook_secret"] = ""
        for key, value in values.items():
            setattr(monitor, key, value)
        monitor.save()
        return Response(serialize_monitor(monitor, reveal_secret="webhook_secret" in values))

    def delete(self, request, public_id):
        monitor = self._get(request, public_id)
        if not monitor:
            return Response({"detail": "Monitor not found."}, status=status.HTTP_404_NOT_FOUND)
        monitor.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class WebpageMonitorRunView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, public_id):
        monitor = WebpageMonitor.objects.filter(public_id=public_id, user=request.user).first()
        if not monitor:
            return Response({"detail": "Monitor not found."}, status=status.HTTP_404_NOT_FOUND)
        queued = enqueue_monitor(monitor.id)
        detail = "Monitor check queued." if queued else "Monitor check is already running."
        return Response({"detail": detail}, status=status.HTTP_202_ACCEPTED)


class MonitorChangeListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, public_id):
        monitor = WebpageMonitor.objects.filter(public_id=public_id, user=request.user).first()
        if not monitor:
            return Response({"detail": "Monitor not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response([serialize_change(change) for change in monitor.changes.select_related("before", "after")[:50]])


class MonitorChangeDownloadView(APIView):
    def get(self, request, public_id):
        # The unguessable UUID is a download capability because browser
        # navigation cannot attach the JWT Authorization header.
        change = MonitorChange.objects.select_related("monitor", "before", "after").filter(
            public_id=public_id
        ).first()
        if not change:
            return Response({"detail": "Change not found."}, status=status.HTTP_404_NOT_FOUND)
        response = HttpResponse(json.dumps(serialize_change(change), indent=2, default=str), content_type="application/json")
        response["Content-Disposition"] = f'attachment; filename="monitor-change-{change.public_id}.json"'
        return response
