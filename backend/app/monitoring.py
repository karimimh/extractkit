import difflib
import hashlib
import hmac
import json
import logging
import re
from datetime import timedelta
from html import escape
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from uuid import uuid4

import requests
from bs4 import BeautifulSoup
from django.conf import settings
from django.core.mail import send_mail
from django.db import close_old_connections, transaction
from django.db.models import F
from django.utils import timezone
from PIL import Image, ImageChops

from .models import MonitorChange, MonitorNotificationDelivery, MonitorSnapshot, WebpageMonitor
from .schedules import next_run_after
from .services.cleaner import apply_ai_cleanup_to_soup
from .services.change_intelligence import analyze_change
from .services.extractor import extract_main_content
from .services.screenshot_generator import generate_screenshot_from_url
from .services.structured_json_generator import html_to_structured_json

logger = logging.getLogger("app.monitoring")
executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="webpage-monitor")


def _normalized_text(soup):
    for tag in soup.find_all(["script", "style", "noscript", "iframe", "svg"]):
        tag.decompose()
    return "\n".join(line.strip() for line in soup.get_text("\n").splitlines() if line.strip())


def _remove_ignored_selectors(soup, selectors):
    for selector in selectors:
        for element in soup.select(selector):
            element.decompose()


def _normalize_string(value, monitor):
    for pattern in monitor.ignore_patterns:
        value = re.sub(pattern, "", value)
    if monitor.ignore_numbers:
        value = re.sub(r"[-+]?\d+(?:[.,]\d+)?", "<number>", value)
    if monitor.ignore_whitespace:
        value = " ".join(value.split())
    if monitor.ignore_case:
        value = value.casefold()
    return value


def _normalize_data(value, monitor):
    if isinstance(value, dict):
        return {key: _normalize_data(item, monitor) for key, item in value.items()}
    if isinstance(value, list):
        return [_normalize_data(item, monitor) for item in value]
    if isinstance(value, str):
        return _normalize_string(value, monitor)
    if monitor.ignore_numbers and isinstance(value, (int, float)) and not isinstance(value, bool):
        return "<number>"
    return value


def _field_value(data, path):
    value = data
    for part in path.split("."):
        if isinstance(value, dict):
            value = value.get(part)
        elif isinstance(value, list) and part.isdigit() and int(part) < len(value):
            value = value[int(part)]
        else:
            return None
    return value


