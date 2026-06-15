from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("app", "0011_webpagemonitor_management_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="monitorchange",
            name="status",
            field=models.CharField(
                choices=[
                    ("pending", "Pending review"),
                    ("reviewed", "Reviewed"),
                    ("ignored", "Ignored"),
                ],
                default="pending",
                max_length=12,
            ),
        ),
    ]
