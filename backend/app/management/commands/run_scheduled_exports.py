import time

from django.conf import settings
from django.core.management.base import BaseCommand

from app.schedules import run_due_schedules
from app.monitoring import run_due_monitor_digests, run_due_monitors


class Command(BaseCommand):
    help = "Queue due export schedules and webpage monitors."

    def add_arguments(self, parser):
        parser.add_argument("--loop", action="store_true", help="Keep polling for due schedules.")
        parser.add_argument("--interval", type=int, default=60, help="Polling interval in seconds.")

    def handle(self, *args, **options):
        while True:
            export_count = run_due_schedules()
            monitor_count = run_due_monitors() if settings.CHANGE_MONITORING_ENABLED else 0
            digest_count = run_due_monitor_digests() if settings.CHANGE_MONITORING_ENABLED else 0
            if export_count or monitor_count or digest_count:
                self.stdout.write(self.style.SUCCESS(
                    f"Queued {export_count} scheduled export(s), {monitor_count} webpage monitor(s), "
                    f"and delivered {digest_count} digest notification(s)."
                ))
            if not options["loop"]:
                return
            time.sleep(max(1, options["interval"]))
