import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("app", "0004_exportschedule_exportjob_schedule"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="WebpageMonitor",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("public_id", models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
                ("name", models.CharField(blank=True, max_length=120)),
                ("url", models.URLField()),
                ("mode", models.CharField(choices=[("text", "Cleaned text"), ("selected", "Selected elements"), ("structured", "Structured JSON fields"), ("visual", "Visual screenshot")], default="text", max_length=12)),
                ("selectors", models.JSONField(blank=True, default=list)),
                ("fields", models.JSONField(blank=True, default=list)),
                ("ai_cleanup", models.BooleanField(default=False)),
                ("frequency", models.CharField(choices=[("hourly", "Hourly"), ("daily", "Daily"), ("weekly", "Weekly"), ("monthly", "Monthly")], max_length=12)),
                ("webhook_url", models.URLField(blank=True)),
                ("webhook_secret", models.CharField(blank=True, max_length=128)),
                ("notify_email", models.BooleanField(default=False)),
                ("is_active", models.BooleanField(default=True)),
                ("next_run_at", models.DateTimeField()),
                ("last_run_at", models.DateTimeField(blank=True, null=True)),
                ("last_changed_at", models.DateTimeField(blank=True, null=True)),
                ("last_error", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="webpage_monitors", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["next_run_at"],
                "indexes": [models.Index(fields=["is_active", "next_run_at"], name="app_monitor_is_acti_next_idx")],
            },
        ),
        migrations.CreateModel(
            name="MonitorSnapshot",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(blank=True, max_length=300)),
                ("content_hash", models.CharField(max_length=64)),
                ("data", models.JSONField(default=dict)),
                ("image_path", models.CharField(blank=True, max_length=500)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("monitor", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="snapshots", to="app.webpagemonitor")),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="MonitorChange",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("public_id", models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
                ("summary", models.TextField()),
                ("diff", models.TextField(blank=True)),
                ("changed_percent", models.FloatField(default=0)),
                ("diff_image_path", models.CharField(blank=True, max_length=500)),
                ("webhook_status", models.PositiveSmallIntegerField(blank=True, null=True)),
                ("notification_error", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("after", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="+", to="app.monitorsnapshot")),
                ("before", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="+", to="app.monitorsnapshot")),
                ("monitor", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="changes", to="app.webpagemonitor")),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
