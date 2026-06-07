from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from notes.models import Note

User = get_user_model()


class Command(BaseCommand):
    help = 'Fix note order values for all users'

    def handle(self, *args, **options):
        users = User.objects.all()
        total_fixed = 0

        for user in users:
            notes = Note.objects.filter(user=user).order_by('id')
            for index, note in enumerate(notes, start=1):
                if note.order == 0 or note.order != index:
                    note.order = index
                    note.save(update_fields=['order'])
                    total_fixed += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully fixed {total_fixed} notes across {users.count()} users'
            ))
