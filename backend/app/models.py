from django.contrib.auth.models import User
from django.db import models


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="userprofile")
    download_credits = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.user.email} — {self.download_credits} credits"


class AnonymousDownload(models.Model):
    ip_address = models.GenericIPAddressField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["ip_address"])]

    def __str__(self):
        return f"{self.ip_address} at {self.created_at}"


class CryptoPayment(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("confirmed", "Confirmed"),
        ("finished", "Finished"),
        ("failed", "Failed"),
        ("expired", "Expired"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="crypto_payments")
    nowpayments_payment_id = models.CharField(max_length=100, unique=True)
    download_credits = models.PositiveIntegerField()
    amount_usd = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.email} — {self.download_credits} credits — {self.status}"


class CreditTransaction(models.Model):
    SPEND = "spend"
    GRANT = "grant"
    REFUND = "refund"
    KIND_CHOICES = [
        (SPEND, "Spend"),
        (GRANT, "Grant"),
        (REFUND, "Refund"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="credit_transactions")
    kind = models.CharField(max_length=10, choices=KIND_CHOICES)
    action = models.CharField(max_length=64, blank=True)
    amount = models.IntegerField(help_text="Negative for spend, positive for grant/refund")
    balance_after = models.PositiveIntegerField()
    reference = models.CharField(max_length=128, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "-created_at"])]

    def __str__(self):
        return f"{self.user.email} — {self.kind} {self.amount} ({self.balance_after} left)"
