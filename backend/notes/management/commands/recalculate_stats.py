from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from notes.models import UserStorageStats


class Command(BaseCommand):
    help = 'Recalculate storage statistics for all users or a specific user'

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            type=str,
            help='Username of a specific user to recalculate stats for',
        )

    def handle(self, *args, **options):
        username = options.get('username')

        if username:
            try:
                user = User.objects.get(username=username)
                users = [user]
                self.stdout.write(
                    f'Recalculating statistics for user: {username}')
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'User "{username}" not found'))
                return
        else:
            users = User.objects.all()
            self.stdout.write(
                f'Recalculating statistics for all {users.count()} users...')

        success_count = 0
        error_count = 0

        for user in users:
            try:
                stats, created = UserStorageStats.objects.get_or_create(
                    user=user)
                result = stats.recalculate_stats()

                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ {user.username}: {result["note_count"]} notes, '
                        f'{result["label_count"]} labels, '
                        f'{result["storage_used_mb"]} MB'))
                success_count += 1
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'✗ {user.username}: {str(e)}'))
                error_count += 1

        self.stdout.write('')
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully processed {success_count} user(s)'))
        if error_count > 0:
            self.stdout.write(
                self.style.WARNING(f'Failed to process {error_count} user(s)'))
