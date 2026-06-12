# Improve Monitor Webpage tool

The current tool already supports:

- Cleaned text, CSS selector, structured JSON, and visual monitoring
- Hourly/daily/weekly/monthly schedules
- Email and webhook notifications
- Text and visual diffs
- Pause, resume, delete, and manual checks
- AI cleanup

The main weakness is that users cannot easily inspect snapshots, understand changes, control alert noise, or diagnose failed checks.

## Recommended Improvements

| Priority | Feature                                 |     Value | Effort |
| -------- | --------------------------------------- | --------: | -----: |
| 1        | **Snapshot and change history dialog**  | Very high | Medium |
| 2        | **Change thresholds and ignore rules**  | Very high | Medium |
| 3        | **Better monitor cards and run status** |      High |    Low |
| 4        | **Edit monitor configuration**          |      High |    Low |
| 5        | **Before/after comparison viewer**      |      High | Medium |
| 6        | **Reliable notification management**    |      High | Medium |
| 7        | **AI change summaries**                 |      High | Medium |
| 8        | **Custom schedules**                    |    Medium | Medium |
| 9        | **Monitor templates**                   |    Medium | Medium |
| 10       | **Reports, teams, and integrations**    |    Medium |   High |

## 1. Snapshot And Change History

The backend stores snapshots and up to 50 changes, but the UI only displays the latest change.

Add a monitor details dialog containing:

- Latest webpage snapshot
- Full snapshot timeline
- Change history
- Before/after content
- Visual before/after/diff images
- Change percentage
- Check timestamps
- Download snapshot as JSON, screenshot, Markdown, or PDF
- Restore a snapshot as the new comparison baseline

This should be the first major improvement.

## 2. Reduce Unwanted Alerts

Currently, any content-hash difference creates a change event. This can create alerts for timestamps, ads, rotating banners, and minor visual changes.

Add:

- Minimum changed percentage threshold
- Alert only when selected values change
- Ignore CSS selectors
- Ignore matching text or regular expressions
- Ignore whitespace, capitalization, or number changes
- Visual sensitivity setting
- Require a change to appear in two consecutive checks
- Alert only when content is added or removed
- Alert only when a numeric value increases or decreases

Example:

> Alert only when `.price` changes by more than 5%.

## 3. Improve Monitor Cards

Each monitor card should show:

- Page title, URL, and favicon
- Monitoring mode and selectors/fields
- Active, paused, checking, failed, or baseline status
- Last successful check
- Next scheduled check
- Latest change time and percentage
- Latest snapshot preview
- Notification channels
- Consecutive failure count

Also:

- Spin the `Check now` icon while running
- Disable duplicate manual checks
- Replace the misleading section refresh icon
- Add filters, sorting, and search

## 4. Edit And Duplicate Monitors

Users currently cannot edit monitors through the UI.

Add:

- Edit name, URL, mode, selectors, fields, frequency, and notifications
- Duplicate monitor
- Reset baseline
- Bulk pause, resume, delete, or run
- Organize monitors using tags, folders, or projects

## 5. Better Comparison Viewer

Create a dedicated comparison experience:

- Side-by-side text diff
- Inline added/removed highlighting
- Before/after image slider
- Highlight changed visual regions
- Structured field comparison table
- Filter comparison to added, removed, or modified content
- Mark changes as reviewed or ignored

## 6. Notification Improvements

- Custom notification email addresses
- Rich HTML email containing the actual diff
- Notification test button
- Retry failed notifications
- Notification delivery history
- Daily or weekly digest mode
- Alert recovery after repeated failures
- Separate alerts for page unavailable, changed, and recovered
- Native Slack, Discord, Microsoft Teams, and Telegram integrations

## 7. AI Change Intelligence

Instead of only reporting “Content changed by 12%,” provide:

- Plain-language change summary
- Importance classification
- Price, availability, CTA, policy, or SEO change detection
- “Why this matters” explanation
- Ignore insignificant changes automatically
- Weekly summaries across multiple monitors

Example:

> The competitor reduced its Pro plan from $49 to $39 and added a 14-day free trial.

## 8. Scheduling And Reliability

- Custom intervals such as every 5 minutes or every 6 hours
- Specific days and times
- User timezone support
- Quiet hours
- Retry failed checks with backoff
- Monitor timeout configuration
- Check from multiple regions
- Detect HTTP status, redirects, and page availability
- Dev-only minute-by-minute frequency for testing

## 9. Monitor Templates

Offer focused setup templates:

- Price tracker
- Product availability tracker
- Competitor landing page tracker
- SEO metadata monitor
- Terms and privacy policy monitor
- Job listing tracker
- News or announcement tracker
- Visual regression monitor

Templates make configuration easier and give the tool clearer business value.

## 10. Reporting And Collaboration

- Weekly PDF or Excel reports
- Shareable change reports
- Public read-only report links
- Comments and review status
- Team workspaces
- Client folders
- Branded agency reports
- Monitor API and outbound integrations

## Recommended Build Order

I would implement these first:

1. **Monitor details dialog with snapshot and complete change history**
2. **Improved cards with check progress and latest snapshot preview**
3. **Edit, duplicate, and reset-baseline actions**
4. **Change percentage threshold and ignored selectors**
5. **Rich before/after comparison viewer**
6. **AI summaries and rich email notifications**

These additions improve the existing tool directly before expanding it into the larger Competitor & Price Intelligence product.
