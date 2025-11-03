# Ghost Detection API

Retrieve ghost detection scores for users in a guild.

## Get Ghost Scores

Retrieve ghost detection scores for users based on presence and message activity.

### Request

```http
GET /api/ghosts?guildId={guildId}&limit=50
Authorization: Bearer {token}
```

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `guildId` | string | No | Filter by guild ID. If omitted, returns data for all accessible guilds. |
| `limit` | integer | No | Number of results to return (1-100, default: 50) |
| `minPresenceCount` | integer | No | Minimum presence count threshold (default: 30) |
| `maxMessageCount` | integer | No | Maximum message count threshold (default: 10) |
| `minScore` | number | No | Minimum ghost score (default: 0) |
| `sort` | string | No | Sort field: `score`, `presenceCount`, `messageCount` (default: `score`) |
| `order` | string | No | Sort order: `asc` or `desc` (default: `desc`) |

### Response

```json
{
  "data": [
    {
      "userId": "123456789",
      "username": "SilentBob#1234",
      "avatar": "https://cdn.discordapp.com/avatars/123456789/abc123.png",
      "presenceCount": 150,
      "messageCount": 5,
      "ghostScore": 25.0,
      "lastSeen": "2024-11-03T12:00:00.000Z",
      "accountCreated": "2023-01-15T10:00:00.000Z",
      "roles": ["@Member", "@Verified"],
      "multiClientCount": 45
    }
  ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 50,
    "totalPages": 1
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | Discord user ID |
| `username` | string | Discord username with discriminator |
| `avatar` | string | URL to user's avatar image |
| `presenceCount` | integer | Number of times user was detected online |
| `messageCount` | integer | Number of messages sent |
| `ghostScore` | number | Calculated ghost score (presenceCount / (messageCount + 1)) |
| `lastSeen` | string | ISO 8601 timestamp of last presence |
| `accountCreated` | string | ISO 8601 timestamp of account creation |
| `roles` | array | List of role names |
| `multiClientCount` | integer | Number of times multiple clients were used simultaneously |

## Error Responses

### 401 Unauthorized

Invalid or missing authentication token.

```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token",
  "statusCode": 401
}
```

### 403 Forbidden

Insufficient permissions to access guild data.

```json
{
  "error": "Forbidden",
  "message": "You do not have permission to access this guild's data",
  "statusCode": 403
}
```

### 404 Not Found

Guild not found or bot not in guild.

```json
{
  "error": "Not Found",
  "message": "Guild not found or bot is not a member",
  "statusCode": 404
}
```

### 429 Too Many Requests

Rate limit exceeded.

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again in 60 seconds.",
  "statusCode": 429,
  "retryAfter": 60
}
```

## Code Examples

::: code-group

```typescript [TypeScript]
import { SpywatcherClient } from '@spywatcher/sdk';

const client = new SpywatcherClient({
  apiKey: 'spy_live_your_api_key',
});

// Get ghost scores for a guild
const ghosts = await client.ghosts.list({
  guildId: '123456789',
  minScore: 10,
  limit: 50,
});

console.log(`Found ${ghosts.meta.total} ghost users`);
ghosts.data.forEach(ghost => {
  console.log(`${ghost.username}: ${ghost.ghostScore}`);
});
```

```typescript [TypeScript (Fetch)]
const response = await fetch(
  'https://api.spywatcher.com/api/ghosts?guildId=123456789&minScore=10',
  {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  }
);

if (!response.ok) {
  throw new Error(`HTTP error! status: ${response.status}`);
}

const data = await response.json();
console.log('Ghost users:', data.data);
```

