from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("app", "0007_developer_api_and_integrations"),
    ]

    operations = [
        migrations.RenameField(
            model_name="userprofile",
            old_name="download_credits",
            new_name="balance_cents",
        ),
        migrations.RenameField(
            model_name="cryptopayment",
            old_name="download_credits",
            new_name="balance_cents",
        ),
    ]
