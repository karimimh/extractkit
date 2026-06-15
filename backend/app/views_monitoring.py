import json
import re
import secrets
from datetime import timedelta

from django.core.exceptions import ValidationError
from django.core.validators import URLValidator, validate_email
from django.http import HttpResponse
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import MonitorChange, MonitorNotificationDelivery, MonitorSnapshot, WebpageMonitor
from .monitoring import deliver_notification, enqueue_monitor, notify_monitor, serialize_change, serialize_notification_delivery, serialize_snapshot
from .schedules import next_run_after
from .services.change_intelligence import analyze_change, weekly_intelligence_summary

COMPARISON_RULE_FIELDS = {
    "ignore_selectors",
    "ignore_patterns",
    "ignore_whitespace",
    "ignore_case",
    "ignore_numbers",
}
BASELINE_FIELDS = COMPARISON_RULE_FIELDS | {"url", "mode", "selectors", "fields", "ai_cleanup"}


def serialize_monitor(monitor, reveal_secret=False):
    latest_change = monitor.changes.first()
    latest_snapshot = monitor.snapshots.first()
    if monitor.is_running:
        monitor_status = "checking"
    elif not monitor.is_active:
        monitor_status = "paused"
    elif monitor.last_error:
        monitor_status = "failed"
    elif not latest_snapshot or monitor.baseline_reset_pending:
        monitor_status = "baseline"
    else:
        monitor_status = "active"
    data = {
        "id": str(monitor.public_id),
        "name": monitor.name,
        "url": monitor.url,
        "mode": monitor.mode,
        "selectors": monitor.selectors,
        "fields": monitor.fields,
        "tags": monitor.tags,
        "project": monitor.project,
        "ignore_selectors": monitor.ignore_selectors,
        "ignore_patterns": monitor.ignore_patterns,
        "ignore_whitespace": monitor.ignore_whitespace,
        "ignore_case": monitor.ignore_case,
        "ignore_numbers": monitor.ignore_numbers,
        "minimum_change_percent": monitor.minimum_change_percent,
        "ai_cleanup": monitor.ai_cleanup,
        "ai_change_analysis": monitor.ai_change_analysis,
        "auto_ignore_insignificant": monitor.auto_ignore_insignificant,
        "frequency": monitor.frequency,
        "webhook_url": monitor.webhook_url,
        "webhook_configured": bool(monitor.webhook_url),
        "notify_email": monitor.notify_email,
        "notification_emails": monitor.notification_emails,
        "notification_frequency": monitor.notification_frequency,
        "notify_on_changed": monitor.notify_on_changed,
        "notify_on_unavailable": monitor.notify_on_unavailable,
        "notify_on_recovered": monitor.notify_on_recovered,
        "slack_webhook_url": monitor.slack_webhook_url,
        "discord_webhook_url": monitor.discord_webhook_url,
        "teams_webhook_url": monitor.teams_webhook_url,
        "telegram_bot_configured": bool(monitor.telegram_bot_token),
        "telegram_chat_id": monitor.telegram_chat_id,
        "is_active": monitor.is_active,
        "is_running": monitor.is_running,
        "next_run_at": monitor.next_run_at,
        "last_run_at": monitor.last_run_at,
        "last_success_at": monitor.last_success_at,
        "last_changed_at": monitor.last_changed_at,
        "last_error": monitor.last_error,
        "consecutive_failures": monitor.consecutive_failures,
        "status": monitor_status,
        "latest_snapshot": serialize_snapshot(latest_snapshot) if latest_snapshot else None,
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
    if "notification_frequency" in data:
        if data["notification_frequency"] not in dict(WebpageMonitor.NOTIFICATION_FREQUENCY_CHOICES):
            raise ValueError("Invalid notification frequency.")
        result["notification_frequency"] = data["notification_frequency"]
    if "next_run_at" in data:
        value = parse_datetime(data["next_run_at"]) if isinstance(data["next_run_at"], str) else data["next_run_at"]
        if not value:
            raise ValueError("A valid next_run_at date and time is required.")
        if timezone.is_naive(value):
            value = timezone.make_aware(value)
        result["next_run_at"] = value
    for key in ("selectors", "fields", "ignore_selectors", "ignore_patterns", "tags"):
        if key in data:
            values = data[key]
            if not isinstance(values, list) or not all(isinstance(value, str) for value in values):
                raise ValueError(f"{key} must be a list of strings.")
            result[key] = [value.strip() for value in values if value.strip()][:50]
    if "notification_emails" in data:
        values = data["notification_emails"]
        if not isinstance(values, list) or not all(isinstance(value, str) for value in values):
            raise ValueError("notification_emails must be a list of email addresses.")
        try:
            for value in values:
                validate_email(value.strip())
        except ValidationError as exc:
            raise ValueError("Notification email addresses must be valid.") from exc
        result["notification_emails"] = list(dict.fromkeys(value.strip() for value in values if value.strip()))[:20]
    if "ignore_patterns" in result:
        try:
            for pattern in result["ignore_patterns"]:
                re.compile(pattern)
        except re.error as exc:
            raise ValueError(f"Invalid ignore pattern: {exc}.") from exc
    if "minimum_change_percent" in data:
        try:
            minimum_change_percent = float(data["minimum_change_percent"])
        except (TypeError, ValueError) as exc:
            raise ValueError("Minimum change percentage must be a number.") from exc
        if not 0 <= minimum_change_percent <= 100:
            raise ValueError("Minimum change percentage must be between 0 and 100.")
        result["minimum_change_percent"] = minimum_change_percent
    if "name" in data:
        result["name"] = str(data["name"])[:120]
    if "project" in data:
        result["project"] = str(data["project"]).strip()[:120]
    for key in (
        "ai_cleanup", "ai_change_analysis", "auto_ignore_insignificant", "notify_email", "is_active", "ignore_whitespace", "ignore_case", "ignore_numbers",
        "notify_on_changed", "notify_on_unavailable", "notify_on_recovered",
    ):
        if key in data:
            result[key] = bool(data[key])
    for key in ("webhook_url", "slack_webhook_url", "discord_webhook_url", "teams_webhook_url"):
        if key not in data:
            continue
        webhook_url = str(data[key]).strip()
        if webhook_url:
            try:
                URLValidator(schemes=["http", "https"])(webhook_url)
            except ValidationError as exc:
                raise ValueError(f"{key} must be a valid HTTP or HTTPS URL.") from exc
        result[key] = webhook_url
    if "webhook_secret" in data:
        secret = str(data["webhook_secret"]).strip()
        if len(secret) > 128:
            raise ValueError("Webhook secret must be 128 characters or fewer.")
        result["webhook_secret"] = secret
    if "telegram_bot_token" in data:
        result["telegram_bot_token"] = str(data["telegram_bot_token"]).strip()[:200]
    if "telegram_chat_id" in data:
        result["telegram_chat_id"] = str(data["telegram_chat_id"]).strip()[:100]
    mode = result.get("mode", data.get("mode"))
    selectors = result.get("selectors", data.get("selectors", []))
    if mode == WebpageMonitor.SELECTED and not selectors:
        raise ValueError("Selected-element monitors require at least one CSS selector.")
    return result


class WebpageMonitorListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        monitors = WebpageMonitor.objects.filter(user=request.user).prefetch_related("changes", "snapshots")
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
        if monitor.is_running and BASELINE_FIELDS.intersection(values):
            return Response(
                {"detail": "Wait for the current check to finish before changing comparison rules."},
                status=status.HTTP_409_CONFLICT,
            )
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
        if "frequency" in values and "next_run_at" not in values:
            values["next_run_at"] = next_run_after(timezone.now(), values["frequency"])
        for key, value in values.items():
            setattr(monitor, key, value)
        if BASELINE_FIELDS.intersection(values):
            monitor.baseline_reset_pending = True
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


class WebpageMonitorDuplicateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, public_id):
        source = WebpageMonitor.objects.filter(public_id=public_id, user=request.user).first()
        if not source:
            return Response({"detail": "Monitor not found."}, status=status.HTTP_404_NOT_FOUND)
        duplicate = WebpageMonitor.objects.create(
            user=request.user,
            name=f"{source.name or 'Monitor'} copy"[:120],
            url=source.url,
            mode=source.mode,
            selectors=source.selectors,
            fields=source.fields,
            tags=source.tags,
            project=source.project,
            ignore_selectors=source.ignore_selectors,
            ignore_patterns=source.ignore_patterns,
            ignore_whitespace=source.ignore_whitespace,
            ignore_case=source.ignore_case,
            ignore_numbers=source.ignore_numbers,
            minimum_change_percent=source.minimum_change_percent,
            ai_cleanup=source.ai_cleanup,
            ai_change_analysis=source.ai_change_analysis,
            auto_ignore_insignificant=source.auto_ignore_insignificant,
            frequency=source.frequency,
            webhook_url=source.webhook_url,
            webhook_secret=secrets.token_urlsafe(32) if source.webhook_url else "",
            notify_email=source.notify_email,
            notification_emails=source.notification_emails,
            notification_frequency=source.notification_frequency,
            notify_on_changed=source.notify_on_changed,
            notify_on_unavailable=source.notify_on_unavailable,
            notify_on_recovered=source.notify_on_recovered,
            slack_webhook_url=source.slack_webhook_url,
            discord_webhook_url=source.discord_webhook_url,
            teams_webhook_url=source.teams_webhook_url,
            telegram_bot_token=source.telegram_bot_token,
            telegram_chat_id=source.telegram_chat_id,
            next_run_at=next_run_after(timezone.now(), source.frequency),
        )
        enqueue_monitor(duplicate.id)
        return Response(serialize_monitor(duplicate, reveal_secret=True), status=status.HTTP_201_CREATED)


