from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("app", "0010_webpagemonitor_noise_controls"),
    ]

    operations = [
        migrations.AddField(
            model_name="webpagemonitor",
            name="consecutive_failures",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="webpagemonitor",
            name="last_success_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="webpagemonitor",
            name="project",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name="webpagemonitor",
            name="tags",
            field=models.JSONField(blank=True, default=list),
        ),
    ]
