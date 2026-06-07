from django.core.management.base import BaseCommand
from notes.models import Note, NoteImage
import re
import os


class Command(BaseCommand):
    help = 'Delete NoteImage objects that are not referenced in markdown notes or attached to text notes'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting anything'
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']

        deleted_count = 0
        checked_count = 0

        # Get all NoteImage objects
        note_images = NoteImage.objects.select_related('note').all()

        for note_image in note_images:
            checked_count += 1
            note = note_image.note
            should_delete = False
            reason = ''

            # Text notes should not have any images
            if note.content_type == 'text':
                should_delete = True
                reason = 'text note should not have images'
            # For markdown notes, check if image is referenced
            elif note.content_type == 'markdown':
                # Extract the image filename/path from the image field
                image_path = note_image.image.name  # Full path like 'note_images/1/uuid.jpg'
                image_url = note_image.image.url  # URL like '/media/note_images/1/uuid.jpg'
                image_filename = os.path.basename(image_path)

                # Check if the image is referenced in the note content
                # Markdown image syntax: ![alt text](image_url) or ![alt text](image_path)
                # We'll check for various possible references
                is_referenced = (image_path in note.content
                                 or image_url in note.content
                                 or image_filename in note.content)

                if not is_referenced:
                    should_delete = True
                    reason = 'not referenced in markdown content'

            if should_delete:
                image_path = note_image.image.name
                note_title = note.title or f'Note {note.id}'

                if dry_run:
                    self.stdout.write(
                        self.style.WARNING(
                            f'Would delete: {note_image} (image: {image_path}) '
                            f'from note "{note_title}" - {reason}'))
                else:
                    self.stdout.write(
                        f'Deleting: {note_image} (image: {image_path}) '
                        f'from note "{note_title}" - {reason}')
                    # Delete the image file and database record
                    note_image.delete()

                deleted_count += 1

        # Summary message
        if dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    f'\nDRY RUN: Checked {checked_count} note images. '
                    f'Would delete {deleted_count} unused images.'))
        else:
            self.stdout.write(
                self.style.SUCCESS(f'\nChecked {checked_count} note images. '
                                   f'Deleted {deleted_count} unused images.'))