```python [Python]
import requests

response = requests.get(
    'https://api.spywatcher.com/api/ghosts',
    params={
        'guildId': '123456789',
        'minScore': 10,
        'limit': 50
    },
    headers={'Authorization': f'Bearer {api_key}'}
)

if response.status_code == 200:
    data = response.json()
    print(f"Found {data['meta']['total']} ghost users")
    for ghost in data['data']:
        print(f"{ghost['username']}: {ghost['ghostScore']}")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

```javascript [JavaScript]
fetch('https://api.spywatcher.com/api/ghosts?guildId=123456789&minScore=10', {
  headers: {
    'Authorization': `Bearer ${apiKey}`,
  },
})
  .then(res => {
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
  })
  .then(data => {
    console.log(`Found ${data.meta.total} ghost users`);
    data.data.forEach(ghost => {
      console.log(`${ghost.username}: ${ghost.ghostScore}`);
    });
  })
  .catch(error => console.error('Error:', error));
```

```bash [cURL]
curl -X GET \
  'https://api.spywatcher.com/api/ghosts?guildId=123456789&minScore=10&limit=50' \
  -H 'Authorization: Bearer spy_live_your_api_key'
```

```go [Go]
package main

import (
    "encoding/json"
    "fmt"
    "io"
    "net/http"
)

type GhostResponse struct {
    Data []struct {
        Username    string  `json:"username"`
        GhostScore  float64 `json:"ghostScore"`
        PresenceCount int   `json:"presenceCount"`
        MessageCount  int   `json:"messageCount"`
    } `json:"data"`
    Meta struct {
        Total int `json:"total"`
    } `json:"meta"`
}

func main() {
    apiKey := "spy_live_your_api_key"
    guildId := "123456789"
    
    url := fmt.Sprintf("https://api.spywatcher.com/api/ghosts?guildId=%s&minScore=10", guildId)
    
    req, _ := http.NewRequest("GET", url, nil)
    req.Header.Add("Authorization", "Bearer "+apiKey)
    
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()
    
    body, _ := io.ReadAll(resp.Body)
    
    var result GhostResponse
    json.Unmarshal(body, &result)
    
    fmt.Printf("Found %d ghost users\n", result.Meta.Total)
    for _, ghost := range result.Data {
        fmt.Printf("%s: %.2f\n", ghost.Username, ghost.GhostScore)
    }
}
```

:::

## Run Ghost Detection Scan

Trigger a new ghost detection scan for a guild.

### Request

```http
POST /api/ghosts/scan
Authorization: Bearer {token}
Content-Type: application/json
```

### Body

```json
{
  "guildId": "123456789",
  "minPresenceCount": 30,
  "maxMessageCount": 10,
  "timeRange": {
    "start": "2024-01-01T00:00:00.000Z",
    "end": "2024-12-31T23:59:59.999Z"
  }
}
```

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `guildId` | string | Yes | Guild ID to scan |
| `minPresenceCount` | integer | No | Minimum presence threshold (default: 30) |
| `maxMessageCount` | integer | No | Maximum message threshold (default: 10) |
| `timeRange` | object | No | Date range for analysis |
| `timeRange.start` | string | No | Start date (ISO 8601) |
| `timeRange.end` | string | No | End date (ISO 8601) |

### Response

```json
{
  "data": {
    "scanId": "scan_abc123xyz",
    "guildId": "123456789",
    "status": "processing",
    "startedAt": "2024-11-03T12:00:00.000Z",
    "estimatedCompletion": "2024-11-03T12:05:00.000Z"
  }
}
```

### Check Scan Status

```http
GET /api/ghosts/scan/{scanId}
Authorization: Bearer {token}
```

**Response:**

```json
{
  "data": {
    "scanId": "scan_abc123xyz",
    "status": "completed",
    "resultsCount": 42,
    "completedAt": "2024-11-03T12:04:30.000Z",
    "results": "/api/ghosts?scanId=scan_abc123xyz"
  }
}
```

## Get User Ghost Details

Get detailed ghost analysis for a specific user.

### Request

```http
GET /api/ghosts/{userId}
Authorization: Bearer {token}
```

### Response

```json
{
  "data": {
    "userId": "123456789",
    "username": "SilentBob#1234",
    "ghostScore": 25.0,
    "presenceCount": 150,
    "messageCount": 5,
    "analysis": {
      "classification": "Strong Ghost",
      "riskLevel": "medium",
      "recommendations": [
        "Monitor for pattern changes",
        "Check if account is legitimate bot",
        "Review channel access history"
      ]
    },
    "timeline": [
      {
        "date": "2024-11-01",
        "presences": 15,
        "messages": 0
      },
      {
        "date": "2024-11-02",
        "presences": 18,
        "messages": 1
      }
    ],
    "patterns": {
      "peakHours": [9, 10, 11, 14, 15, 16],
      "activeChannels": ["#general", "#announcements"],
      "averageSessionDuration": 3600,
      "multiClientUsage": 0.3
    }
  }
}
```

## Webhooks

Subscribe to ghost detection events via webhooks:

### Events

- `ghost.detected` - New ghost user identified
- `ghost.score_changed` - Ghost score changed significantly
- `ghost.scan_completed` - Scan finished

### Example Webhook Payload

```json
{
  "event": "ghost.detected",
  "timestamp": "2024-11-03T12:00:00.000Z",
  "data": {
    "userId": "123456789",
    "username": "SilentBob#1234",
    "ghostScore": 25.0,
    "guildId": "987654321",
    "previousScore": null
  }
}
```

## Rate Limits

Ghost detection endpoints have specific rate limits:

| Endpoint | FREE | PRO | ENTERPRISE |
|----------|------|-----|------------|
| `GET /api/ghosts` | 10/hour | 100/hour | 1000/hour |
| `POST /api/ghosts/scan` | 1/day | 10/day | Unlimited |
| `GET /api/ghosts/{userId}` | 100/hour | 1000/hour | 10000/hour |

## Best Practices

### 1. Use Appropriate Thresholds

```typescript
// For active communities
const activeServerGhosts = await client.ghosts.list({
  minPresenceCount: 50,
  maxMessageCount: 5,
});

