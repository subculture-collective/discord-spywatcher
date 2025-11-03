# Analytics Extension Plugin

Adds custom analytics endpoints for advanced data analysis.

## Features

- **Stats Endpoint**: Overall statistics with caching
- **Top Users**: Most active message senders
- **Activity Timeline**: Hourly message activity
- **Multi-Client Summary**: Multi-device login analysis

## Installation

This plugin is included as an example. To enable:

1. Copy to `backend/plugins/analytics-extension/`
2. Restart SpyWatcher
3. Access the new endpoints

## Endpoints

### GET /api/plugins/analytics-extension/stats

Returns overall statistics:

```json
{
  "messages": 12345,
  "presenceEvents": 6789,
  "users": 123,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### GET /api/plugins/analytics-extension/top-users?limit=10

Returns top message senders:

```json
{
  "topUsers": [
    {
      "userId": "123456789",
      "username": "user1",
      "messageCount": 456
    }
  ]
}
```

### GET /api/plugins/analytics-extension/activity-timeline?hours=24

Returns hourly activity timeline:

```json
{
  "hours": 24,
  "timeline": [
    {
      "hour": "2024-01-01T12:00:00",
      "count": 45
    }
  ]
}
```

### GET /api/plugins/analytics-extension/multi-client-summary

Returns multi-client login summary:

```json
{
  "total": 156,
  "topUsers": [
    { "userId": "123", "count": 23 }
  ],
  "recent": [...]
}
```

## Permissions

- `api:routes` - Register API endpoints
- `database:access` - Query database
- `cache:access` - Use Redis caching

## Caching

Stats are cached for 5 minutes to improve performance.
