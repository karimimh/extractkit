from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("app", "0008_rename_wallet_fields"),
    ]

    operations = [
        migrations.AlterField(
            model_name="webpagemonitor",
            name="frequency",
            field=models.CharField(
                choices=[
                    ("minutely", "Every minute"),
                    ("hourly", "Hourly"),
                    ("daily", "Daily"),
                    ("weekly", "Weekly"),
                    ("monthly", "Monthly"),
                ],
                max_length=12,
            ),
        ),
        migrations.AddField(
            model_name="webpagemonitor",
            name="is_running",
            field=models.BooleanField(default=False),
        ),
    ]
