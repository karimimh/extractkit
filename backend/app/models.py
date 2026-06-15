import hashlib
import secrets
import uuid

from django.contrib.auth.models import User
from django.db import models


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="userprofile")
    balance_cents = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.user.email} — ${self.balance_cents / 100:.2f} balance"


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
    balance_cents = models.PositiveIntegerField()
    amount_usd = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.email} — ${self.balance_cents / 100:.2f} top-up — {self.status}"


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


class DeveloperAPIKey(models.Model):
    public_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="developer_api_keys")
    name = models.CharField(max_length=120)
    prefix = models.CharField(max_length=20, unique=True)
    key_hash = models.CharField(max_length=64, unique=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    revoked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    @classmethod
    def create_key(cls, *, user, name):
        raw_key = f"dp_live_{secrets.token_urlsafe(32)}"
        key = cls.objects.create(
            user=user,
            name=name,
            prefix=raw_key[:16],
            key_hash=hashlib.sha256(raw_key.encode()).hexdigest(),
        )
        return key, raw_key

    def __str__(self):
        return f"{self.name} — {self.prefix}…"


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
    api_key = models.ForeignKey(
        DeveloperAPIKey,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="jobs",
    )
    client_ip = models.GenericIPAddressField(null=True, blank=True)
    idempotency_key = models.CharField(max_length=200, blank=True)
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
    webhook_url = models.URLField(blank=True)
    webhook_secret = models.CharField(max_length=128, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["status", "created_at"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "idempotency_key"],
                condition=~models.Q(idempotency_key=""),
                name="unique_user_export_idempotency_key",
            ),
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
    MINUTELY = "minutely"
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
    FREQUENCY_CHOICES = [
        (MINUTELY, "Every minute"),
        *ExportSchedule.FREQUENCY_CHOICES,
    ]
    IMMEDIATE = "immediate"
    DAILY_DIGEST = "daily"
    WEEKLY_DIGEST = "weekly"
    NOTIFICATION_FREQUENCY_CHOICES = [
        (IMMEDIATE, "Immediately"),
        (DAILY_DIGEST, "Daily digest"),
        (WEEKLY_DIGEST, "Weekly digest"),
    ]

    public_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="webpage_monitors")
    name = models.CharField(max_length=120, blank=True)
    url = models.URLField()
    mode = models.CharField(max_length=12, choices=MODE_CHOICES, default=TEXT)
    selectors = models.JSONField(default=list, blank=True)
    fields = models.JSONField(default=list, blank=True)
    tags = models.JSONField(default=list, blank=True)
    project = models.CharField(max_length=120, blank=True)
    ignore_selectors = models.JSONField(default=list, blank=True)
    ignore_patterns = models.JSONField(default=list, blank=True)
    ignore_whitespace = models.BooleanField(default=False)
    ignore_case = models.BooleanField(default=False)
    ignore_numbers = models.BooleanField(default=False)
    minimum_change_percent = models.FloatField(default=0)
    baseline_reset_pending = models.BooleanField(default=False)
    ai_cleanup = models.BooleanField(default=False)
    ai_change_analysis = models.BooleanField(default=True)
    auto_ignore_insignificant = models.BooleanField(default=False)
    frequency = models.CharField(max_length=12, choices=FREQUENCY_CHOICES)
    webhook_url = models.URLField(blank=True)
    webhook_secret = models.CharField(max_length=128, blank=True)
    notify_email = models.BooleanField(default=False)
    notification_emails = models.JSONField(default=list, blank=True)
    notification_frequency = models.CharField(
        max_length=12,
        choices=NOTIFICATION_FREQUENCY_CHOICES,
        default=IMMEDIATE,
    )
    notify_on_changed = models.BooleanField(default=True)
    notify_on_unavailable = models.BooleanField(default=True)
    notify_on_recovered = models.BooleanField(default=True)
    slack_webhook_url = models.URLField(blank=True)
    discord_webhook_url = models.URLField(blank=True)
    teams_webhook_url = models.URLField(blank=True)
    telegram_bot_token = models.CharField(max_length=200, blank=True)
    telegram_chat_id = models.CharField(max_length=100, blank=True)
    last_digest_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_running = models.BooleanField(default=False)
    next_run_at = models.DateTimeField()
    last_run_at = models.DateTimeField(null=True, blank=True)
    last_success_at = models.DateTimeField(null=True, blank=True)
    last_changed_at = models.DateTimeField(null=True, blank=True)
    last_error = models.TextField(blank=True)
    consecutive_failures = models.PositiveIntegerField(default=0)
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
    PENDING = "pending"
    REVIEWED = "reviewed"
    IGNORED = "ignored"
    STATUS_CHOICES = [
        (PENDING, "Pending review"),
        (REVIEWED, "Reviewed"),
        (IGNORED, "Ignored"),
    ]

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
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default=PENDING)
    ai_summary = models.TextField(blank=True)
    ai_importance = models.CharField(
        max_length=12,
        choices=[("low", "Low"), ("medium", "Medium"), ("high", "High")],
        blank=True,
    )
    ai_categories = models.JSONField(default=list, blank=True)
    ai_why_it_matters = models.TextField(blank=True)
    ai_insignificant = models.BooleanField(default=False)
    ai_analysis_source = models.CharField(max_length=20, blank=True)
    ai_analyzed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class MonitorNotificationDelivery(models.Model):
    PENDING = "pending"
    DELIVERED = "delivered"
    FAILED = "failed"
    STATUS_CHOICES = [(PENDING, "Pending"), (DELIVERED, "Delivered"), (FAILED, "Failed")]
    EMAIL = "email"
    WEBHOOK = "webhook"
    SLACK = "slack"
    DISCORD = "discord"
    TEAMS = "teams"
    TELEGRAM = "telegram"
    CHANNEL_CHOICES = [
        (EMAIL, "Email"),
        (WEBHOOK, "Webhook"),
        (SLACK, "Slack"),
        (DISCORD, "Discord"),
        (TEAMS, "Microsoft Teams"),
        (TELEGRAM, "Telegram"),
    ]
    CHANGED = "changed"
    UNAVAILABLE = "unavailable"
    RECOVERED = "recovered"
    TEST = "test"
    DIGEST = "digest"
    EVENT_CHOICES = [
        (CHANGED, "Changed"),
        (UNAVAILABLE, "Unavailable"),
        (RECOVERED, "Recovered"),
        (TEST, "Test"),
        (DIGEST, "Digest"),
    ]

    public_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    monitor = models.ForeignKey(WebpageMonitor, on_delete=models.CASCADE, related_name="notification_deliveries")
    change = models.ForeignKey(MonitorChange, null=True, blank=True, on_delete=models.SET_NULL, related_name="notification_deliveries")
    event = models.CharField(max_length=16, choices=EVENT_CHOICES)
    channel = models.CharField(max_length=12, choices=CHANNEL_CHOICES)
    destination = models.CharField(max_length=500)
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default=PENDING)
    attempts = models.PositiveSmallIntegerField(default=0)
    response_status = models.PositiveSmallIntegerField(null=True, blank=True)
    error = models.TextField(blank=True)
    payload = models.JSONField(default=dict, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
