import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("app", "0012_monitorchange_status"),
    ]

    operations = [
        migrations.AddField(model_name="webpagemonitor", name="discord_webhook_url", field=models.URLField(blank=True)),
        migrations.AddField(model_name="webpagemonitor", name="last_digest_at", field=models.DateTimeField(blank=True, null=True)),
        migrations.AddField(model_name="webpagemonitor", name="notification_emails", field=models.JSONField(blank=True, default=list)),
        migrations.AddField(model_name="webpagemonitor", name="notification_frequency", field=models.CharField(choices=[("immediate", "Immediately"), ("daily", "Daily digest"), ("weekly", "Weekly digest")], default="immediate", max_length=12)),
        migrations.AddField(model_name="webpagemonitor", name="notify_on_changed", field=models.BooleanField(default=True)),
        migrations.AddField(model_name="webpagemonitor", name="notify_on_recovered", field=models.BooleanField(default=True)),
        migrations.AddField(model_name="webpagemonitor", name="notify_on_unavailable", field=models.BooleanField(default=True)),
        migrations.AddField(model_name="webpagemonitor", name="slack_webhook_url", field=models.URLField(blank=True)),
        migrations.AddField(model_name="webpagemonitor", name="teams_webhook_url", field=models.URLField(blank=True)),
        migrations.AddField(model_name="webpagemonitor", name="telegram_bot_token", field=models.CharField(blank=True, max_length=200)),
        migrations.AddField(model_name="webpagemonitor", name="telegram_chat_id", field=models.CharField(blank=True, max_length=100)),
        migrations.CreateModel(
            name="MonitorNotificationDelivery",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("public_id", models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
                ("event", models.CharField(choices=[("changed", "Changed"), ("unavailable", "Unavailable"), ("recovered", "Recovered"), ("test", "Test"), ("digest", "Digest")], max_length=16)),
                ("channel", models.CharField(choices=[("email", "Email"), ("webhook", "Webhook"), ("slack", "Slack"), ("discord", "Discord"), ("teams", "Microsoft Teams"), ("telegram", "Telegram")], max_length=12)),
                ("destination", models.CharField(max_length=500)),
                ("status", models.CharField(choices=[("pending", "Pending"), ("delivered", "Delivered"), ("failed", "Failed")], default="pending", max_length=12)),
                ("attempts", models.PositiveSmallIntegerField(default=0)),
                ("response_status", models.PositiveSmallIntegerField(blank=True, null=True)),
                ("error", models.TextField(blank=True)),
                ("payload", models.JSONField(blank=True, default=dict)),
                ("delivered_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("change", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="notification_deliveries", to="app.monitorchange")),
                ("monitor", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="notification_deliveries", to="app.webpagemonitor")),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
