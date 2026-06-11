import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("app", "0006_wallet_cents"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="DeveloperAPIKey",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("public_id", models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
                ("name", models.CharField(max_length=120)),
                ("prefix", models.CharField(max_length=20, unique=True)),
                ("key_hash", models.CharField(max_length=64, unique=True)),
                ("last_used_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("revoked_at", models.DateTimeField(blank=True, null=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="developer_api_keys", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.AddField(
            model_name="exportjob",
            name="api_key",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="jobs", to="app.developerapikey"),
        ),
        migrations.AddField(
            model_name="exportjob",
            name="idempotency_key",
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name="exportjob",
            name="webhook_secret",
            field=models.CharField(blank=True, max_length=128),
        ),
        migrations.AddField(
            model_name="exportjob",
            name="webhook_url",
            field=models.URLField(blank=True),
        ),
        migrations.AddConstraint(
            model_name="exportjob",
            constraint=models.UniqueConstraint(condition=models.Q(("idempotency_key", ""), _negated=True), fields=("user", "idempotency_key"), name="unique_user_export_idempotency_key"),
        ),
    ]
