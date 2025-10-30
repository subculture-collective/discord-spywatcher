# Public API Documentation

Complete documentation for the Discord Spywatcher Public API.

## Table of Contents

- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [Endpoints](#endpoints)
  - [Health Check](#health-check)
  - [Analytics](#analytics)
  - [Suspicion](#suspicion)
  - [Timeline](#timeline)
  - [Bans](#bans)
  - [Auth & User](#auth--user)
- [Data Types](#data-types)
- [SDK](#sdk)
- [Examples](#examples)

## Authentication

The Spywatcher API uses **API Key authentication**. You need to include your API key in the `Authorization` header of every request.

### Generating an API Key

1. Log in to the Spywatcher dashboard
2. Navigate to **Settings** > **API Keys**
3. Click **Create New API Key**
4. Give your key a descriptive name
5. Copy the API key (format: `spy_live_...`)

⚠️ **Important**: Store your API key securely. It will only be shown once!

### Using Your API Key

Include your API key in the `Authorization` header:

```
Authorization: Bearer spy_live_your_api_key_here
```

### Example Request

```bash
curl -H "Authorization: Bearer spy_live_your_api_key_here" \
  https://api.spywatcher.com/api/ghosts
```

## Rate Limiting

The API enforces rate limits to ensure fair usage and service availability.

### Rate Limit Tiers

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Global | 100 requests | 15 minutes |
| Analytics | 30 requests | 1 minute |
| Admin | 100 requests | 15 minutes |
| Public API | 60 requests | 1 minute |
| Authentication | 5 requests | 15 minutes |

### Rate Limit Headers

Every API response includes rate limit information:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1640000000
```

### Handling Rate Limits

When you exceed the rate limit, the API returns a `429 Too Many Requests` response:

```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": "60"
}
```

Implement exponential backoff when you receive rate limit errors.

## Error Handling

The API uses standard HTTP status codes and returns errors in a consistent format.

### Error Response Format

```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

### HTTP Status Codes

| Status Code | Description |
|------------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid or missing API key |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

## Endpoints

Base URL: `https://api.spywatcher.com/api`

### Health Check

#### GET /health

Check the API health status.

**Authentication**: Not required

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Analytics

#### GET /ghosts

Get ghost users (inactive users who haven't been seen recently).

**Authentication**: Required

**Query Parameters**:
- `guildId` (optional): Filter by guild ID
- `startDate` (optional): ISO 8601 date string
- `endDate` (optional): ISO 8601 date string
- `page` (optional): Page number (default: 1)
- `perPage` (optional): Results per page (default: 50)

**Response**:
```json
[
  {
    "userId": "123456789",
    "username": "user#1234",
    "lastSeen": "2024-01-01T00:00:00.000Z",
    "daysSinceLastSeen": 30
  }
]
```

#### GET /lurkers

Get lurkers (users with presence but minimal message activity).

**Authentication**: Required

**Query Parameters**:
- `guildId` (optional): Filter by guild ID
- `page` (optional): Page number
- `perPage` (optional): Results per page

**Response**:
```json
[
  {
    "userId": "123456789",
    "username": "user#1234",
    "messageCount": 5,
    "presenceCount": 100,
    "joinedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### GET /heatmap

Get activity heatmap data showing when users are most active.

**Authentication**: Required

**Query Parameters**:
- `guildId` (optional): Filter by guild ID
- `startDate` (optional): ISO 8601 date string
- `endDate` (optional): ISO 8601 date string

**Response**:
```json
[
  {
    "hour": 14,
    "dayOfWeek": 1,
    "count": 150
  }
]
```

**Note**: `hour` is 0-23, `dayOfWeek` is 0-6 (0 = Sunday)

#### GET /roles

Get role changes for users.

**Authentication**: Required

**Query Parameters**:
- `page` (optional): Page number
- `perPage` (optional): Results per page

**Response**:
```json
{
  "data": [
    {
      "userId": "123456789",
      "username": "user#1234",
      "rolesBefore": ["Member"],
      "rolesAfter": ["Member", "Moderator"],
      "changedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

#### GET /clients

Get client data showing which platforms users are using (web, mobile, desktop).

**Authentication**: Required

**Query Parameters**:
- `guildId` (optional): Filter by guild ID

**Response**:
```json
[
  {
    "userId": "123456789",
    "username": "user#1234",
    "clients": ["desktop", "mobile"],
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
]
```

#### GET /shifts

Get status shifts (when users change their online status).

**Authentication**: Required

**Query Parameters**:
- `guildId` (optional): Filter by guild ID

**Response**:
```json
[
  {
    "userId": "123456789",
    "username": "user#1234",
    "previousStatus": "online",
    "currentStatus": "idle",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
]
```

### Suspicion

#### GET /suspicion

Get suspicion data for users with suspicious behavior patterns.

**Authentication**: Required

**Query Parameters**:
- `guildId` (optional): Filter by guild ID

**Response**:
```json
[
  {
    "userId": "123456789",
    "username": "user#1234",
    "suspicionScore": 75,
    "reasons": ["Multiple client logins", "Unusual activity pattern"],
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
]
```

### Timeline

#### GET /timeline

Get chronological timeline events.

**Authentication**: Required

**Query Parameters**:
- `page` (optional): Page number
- `perPage` (optional): Results per page

**Response**:
```json
[
  {
    "id": "evt_123",
    "userId": "123456789",
    "username": "user#1234",
    "eventType": "presence_change",
    "data": {
      "status": "online"
    },
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
]
```

#### GET /timeline/:userId

Get timeline events for a specific user.

**Authentication**: Required

**Path Parameters**:
- `userId`: User ID

**Query Parameters**:
- `page` (optional): Page number
- `perPage` (optional): Results per page

**Response**: Same as `/timeline`

### Bans

#### GET /banned

Get list of banned guilds.

**Authentication**: Required

**Response**:
```json
[
  {
    "guildId": "123456789",
    "guildName": "Example Guild",
    "reason": "Violation of terms",
    "bannedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### POST /ban

Ban a guild.

**Authentication**: Required (Admin only)

**Request Body**:
```json
{
  "guildId": "123456789",
  "reason": "Violation of terms"
}
```

**Response**:
```json
{
  "success": true
}
```

#### POST /unban

Unban a guild.

**Authentication**: Required (Admin only)

**Request Body**:
```json
{
  "guildId": "123456789"
}
```

**Response**:
```json
{
  "success": true
}
```

#### GET /userbans

Get list of banned users.

**Authentication**: Required

**Response**:
```json
[
  {
    "userId": "123456789",
    "username": "user#1234",
    "reason": "Abuse of service",
    "bannedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### POST /userban

Ban a user.

**Authentication**: Required (Admin only)

**Request Body**:
```json
{
  "userId": "123456789",
  "reason": "Abuse of service"
}
```

**Response**:
```json
{
  "success": true
}
```

#### POST /userunban

Unban a user.

**Authentication**: Required (Admin only)

**Request Body**:
```json
{
  "userId": "123456789"
}
```

**Response**:
```json
{
  "success": true
}
```

### Auth & User

#### GET /auth/me

Get the current authenticated user's information.

**Authentication**: Required

**Response**:
```json
{
  "id": "usr_123",
  "discordId": "123456789",
  "username": "user",
  "discriminator": "1234",
  "avatar": "https://cdn.discordapp.com/avatars/...",
  "role": "USER",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### GET /auth/api-keys

Get list of API keys for the authenticated user.

**Authentication**: Required

**Response**:
```json
[
  {
    "id": "key_123",
    "name": "My API Key",
    "scopes": "[]",
    "lastUsedAt": "2024-01-01T00:00:00.000Z",
    "expiresAt": null,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### POST /auth/api-keys

Create a new API key.

**Authentication**: Required

**Request Body**:
```json
{
  "name": "My New API Key",
  "scopes": ["read", "write"]
}
```

**Response**:
```json
{
  "id": "key_123",
  "key": "spy_live_abc123..."
}
```

⚠️ **Important**: The `key` field is only returned once. Store it securely!

#### DELETE /auth/api-keys/:keyId

Revoke an API key.

**Authentication**: Required

**Path Parameters**:
- `keyId`: API key ID

**Response**:
```json
{
  "success": true
}
```

## Data Types

### User

```typescript
{
  id: string;
  discordId: string;
  username: string;
  discriminator: string;
  avatar?: string;
  role: 'USER' | 'MODERATOR' | 'ADMIN' | 'BANNED';
  createdAt: string;
  updatedAt: string;
}
```

### GhostUser

```typescript
{
  userId: string;
  username: string;
  lastSeen: string;
  daysSinceLastSeen: number;
}
```

### LurkerUser

```typescript
{
  userId: string;
  username: string;
  messageCount: number;
  presenceCount: number;
  joinedAt: string;
}
```

### HeatmapData

```typescript
{
  hour: number;        // 0-23
  dayOfWeek: number;   // 0-6 (0 = Sunday)
  count: number;
}
```

### More Types

See the [SDK type definitions](../sdk/src/types.ts) for complete type information.

## SDK

We provide an official TypeScript/JavaScript SDK that makes it easy to interact with the API.

### Installation

```bash
npm install @spywatcher/sdk
```

### Quick Start

```typescript
import { Spywatcher } from '@spywatcher/sdk';

const client = new Spywatcher({
  baseUrl: 'https://api.spywatcher.com/api',
  apiKey: 'spy_live_your_api_key_here'
});

// Get ghost users
const ghosts = await client.analytics.getGhosts();

// Get suspicion data
const suspicions = await client.getSuspicionData();
```

### Documentation

See the [SDK README](../sdk/README.md) for complete SDK documentation.

## Examples

### cURL Examples

#### Get Ghost Users

```bash
curl -X GET \
  -H "Authorization: Bearer spy_live_your_api_key_here" \
  https://api.spywatcher.com/api/ghosts
```

#### Get Heatmap with Date Range

```bash
curl -X GET \
  -H "Authorization: Bearer spy_live_your_api_key_here" \
  "https://api.spywatcher.com/api/heatmap?startDate=2024-01-01T00:00:00Z&endDate=2024-12-31T23:59:59Z"
```

#### Create API Key

```bash
curl -X POST \
  -H "Authorization: Bearer spy_live_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{"name": "My New Key", "scopes": ["read"]}' \
  https://api.spywatcher.com/api/auth/api-keys
```

### JavaScript/TypeScript Examples

See the [SDK examples](../sdk/examples/) directory for complete examples:

- [Basic Usage](../sdk/examples/basic-usage.ts)
- [Advanced Analytics](../sdk/examples/advanced-analytics.ts)
- [Error Handling](../sdk/examples/error-handling.ts)

### Python Example

```python
import requests

API_KEY = 'spy_live_your_api_key_here'
BASE_URL = 'https://api.spywatcher.com/api'

headers = {
    'Authorization': f'Bearer {API_KEY}'
}

# Get ghost users
response = requests.get(f'{BASE_URL}/ghosts', headers=headers)
ghosts = response.json()
print(f"Found {len(ghosts)} ghost users")

# Get suspicion data
response = requests.get(f'{BASE_URL}/suspicion', headers=headers)
suspicions = response.json()
print(f"Found {len(suspicions)} suspicious users")
```

## Support

- **GitHub Issues**: https://github.com/subculture-collective/discord-spywatcher/issues
- **Documentation**: https://github.com/subculture-collective/discord-spywatcher

## License

MIT
