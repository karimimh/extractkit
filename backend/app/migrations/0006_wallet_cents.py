from django.db import migrations


CENTS_PER_LEGACY_CREDIT = 20


def convert_legacy_credits_to_wallet_cents(apps, schema_editor):
    UserProfile = apps.get_model("app", "UserProfile")
    CryptoPayment = apps.get_model("app", "CryptoPayment")
    CreditTransaction = apps.get_model("app", "CreditTransaction")

    for profile in UserProfile.objects.all().only("id", "download_credits"):
        profile.download_credits = profile.download_credits * CENTS_PER_LEGACY_CREDIT
        profile.save(update_fields=["download_credits"])

    for payment in CryptoPayment.objects.all().only("id", "download_credits"):
        payment.download_credits = payment.download_credits * CENTS_PER_LEGACY_CREDIT
        payment.save(update_fields=["download_credits"])

    for transaction in CreditTransaction.objects.all().only("id", "amount", "balance_after"):
        transaction.amount = transaction.amount * CENTS_PER_LEGACY_CREDIT
        transaction.balance_after = transaction.balance_after * CENTS_PER_LEGACY_CREDIT
        transaction.save(update_fields=["amount", "balance_after"])


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("app", "0005_webpagemonitor_monitorsnapshot_monitorchange"),
    ]

    operations = [
        migrations.RunPython(convert_legacy_credits_to_wallet_cents, noop_reverse),
    ]