def _capture(monitor):
    if monitor.mode == WebpageMonitor.VISUAL:
        generated = generate_screenshot_from_url(
            monitor.url,
            selectors=[*monitor.selectors, *monitor.ignore_selectors],
            ai_cleanup=monitor.ai_cleanup,
        )
        image_path = generated.relative_path
        image = Image.open(Path(settings.MEDIA_ROOT) / image_path).convert("RGB")
        digest = hashlib.sha256(
            f"{image.width}x{image.height}:".encode() + image.tobytes()
        ).hexdigest()
        return generated.title, {"image": image_path}, image_path, digest

    extracted = extract_main_content(monitor.url)
    if monitor.mode == WebpageMonitor.STRUCTURED:
        generated = html_to_structured_json(
            extracted.html,
            extracted.title,
            source_url=monitor.url,
            selectors=monitor.ignore_selectors,
            ai_cleanup=monitor.ai_cleanup,
        )
        data = generated.data
        if monitor.fields:
            data = {field: _field_value(data, field) for field in monitor.fields}
    else:
        soup = BeautifulSoup(extracted.html, "html.parser")
        if monitor.ai_cleanup:
            apply_ai_cleanup_to_soup(soup)
        _remove_ignored_selectors(soup, monitor.ignore_selectors)
        if monitor.mode == WebpageMonitor.SELECTED:
            data = {
                selector: [_normalized_text(element) for element in soup.select(selector)]
                for selector in monitor.selectors
            }
        else:
            data = {"text": _normalized_text(soup)}

    data = _normalize_data(data, monitor)
    serialized = json.dumps(data, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return extracted.title, data, "", hashlib.sha256(serialized.encode()).hexdigest()


def _text_comparison(before, after):
    old = json.dumps(before.data, indent=2, sort_keys=True, ensure_ascii=False).splitlines()
    new = json.dumps(after.data, indent=2, sort_keys=True, ensure_ascii=False).splitlines()
    diff = "\n".join(difflib.unified_diff(old, new, fromfile="before", tofile="after", lineterm=""))
    ratio = difflib.SequenceMatcher(None, "\n".join(old), "\n".join(new)).ratio()
    percent = round((1 - ratio) * 100, 2)
    return f"Content changed by {percent:.2f}%.", diff, percent, ""


def _visual_comparison(before, after):
    before_image = Image.open(Path(settings.MEDIA_ROOT) / before.image_path).convert("RGB")
    after_image = Image.open(Path(settings.MEDIA_ROOT) / after.image_path).convert("RGB")
    width = max(before_image.width, after_image.width)
    height = max(before_image.height, after_image.height)
    old = Image.new("RGB", (width, height), "white")
    new = Image.new("RGB", (width, height), "white")
    old.paste(before_image, (0, 0))
    new.paste(after_image, (0, 0))
    diff_image = ImageChops.difference(old, new)
    mask = diff_image.convert("L").point(lambda pixel: 255 if pixel else 0)
    changed_pixels = sum(1 for pixel in mask.getdata() if pixel)
    percent = round(changed_pixels / (width * height) * 100, 2)
    relative_path = f"exports/monitor-diff-{uuid4().hex}.png"
    output = Path(settings.MEDIA_ROOT) / relative_path
    output.parent.mkdir(parents=True, exist_ok=True)
    highlighted = Image.blend(new, Image.new("RGB", new.size, "white"), 0.35)
    highlighted.paste(Image.new("RGB", new.size, "#ef4444"), mask=mask)
    highlighted.save(output)
    return f"Visual capture changed by {percent:.2f}%.", "", percent, relative_path


def serialize_change(change):
    return {
        "id": str(change.public_id),
        "monitor_id": str(change.monitor.public_id),
        "mode": change.monitor.mode,
        "summary": change.summary,
        "changed_percent": change.changed_percent,
        "status": change.status,
        "ai_summary": change.ai_summary,
        "ai_importance": change.ai_importance,
        "ai_categories": change.ai_categories,
        "ai_why_it_matters": change.ai_why_it_matters,
        "ai_insignificant": change.ai_insignificant,
        "ai_analysis_source": change.ai_analysis_source,
        "ai_analyzed_at": change.ai_analyzed_at,
        "diff": change.diff,
        "before": change.before.data,
        "after": change.after.data,
        "before_image_url": f"{settings.MEDIA_URL}{change.before.image_path}" if change.before.image_path else None,
        "after_image_url": f"{settings.MEDIA_URL}{change.after.image_path}" if change.after.image_path else None,
        "diff_image_url": f"{settings.MEDIA_URL}{change.diff_image_path}" if change.diff_image_path else None,
        "created_at": change.created_at,
    }


def serialize_snapshot(snapshot):
    return {
        "id": snapshot.id,
        "title": snapshot.title,
        "data": snapshot.data,
        "image_url": f"{settings.MEDIA_URL}{snapshot.image_path}" if snapshot.image_path else None,
        "created_at": snapshot.created_at,
    }


def _notification_message(monitor, event, change=None, error="", changes=None):
    name = monitor.name or monitor.url
    if event == MonitorNotificationDelivery.CHANGED and change:
        return f"ExtractKit detected a change in {name}: {change.ai_summary or change.summary}"
    if event == MonitorNotificationDelivery.UNAVAILABLE:
        return f"ExtractKit could not check {name}: {error or monitor.last_error}"
    if event == MonitorNotificationDelivery.RECOVERED:
        return f"ExtractKit can reach {name} again after previous failed checks."
    if event == MonitorNotificationDelivery.DIGEST:
        return f"ExtractKit digest for {name}: {len(changes or [])} change(s) detected."
    return f"ExtractKit test notification for {name}. Notification delivery is configured correctly."


def _notification_payload(monitor, event, message, change=None, changes=None):
    event_name = f"monitor.{event}"
    payload = {
        "event": event_name,
        "monitor": str(monitor.public_id),
        "text": message,
        "content": message,
    }
    if change:
        payload["change"] = serialize_change(change)
    if changes:
        payload["changes"] = [serialize_change(item) for item in changes]
    return payload


def _notification_destinations(monitor):
    destinations = []
    email_addresses = monitor.notification_emails or ([monitor.user.email] if monitor.notify_email and monitor.user.email else [])
    destinations.extend((MonitorNotificationDelivery.EMAIL, address) for address in email_addresses)
    for channel, destination in (
        (MonitorNotificationDelivery.WEBHOOK, monitor.webhook_url),
        (MonitorNotificationDelivery.SLACK, monitor.slack_webhook_url),
        (MonitorNotificationDelivery.DISCORD, monitor.discord_webhook_url),
        (MonitorNotificationDelivery.TEAMS, monitor.teams_webhook_url),
    ):
        if destination:
            destinations.append((channel, destination))
    if monitor.telegram_bot_token and monitor.telegram_chat_id:
        destinations.append((MonitorNotificationDelivery.TELEGRAM, monitor.telegram_chat_id))
    return destinations


def serialize_notification_delivery(delivery):
    return {
        "id": str(delivery.public_id),
        "event": delivery.event,
        "channel": delivery.channel,
        "destination": delivery.destination,
        "status": delivery.status,
        "attempts": delivery.attempts,
        "response_status": delivery.response_status,
        "error": delivery.error,
        "delivered_at": delivery.delivered_at,
        "created_at": delivery.created_at,
    }


def deliver_notification(delivery):
    monitor = delivery.monitor
    payload = delivery.payload
    message = payload.get("text", "")
    delivery.attempts += 1
    delivery.response_status = None
    delivery.error = ""
    try:
        if delivery.channel == MonitorNotificationDelivery.EMAIL:
            diff = payload.get("change", {}).get("diff", "")
            why = payload.get("change", {}).get("ai_why_it_matters", "")
            html = (
                f"<h2>{escape(message)}</h2><p><a href=\"{escape(monitor.url)}\">Open monitored page</a></p>"
                + (f"<h3>Difference</h3><pre>{escape(diff)}</pre>" if diff else "")
                + (f"<h3>Why this matters</h3><p>{escape(why)}</p>" if why else "")
            )
            send_mail(
                f"ExtractKit monitor {delivery.event}: {monitor.name or monitor.url}",
                f"{message}\n\n{monitor.url}\n\n{diff}",
                None,
                [delivery.destination],
                html_message=html,
            )
        else:
            url = delivery.destination
            body_payload = payload
            if delivery.channel == MonitorNotificationDelivery.TELEGRAM:
                url = f"https://api.telegram.org/bot{monitor.telegram_bot_token}/sendMessage"
                body_payload = {"chat_id": monitor.telegram_chat_id, "text": message}
            elif delivery.channel == MonitorNotificationDelivery.SLACK:
                body_payload = {"text": message, "blocks": [{"type": "section", "text": {"type": "mrkdwn", "text": message}}]}
            elif delivery.channel == MonitorNotificationDelivery.DISCORD:
                body_payload = {"content": message, "embeds": [{"title": monitor.name or monitor.url, "description": message, "url": monitor.url}]}
            elif delivery.channel == MonitorNotificationDelivery.TEAMS:
                body_payload = {"type": "message", "attachments": [{"contentType": "application/vnd.microsoft.card.adaptive", "content": {"type": "AdaptiveCard", "version": "1.4", "body": [{"type": "TextBlock", "weight": "Bolder", "text": monitor.name or monitor.url}, {"type": "TextBlock", "wrap": True, "text": message}]}}]}
            body = json.dumps(body_payload, default=str, separators=(",", ":")).encode()
            headers = {"Content-Type": "application/json", "X-ExtractKit-Event": payload.get("event", "")}
            if delivery.channel == MonitorNotificationDelivery.WEBHOOK and monitor.webhook_secret:
                headers["X-ExtractKit-Signature"] = "sha256=" + hmac.new(
                    monitor.webhook_secret.encode(), body, hashlib.sha256
                ).hexdigest()
            response = requests.post(url, data=body, headers=headers, timeout=10)
            delivery.response_status = response.status_code
            response.raise_for_status()
        delivery.status = MonitorNotificationDelivery.DELIVERED
        delivery.delivered_at = timezone.now()
    except Exception as exc:
        delivery.status = MonitorNotificationDelivery.FAILED
        delivery.error = str(exc)[:2000]
    delivery.save(update_fields=["attempts", "response_status", "error", "status", "delivered_at", "updated_at"])
    return delivery


def notify_monitor(monitor, event, change=None, error="", changes=None, force=False):
    enabled = {
        MonitorNotificationDelivery.CHANGED: monitor.notify_on_changed,
        MonitorNotificationDelivery.UNAVAILABLE: monitor.notify_on_unavailable,
        MonitorNotificationDelivery.RECOVERED: monitor.notify_on_recovered,
    }.get(event, True)
    if not force and not enabled:
        return []
    if not force and event == MonitorNotificationDelivery.CHANGED and monitor.notification_frequency != WebpageMonitor.IMMEDIATE:
        return []
    message = _notification_message(monitor, event, change=change, error=error, changes=changes)
    payload = json.loads(json.dumps(
        _notification_payload(monitor, event, message, change=change, changes=changes),
        default=str,
    ))
    deliveries = []
    for channel, destination in _notification_destinations(monitor):
        delivery = MonitorNotificationDelivery.objects.create(
            monitor=monitor,
            change=change,
            event=event,
            channel=channel,
            destination=destination,
            payload=payload,
        )
        deliveries.append(deliver_notification(delivery))
    if change:
        failed = [delivery.error for delivery in deliveries if delivery.status == MonitorNotificationDelivery.FAILED]
        webhook = next((delivery for delivery in deliveries if delivery.channel == MonitorNotificationDelivery.WEBHOOK), None)
        change.webhook_status = webhook.response_status if webhook else None
        change.notification_error = "\n".join(failed)[:2000]
        change.save(update_fields=["webhook_status", "notification_error"])
    return deliveries


def _notify(change):
    return _safe_notify_monitor(change.monitor, MonitorNotificationDelivery.CHANGED, change=change)


def _safe_notify_monitor(monitor, event, **kwargs):
    try:
        return notify_monitor(monitor, event, **kwargs)
    except Exception:
        logger.exception("Notification delivery setup failed for monitor %s", monitor.id)
        return []


def run_due_monitor_digests(now=None):
    now = now or timezone.now()
    delivered = 0
    monitors = WebpageMonitor.objects.select_related("user").exclude(notification_frequency=WebpageMonitor.IMMEDIATE)
    for monitor in monitors:
        interval = timedelta(days=1 if monitor.notification_frequency == WebpageMonitor.DAILY_DIGEST else 7)
        since = monitor.last_digest_at or monitor.created_at
        if since + interval > now:
            continue
        changes = list(monitor.changes.filter(created_at__gt=since).select_related("before", "after"))
        if changes and monitor.notify_on_changed:
            delivered += len(_safe_notify_monitor(monitor, MonitorNotificationDelivery.DIGEST, changes=changes, force=True))
        monitor.last_digest_at = now
        monitor.save(update_fields=["last_digest_at", "updated_at"])
    return delivered


def run_monitor(monitor_id):
    close_old_connections()
    try:
        monitor = WebpageMonitor.objects.select_related("user").get(pk=monitor_id)
        previous_failures = monitor.consecutive_failures
        monitor.is_running = True
        monitor.save(update_fields=["is_running", "updated_at"])
        title, data, image_path, content_hash = _capture(monitor)
        previous = None if monitor.baseline_reset_pending else monitor.snapshots.first()
        snapshot = MonitorSnapshot.objects.create(
            monitor=monitor,
            title=title,
            data=data,
            image_path=image_path,
            content_hash=content_hash,
        )
        monitor.last_error = ""
        monitor.consecutive_failures = 0
        monitor.last_success_at = timezone.now()
        monitor.baseline_reset_pending = False
        if previous_failures:
            _safe_notify_monitor(monitor, MonitorNotificationDelivery.RECOVERED)
        if previous and previous.content_hash != snapshot.content_hash:
            if monitor.mode == WebpageMonitor.VISUAL:
                summary, diff, percent, diff_image = _visual_comparison(previous, snapshot)
            else:
                summary, diff, percent, diff_image = _text_comparison(previous, snapshot)
            if percent >= monitor.minimum_change_percent:
                change = MonitorChange.objects.create(
                    monitor=monitor,
                    before=previous,
                    after=snapshot,
                    summary=summary,
                    diff=diff,
                    changed_percent=percent,
                    diff_image_path=diff_image,
                )
                if monitor.ai_change_analysis:
                    analyze_change(change)
                monitor.last_changed_at = timezone.now()
                if change.status != MonitorChange.IGNORED:
                    _notify(change)
            elif diff_image:
                (Path(settings.MEDIA_ROOT) / diff_image).unlink(missing_ok=True)
        monitor.save(update_fields=[
            "last_error",
            "last_success_at",
            "last_changed_at",
            "consecutive_failures",
            "baseline_reset_pending",
            "updated_at",
        ])
    except Exception as exc:
        logger.exception("Webpage monitor %s failed", monitor_id)
        monitor = WebpageMonitor.objects.select_related("user").filter(pk=monitor_id).first()
        if monitor and monitor.consecutive_failures == 0:
            _safe_notify_monitor(monitor, MonitorNotificationDelivery.UNAVAILABLE, error=str(exc))
        WebpageMonitor.objects.filter(pk=monitor_id).update(
            last_error=str(exc)[:2000],
            consecutive_failures=F("consecutive_failures") + 1,
        )
    finally:
        WebpageMonitor.objects.filter(pk=monitor_id).update(
            is_running=False,
            last_run_at=timezone.now(),
        )
        close_old_connections()


def enqueue_monitor(monitor_id):
    claimed = WebpageMonitor.objects.filter(pk=monitor_id, is_running=False).update(is_running=True)
    if not claimed:
        return False
    try:
        executor.submit(run_monitor, monitor_id)
    except Exception:
        WebpageMonitor.objects.filter(pk=monitor_id).update(is_running=False)
        raise
    return True


def run_due_monitors(now=None):
    now = now or timezone.now()
    monitor_ids = []
    with transaction.atomic():
        monitors = list(
            WebpageMonitor.objects.select_for_update().filter(is_active=True, next_run_at__lte=now)
        )
        for monitor in monitors:
            monitor.next_run_at = next_run_after(now, monitor.frequency)
            monitor.save(update_fields=["next_run_at", "updated_at"])
            monitor_ids.append(monitor.id)
    for monitor_id in monitor_ids:
        enqueue_monitor(monitor_id)
    return len(monitor_ids)