// For smaller communities
const smallServerGhosts = await client.ghosts.list({
  minPresenceCount: 20,
  maxMessageCount: 10,
});
```

### 2. Cache Results

```typescript
// Cache results for 1 hour
const cacheKey = `ghosts:${guildId}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const ghosts = await client.ghosts.list({ guildId });
await redis.setex(cacheKey, 3600, JSON.stringify(ghosts));
return ghosts;
```

### 3. Handle Pagination

```typescript
async function getAllGhosts(guildId: string) {
  const allGhosts = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await client.ghosts.list({
      guildId,
      page,
      limit: 100,
    });

    allGhosts.push(...response.data);
    hasMore = response.meta.hasNext;
    page++;
  }

  return allGhosts;
}
```

### 4. Use Filters Effectively

```typescript
// Get only high-risk ghosts
const highRiskGhosts = await client.ghosts.list({
  guildId,
  minScore: 25,
  sort: 'score',
  order: 'desc',
});

// Get recently active ghosts
const recentGhosts = await client.ghosts.list({
  guildId,
  minScore: 10,
  sort: 'lastSeen',
  order: 'desc',
});
```

## Related Endpoints

- **[Lurker Detection API](./lurkers)** - Similar detection for lurkers
- **[Suspicion Scores API](./suspicion)** - Comprehensive behavior analysis
- **[User Timeline API](./timeline)** - Individual user activity tracking
- **[Analytics API](./analytics)** - Server-wide analytics

## See Also

- **[Ghost Detection Guide](/guide/ghost-detection)** - User guide
- **[Understanding Ghost Scores](/guide/suspicion-scores)** - Score interpretation
- **[Best Practices](/guide/troubleshooting)** - Usage recommendations

---

::: tip Interactive Testing
Try the ghost detection API in our [Swagger UI](http://localhost:3001/api/docs) for interactive testing and exploration.
:::
