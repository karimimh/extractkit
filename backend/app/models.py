import uuid

from django.contrib.auth.models import User
from django.db import models


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="userprofile")
    download_credits = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.user.email} — ${self.download_credits / 100:.2f} balance"


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
        return f"{self.user.email} — ${self.download_credits / 100:.2f} top-up — {self.status}"


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
        return f"{self.user.email} — {self.kind} {self.amount} cents ({self.balance_after} cents left)"


class ExportJob(models.Model):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    STATUS_CHOICES = [
        (PENDING, "Pending"),
        (RUNNING, "Running"),
        (COMPLETED, "Completed"),
        (FAILED, "Failed"),
    ]

    public_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    user = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="export_jobs",
    )
    schedule = models.ForeignKey(
        "ExportSchedule",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="jobs",
    )
    client_ip = models.GenericIPAddressField(null=True, blank=True)
    tool = models.CharField(max_length=32)
    endpoint = models.CharField(max_length=64)
    origin = models.URLField(blank=True)
    request_data = models.JSONField(default=dict)
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default=PENDING)
    title = models.CharField(max_length=300, blank=True)
    result = models.JSONField(null=True, blank=True)
    error = models.TextField(blank=True)
    response_status = models.PositiveSmallIntegerField(null=True, blank=True)
    webhook_status = models.PositiveSmallIntegerField(null=True, blank=True)
    webhook_error = models.TextField(blank=True)
    webhook_delivered_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["status", "created_at"]),
        ]

    def __str__(self):
        return f"{self.tool} — {self.status} — {self.public_id}"


class ExportSchedule(models.Model):
    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    FREQUENCY_CHOICES = [
        (HOURLY, "Hourly"),
        (DAILY, "Daily"),
        (WEEKLY, "Weekly"),
        (MONTHLY, "Monthly"),
    ]

    public_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="export_schedules")
    name = models.CharField(max_length=120, blank=True)
    tool = models.CharField(max_length=32)
    endpoint = models.CharField(max_length=64)
    origin = models.URLField(blank=True)
    request_data = models.JSONField(default=dict)
    frequency = models.CharField(max_length=12, choices=FREQUENCY_CHOICES)
    webhook_url = models.URLField(blank=True)
    webhook_secret = models.CharField(max_length=128, blank=True)
    is_active = models.BooleanField(default=True)
    next_run_at = models.DateTimeField()
    last_run_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["next_run_at"]
        indexes = [models.Index(fields=["is_active", "next_run_at"], name="app_exports_is_acti_f7afe5_idx")]

    def __str__(self):
        return f"{self.name or self.tool} — {self.frequency} — {self.public_id}"


class WebpageMonitor(models.Model):
    TEXT = "text"
    SELECTED = "selected"
    STRUCTURED = "structured"
    VISUAL = "visual"
    MODE_CHOICES = [
        (TEXT, "Cleaned text"),
        (SELECTED, "Selected elements"),
        (STRUCTURED, "Structured JSON fields"),
        (VISUAL, "Visual screenshot"),
    ]

    public_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="webpage_monitors")
    name = models.CharField(max_length=120, blank=True)
    url = models.URLField()
    mode = models.CharField(max_length=12, choices=MODE_CHOICES, default=TEXT)
    selectors = models.JSONField(default=list, blank=True)
    fields = models.JSONField(default=list, blank=True)
    ai_cleanup = models.BooleanField(default=False)
    frequency = models.CharField(max_length=12, choices=ExportSchedule.FREQUENCY_CHOICES)
    webhook_url = models.URLField(blank=True)
    webhook_secret = models.CharField(max_length=128, blank=True)
    notify_email = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    next_run_at = models.DateTimeField()
    last_run_at = models.DateTimeField(null=True, blank=True)
    last_changed_at = models.DateTimeField(null=True, blank=True)
    last_error = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["next_run_at"]
        indexes = [models.Index(fields=["is_active", "next_run_at"], name="app_monitor_is_acti_next_idx")]

    def __str__(self):
        return f"{self.name or self.url} — {self.mode}"


class MonitorSnapshot(models.Model):
    monitor = models.ForeignKey(WebpageMonitor, on_delete=models.CASCADE, related_name="snapshots")
    title = models.CharField(max_length=300, blank=True)
    content_hash = models.CharField(max_length=64)
    data = models.JSONField(default=dict)
    image_path = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class MonitorChange(models.Model):
    public_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    monitor = models.ForeignKey(WebpageMonitor, on_delete=models.CASCADE, related_name="changes")
    before = models.ForeignKey(MonitorSnapshot, on_delete=models.CASCADE, related_name="+")
    after = models.ForeignKey(MonitorSnapshot, on_delete=models.CASCADE, related_name="+")
    summary = models.TextField()
    diff = models.TextField(blank=True)
    changed_percent = models.FloatField(default=0)
    diff_image_path = models.CharField(max_length=500, blank=True)
    webhook_status = models.PositiveSmallIntegerField(null=True, blank=True)
    notification_error = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
