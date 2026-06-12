from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("app", "0009_webpagemonitor_minutely_and_running"),
    ]

    operations = [
        migrations.AddField(
            model_name="webpagemonitor",
            name="baseline_reset_pending",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="webpagemonitor",
            name="ignore_case",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="webpagemonitor",
            name="ignore_numbers",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="webpagemonitor",
            name="ignore_patterns",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="webpagemonitor",
            name="ignore_selectors",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="webpagemonitor",
            name="ignore_whitespace",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="webpagemonitor",
            name="minimum_change_percent",
            field=models.FloatField(default=0),
        ),
    ]
