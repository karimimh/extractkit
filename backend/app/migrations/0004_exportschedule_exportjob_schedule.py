import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("app", "0003_exportjob"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="ExportSchedule",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("public_id", models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
                ("name", models.CharField(blank=True, max_length=120)),
                ("tool", models.CharField(max_length=32)),
                ("endpoint", models.CharField(max_length=64)),
                ("origin", models.URLField(blank=True)),
                ("request_data", models.JSONField(default=dict)),
                ("frequency", models.CharField(choices=[("hourly", "Hourly"), ("daily", "Daily"), ("weekly", "Weekly"), ("monthly", "Monthly")], max_length=12)),
                ("webhook_url", models.URLField(blank=True)),
                ("webhook_secret", models.CharField(blank=True, max_length=128)),
                ("is_active", models.BooleanField(default=True)),
                ("next_run_at", models.DateTimeField()),
                ("last_run_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="export_schedules", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["next_run_at"],
                "indexes": [models.Index(fields=["is_active", "next_run_at"], name="app_exports_is_acti_f7afe5_idx")],
            },
        ),
        migrations.AddField(
            model_name="exportjob",
            name="schedule",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="jobs", to="app.exportschedule"),
        ),
        migrations.AddField(
            model_name="exportjob",
            name="webhook_delivered_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="exportjob",
            name="webhook_error",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="exportjob",
            name="webhook_status",
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
    ]
