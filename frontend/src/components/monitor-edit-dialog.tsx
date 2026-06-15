import { useState } from "react";
import { updateMonitor, type WebpageMonitor } from "../lib/monitors";
import { Dialog } from "./shared/dialog";

type MonitorEditDialogProps = {
  monitor: WebpageMonitor | null;
  token: string;
  onClose: () => void;
  onSaved: (monitor: WebpageMonitor) => void;
};

const splitComma = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);
const splitLines = (value: string) => value.split("\n").map((item) => item.trim()).filter(Boolean);

export function MonitorEditDialog({ monitor, token, onClose, onSaved }: MonitorEditDialogProps) {
  const [name, setName] = useState(monitor?.name ?? "");
  const [url, setUrl] = useState(monitor?.url ?? "");
  const [mode, setMode] = useState<WebpageMonitor["mode"]>(monitor?.mode ?? "text");
  const [frequency, setFrequency] = useState<WebpageMonitor["frequency"]>(monitor?.frequency ?? "daily");
  const [selectors, setSelectors] = useState(monitor?.selectors.join(", ") ?? "");
  const [fields, setFields] = useState(monitor?.fields.join(", ") ?? "");
  const [tags, setTags] = useState(monitor?.tags.join(", ") ?? "");
  const [project, setProject] = useState(monitor?.project ?? "");
  const [webhookUrl, setWebhookUrl] = useState(monitor?.webhook_url ?? "");
  const [notifyEmail, setNotifyEmail] = useState(monitor?.notify_email ?? false);
  const [notificationEmails, setNotificationEmails] = useState(monitor?.notification_emails.join(", ") ?? "");
  const [notificationFrequency, setNotificationFrequency] = useState<WebpageMonitor["notification_frequency"]>(monitor?.notification_frequency ?? "immediate");
  const [notifyOnChanged, setNotifyOnChanged] = useState(monitor?.notify_on_changed ?? true);
  const [notifyOnUnavailable, setNotifyOnUnavailable] = useState(monitor?.notify_on_unavailable ?? true);
  const [notifyOnRecovered, setNotifyOnRecovered] = useState(monitor?.notify_on_recovered ?? true);
  const [slackWebhookUrl, setSlackWebhookUrl] = useState(monitor?.slack_webhook_url ?? "");
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState(monitor?.discord_webhook_url ?? "");
  const [teamsWebhookUrl, setTeamsWebhookUrl] = useState(monitor?.teams_webhook_url ?? "");
  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState(monitor?.telegram_chat_id ?? "");
  const [aiCleanup, setAiCleanup] = useState(monitor?.ai_cleanup ?? false);
  const [minimumChangePercent, setMinimumChangePercent] = useState(monitor?.minimum_change_percent ?? 0);
  const [ignoreSelectors, setIgnoreSelectors] = useState(monitor?.ignore_selectors.join(", ") ?? "");
  const [ignorePatterns, setIgnorePatterns] = useState(monitor?.ignore_patterns.join("\n") ?? "");
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(monitor?.ignore_whitespace ?? false);
  const [ignoreCase, setIgnoreCase] = useState(monitor?.ignore_case ?? false);
  const [ignoreNumbers, setIgnoreNumbers] = useState(monitor?.ignore_numbers ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!monitor) return;
    setSaving(true);
    setError("");
    try {
      const updated = await updateMonitor(monitor.id, {
        name,
        url,
        mode,
        frequency,
        selectors: splitComma(selectors),
        fields: splitComma(fields),
        tags: splitComma(tags),
        project,
        webhook_url: webhookUrl,
        notify_email: notifyEmail,
        notification_emails: splitComma(notificationEmails),
        notification_frequency: notificationFrequency,
        notify_on_changed: notifyOnChanged,
        notify_on_unavailable: notifyOnUnavailable,
        notify_on_recovered: notifyOnRecovered,
        slack_webhook_url: slackWebhookUrl,
        discord_webhook_url: discordWebhookUrl,
        teams_webhook_url: teamsWebhookUrl,
        ...(telegramBotToken ? { telegram_bot_token: telegramBotToken } : {}),
        telegram_chat_id: telegramChatId,
        ai_cleanup: aiCleanup,
        minimum_change_percent: minimumChangePercent,
        ignore_selectors: splitComma(ignoreSelectors),
        ignore_patterns: splitLines(ignorePatterns),
        ignore_whitespace: ignoreWhitespace,
        ignore_case: ignoreCase,
        ignore_numbers: ignoreNumbers,
      }, token);
      onSaved(updated);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not update monitor.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={Boolean(monitor)} onClose={onClose} size="xl" className="monitor-edit-dialog" ariaLabel="Edit monitor" closeLabel="Close edit monitor">
      {monitor && (
        <>
          <header className="monitor-dialog-header"><p className="eyebrow">Monitor configuration</p><h2>Edit {monitor.name || monitor.url}</h2></header>
          {error && <p className="monitor-error">{error}</p>}
          <div className="monitor-edit-grid">
            <label>Name<input value={name} onChange={(event) => setName(event.target.value)} /></label>
            <label>URL<input type="url" value={url} onChange={(event) => setUrl(event.target.value)} /></label>
            <label>Mode<select value={mode} onChange={(event) => setMode(event.target.value as WebpageMonitor["mode"])}><option value="text">Cleaned text</option><option value="selected">Selected elements</option><option value="structured">Structured fields</option><option value="visual">Visual screenshot</option></select></label>
            <label>Frequency<select value={frequency} onChange={(event) => setFrequency(event.target.value as WebpageMonitor["frequency"])}><option value="minutely">Every minute</option><option value="hourly">Hourly</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></label>
            <label>Selectors<input value={selectors} onChange={(event) => setSelectors(event.target.value)} /></label>
            <label>Structured fields<input value={fields} onChange={(event) => setFields(event.target.value)} /></label>
            <label>Project<input value={project} onChange={(event) => setProject(event.target.value)} placeholder="Competitors" /></label>
            <label>Tags<input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="pricing, important" /></label>
            <fieldset className="monitor-notification-settings monitor-edit-wide">
              <legend>Notifications</legend>
              <label>Delivery schedule<select value={notificationFrequency} onChange={(event) => setNotificationFrequency(event.target.value as WebpageMonitor["notification_frequency"])}><option value="immediate">Immediately</option><option value="daily">Daily digest</option><option value="weekly">Weekly digest</option></select></label>
              <label>Custom email recipients<input value={notificationEmails} onChange={(event) => setNotificationEmails(event.target.value)} placeholder="alerts@example.com, team@example.com" /></label>
              <label>Generic signed webhook<input type="url" value={webhookUrl} onChange={(event) => setWebhookUrl(event.target.value)} /></label>
              <label>Slack webhook<input type="url" value={slackWebhookUrl} onChange={(event) => setSlackWebhookUrl(event.target.value)} /></label>
              <label>Discord webhook<input type="url" value={discordWebhookUrl} onChange={(event) => setDiscordWebhookUrl(event.target.value)} /></label>
              <label>Microsoft Teams webhook<input type="url" value={teamsWebhookUrl} onChange={(event) => setTeamsWebhookUrl(event.target.value)} /></label>
              <label>Telegram bot token<input type="password" value={telegramBotToken} onChange={(event) => setTelegramBotToken(event.target.value)} placeholder={monitor.telegram_bot_configured ? "Configured; enter to replace" : ""} /></label>
              <label>Telegram chat ID<input value={telegramChatId} onChange={(event) => setTelegramChatId(event.target.value)} /></label>
              <label className="monitor-check"><input type="checkbox" checked={notifyEmail} onChange={(event) => setNotifyEmail(event.target.checked)} /> Use account email when custom recipients are empty</label>
              <label className="monitor-check"><input type="checkbox" checked={notifyOnChanged} onChange={(event) => setNotifyOnChanged(event.target.checked)} /> Page changed alerts</label>
              <label className="monitor-check"><input type="checkbox" checked={notifyOnUnavailable} onChange={(event) => setNotifyOnUnavailable(event.target.checked)} /> Page unavailable alerts</label>
              <label className="monitor-check"><input type="checkbox" checked={notifyOnRecovered} onChange={(event) => setNotifyOnRecovered(event.target.checked)} /> Page recovered alerts</label>
            </fieldset>
            <label>Minimum change percentage<input type="number" min={0} max={100} step={0.1} value={minimumChangePercent} onChange={(event) => setMinimumChangePercent(Number(event.target.value))} /></label>
            <label>Ignored selectors<input value={ignoreSelectors} onChange={(event) => setIgnoreSelectors(event.target.value)} /></label>
            <label className="monitor-edit-wide">Ignored text patterns<textarea rows={3} value={ignorePatterns} onChange={(event) => setIgnorePatterns(event.target.value)} /></label>
            <label className="monitor-check"><input type="checkbox" checked={aiCleanup} onChange={(event) => setAiCleanup(event.target.checked)} /> AI cleanup</label>
            <label className="monitor-check"><input type="checkbox" checked={ignoreWhitespace} onChange={(event) => setIgnoreWhitespace(event.target.checked)} /> Ignore whitespace</label>
            <label className="monitor-check"><input type="checkbox" checked={ignoreCase} onChange={(event) => setIgnoreCase(event.target.checked)} /> Ignore capitalization</label>
            <label className="monitor-check"><input type="checkbox" checked={ignoreNumbers} onChange={(event) => setIgnoreNumbers(event.target.checked)} /> Ignore numbers</label>
          </div>
          <button type="button" className="monitor-primary-button" disabled={saving || monitor.is_running || !url} onClick={() => void save()}>
            {monitor.is_running ? "Wait for check to finish" : saving ? "Saving..." : "Save monitor"}
          </button>
        </>
      )}
    </Dialog>
  );
}