class WebpageMonitorResetBaselineView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, public_id):
        monitor = WebpageMonitor.objects.filter(public_id=public_id, user=request.user).first()
        if not monitor:
            return Response({"detail": "Monitor not found."}, status=status.HTTP_404_NOT_FOUND)
        if monitor.is_running:
            return Response(
                {"detail": "Wait for the current check to finish before resetting the baseline."},
                status=status.HTTP_409_CONFLICT,
            )
        monitor.baseline_reset_pending = True
        monitor.save(update_fields=["baseline_reset_pending", "updated_at"])
        return Response(serialize_monitor(monitor))


class MonitorChangeListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, public_id):
        monitor = WebpageMonitor.objects.filter(public_id=public_id, user=request.user).first()
        if not monitor:
            return Response({"detail": "Monitor not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response([serialize_change(change) for change in monitor.changes.select_related("before", "after")])


class MonitorNotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, public_id):
        monitor = WebpageMonitor.objects.filter(public_id=public_id, user=request.user).first()
        if not monitor:
            return Response({"detail": "Monitor not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response([serialize_notification_delivery(delivery) for delivery in monitor.notification_deliveries.all()[:100]])


class MonitorNotificationTestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, public_id):
        monitor = WebpageMonitor.objects.select_related("user").filter(public_id=public_id, user=request.user).first()
        if not monitor:
            return Response({"detail": "Monitor not found."}, status=status.HTTP_404_NOT_FOUND)
        deliveries = notify_monitor(monitor, MonitorNotificationDelivery.TEST, force=True)
        if not deliveries:
            return Response({"detail": "Configure at least one notification destination."}, status=status.HTTP_400_BAD_REQUEST)
        return Response([serialize_notification_delivery(delivery) for delivery in deliveries], status=status.HTTP_201_CREATED)


class MonitorNotificationRetryView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, public_id):
        delivery = MonitorNotificationDelivery.objects.select_related("monitor").filter(
            public_id=public_id, monitor__user=request.user
        ).first()
        if not delivery:
            return Response({"detail": "Notification delivery not found."}, status=status.HTTP_404_NOT_FOUND)
        if delivery.status != MonitorNotificationDelivery.FAILED:
            return Response({"detail": "Only failed deliveries can be retried."}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serialize_notification_delivery(deliver_notification(delivery)))


class MonitorChangeDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, public_id):
        change = MonitorChange.objects.select_related("monitor", "before", "after").filter(
            public_id=public_id,
            monitor__user=request.user,
        ).first()
        if not change:
            return Response({"detail": "Change not found."}, status=status.HTTP_404_NOT_FOUND)
        change_status = request.data.get("status")
        if change_status not in dict(MonitorChange.STATUS_CHOICES):
            return Response(
                {"detail": "Status must be pending, reviewed, or ignored."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        change.status = change_status
        change.save(update_fields=["status"])
        return Response(serialize_change(change))


class MonitorChangeAnalyzeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, public_id):
        change = MonitorChange.objects.select_related("monitor", "before", "after").filter(
            public_id=public_id, monitor__user=request.user
        ).first()
        if not change:
            return Response({"detail": "Change not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(serialize_change(analyze_change(change)))


class MonitorIntelligenceSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        since = timezone.now() - timedelta(days=7)
        changes = MonitorChange.objects.select_related("monitor").filter(
            monitor__user=request.user,
            created_at__gte=since,
        )
        return Response(weekly_intelligence_summary(changes))


class MonitorSnapshotListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, public_id):
        monitor = WebpageMonitor.objects.filter(public_id=public_id, user=request.user).first()
        if not monitor:
            return Response({"detail": "Monitor not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response([serialize_snapshot(snapshot) for snapshot in monitor.snapshots.all()])


class MonitorSnapshotRestoreView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, public_id, snapshot_id):
        monitor = WebpageMonitor.objects.filter(public_id=public_id, user=request.user).first()
        if not monitor:
            return Response({"detail": "Monitor not found."}, status=status.HTTP_404_NOT_FOUND)
        if monitor.is_running:
            return Response(
                {"detail": "Wait for the current check to finish before restoring a baseline."},
                status=status.HTTP_409_CONFLICT,
            )
        snapshot = MonitorSnapshot.objects.filter(pk=snapshot_id, monitor=monitor).first()
        if not snapshot:
            return Response({"detail": "Snapshot not found."}, status=status.HTTP_404_NOT_FOUND)
        restored = MonitorSnapshot.objects.create(
            monitor=monitor,
            title=snapshot.title,
            content_hash=snapshot.content_hash,
            data=snapshot.data,
            image_path=snapshot.image_path,
        )
        return Response(serialize_snapshot(restored), status=status.HTTP_201_CREATED)


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
