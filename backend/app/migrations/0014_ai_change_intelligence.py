from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("app", "0013_monitor_notification_improvements"),
    ]

    operations = [
        migrations.AddField(model_name="webpagemonitor", name="ai_change_analysis", field=models.BooleanField(default=True)),
        migrations.AddField(model_name="webpagemonitor", name="auto_ignore_insignificant", field=models.BooleanField(default=False)),
        migrations.AddField(model_name="monitorchange", name="ai_analysis_source", field=models.CharField(blank=True, max_length=20)),
        migrations.AddField(model_name="monitorchange", name="ai_analyzed_at", field=models.DateTimeField(blank=True, null=True)),
        migrations.AddField(model_name="monitorchange", name="ai_categories", field=models.JSONField(blank=True, default=list)),
        migrations.AddField(model_name="monitorchange", name="ai_importance", field=models.CharField(blank=True, choices=[("low", "Low"), ("medium", "Medium"), ("high", "High")], max_length=12)),
        migrations.AddField(model_name="monitorchange", name="ai_insignificant", field=models.BooleanField(default=False)),
        migrations.AddField(model_name="monitorchange", name="ai_summary", field=models.TextField(blank=True)),
        migrations.AddField(model_name="monitorchange", name="ai_why_it_matters", field=models.TextField(blank=True)),
    ]
