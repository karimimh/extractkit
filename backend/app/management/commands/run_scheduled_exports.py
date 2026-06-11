import time

from django.core.management.base import BaseCommand

from app.schedules import run_due_schedules
from app.monitoring import run_due_monitors


class Command(BaseCommand):
    help = "Create export jobs for due schedules."

    def add_arguments(self, parser):
        parser.add_argument("--loop", action="store_true", help="Keep polling for due schedules.")
        parser.add_argument("--interval", type=int, default=60, help="Polling interval in seconds.")

    def handle(self, *args, **options):
        while True:
            export_count = run_due_schedules()
            monitor_count = run_due_monitors()
            if export_count or monitor_count:
                self.stdout.write(self.style.SUCCESS(
                    f"Queued {export_count} scheduled export(s) and {monitor_count} webpage monitor(s)."
                ))
            if not options["loop"]:
                return
            time.sleep(max(1, options["interval"]))
