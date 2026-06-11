import time

from django.core.management.base import BaseCommand

from app.schedules import run_due_schedules


class Command(BaseCommand):
    help = "Create export jobs for due schedules."

    def add_arguments(self, parser):
        parser.add_argument("--loop", action="store_true", help="Keep polling for due schedules.")
        parser.add_argument("--interval", type=int, default=60, help="Polling interval in seconds.")

    def handle(self, *args, **options):
        while True:
            count = run_due_schedules()
            if count:
                self.stdout.write(self.style.SUCCESS(f"Queued {count} scheduled export(s)."))
            if not options["loop"]:
                return
            time.sleep(max(1, options["interval"]))
