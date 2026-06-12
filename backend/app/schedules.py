import calendar
from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from .jobs import enqueue
from .models import ExportJob, ExportSchedule


def next_run_after(current, frequency):
    if frequency == "minutely":
        return current + timedelta(minutes=1)
    if frequency == ExportSchedule.HOURLY:
        return current + timedelta(hours=1)
    if frequency == ExportSchedule.DAILY:
        return current + timedelta(days=1)
    if frequency == ExportSchedule.WEEKLY:
        return current + timedelta(days=7)
    if frequency == ExportSchedule.MONTHLY:
        year = current.year + (1 if current.month == 12 else 0)
        month = 1 if current.month == 12 else current.month + 1
        day = min(current.day, calendar.monthrange(year, month)[1])
        return current.replace(year=year, month=month, day=day)
    raise ValueError(f"Unsupported schedule frequency: {frequency}")


def run_due_schedules(now=None):
    now = now or timezone.now()
    job_ids = []
    with transaction.atomic():
        schedules = list(
            ExportSchedule.objects.select_for_update()
            .select_related("user")
            .filter(is_active=True, next_run_at__lte=now)
        )
        for schedule in schedules:
            job = ExportJob.objects.create(
                user=schedule.user,
                schedule=schedule,
                tool=schedule.tool,
                endpoint=schedule.endpoint,
                origin=schedule.origin,
                request_data=schedule.request_data,
            )
            schedule.last_run_at = now
            next_run_at = next_run_after(schedule.next_run_at, schedule.frequency)
            while next_run_at <= now:
                next_run_at = next_run_after(next_run_at, schedule.frequency)
            schedule.next_run_at = next_run_at
            schedule.save(update_fields=["last_run_at", "next_run_at", "updated_at"])
            job_ids.append(job.id)

    for job_id in job_ids:
        enqueue(job_id)
    return len(job_ids)
