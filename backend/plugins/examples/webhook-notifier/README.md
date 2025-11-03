# Webhook Notifier Plugin

Sends notifications to external webhooks for important events.

## Features

- Multi-client login notifications
- Suspicious message pattern detection
- Configurable webhook URL
- Notification tracking and statistics

## Installation

1. Copy to `backend/plugins/webhook-notifier/`
2. Set environment variable: `WEBHOOK_NOTIFIER_URL=https://your-webhook-url`
3. Restart SpyWatcher

## Configuration

### Environment Variables

- `WEBHOOK_NOTIFIER_URL` - Webhook URL to send notifications to (required)

Example:
```bash
export WEBHOOK_NOTIFIER_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

## Notification Format

Notifications are sent as JSON POST requests:

```json
{
  "event": "multi-client",
  "severity": "warning",
  "title": "Multi-Client Login Detected",
  "description": "User username is online on multiple clients",
  "details": {
    "userId": "123456789",
    "username": "username",
    "platforms": "desktop, mobile",
    "timestamp": "2024-01-01T12:00:00.000Z"
  },
  "source": "SpyWatcher",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Events

The plugin monitors and notifies for:

- **multi-client**: User logged in from multiple devices
- **suspicious-message**: Very long messages (>1000 characters)

## Integration Examples

### Slack

Use Slack Incoming Webhooks:
```bash
export WEBHOOK_NOTIFIER_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX
```

### Discord

Use Discord Webhooks:
```bash
export WEBHOOK_NOTIFIER_URL=https://discord.com/api/webhooks/123456789/abcdefghijklmnop
```

### Custom Service

Any service that accepts JSON POST requests can be used.

## Permissions

- `discord:events` - Listen to Discord events
- `network:access` - Make HTTP requests to webhook

## Security

- Webhook URL is masked in logs
- Notifications include only necessary information
- Failed notifications are logged but don't stop processing

## Troubleshooting

### Notifications Not Sending

1. Check `WEBHOOK_NOTIFIER_URL` is set correctly
2. Verify webhook URL is accessible
3. Check plugin logs for error messages
4. Test webhook with curl:
   ```bash
   curl -X POST -H "Content-Type: application/json" \
     -d '{"test": "message"}' \
     $WEBHOOK_NOTIFIER_URL
   ```

### Too Many Notifications

Adjust event thresholds in the plugin code if needed.
