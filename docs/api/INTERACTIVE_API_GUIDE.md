# Interactive API Documentation Guide

Welcome to the Spywatcher API! This guide will help you get started with using our interactive API documentation portal.

## 📚 Available Documentation Interfaces

### 1. Swagger UI - Interactive Testing
**URL:** `http://localhost:3001/api/docs` (Development) or `https://api.spywatcher.dev/api/docs` (Production)

**Best for:**
- Testing API endpoints directly in your browser
- Experimenting with different request parameters
- Understanding request/response formats
- Quick prototyping and validation

**Features:**
- ✅ Try-it-out functionality
- ✅ Authentication support (Bearer token)
- ✅ Request/response examples
- ✅ Schema validation
- ✅ Real-time API testing

### 2. ReDoc - Clean Documentation
**URL:** `http://localhost:3001/api/redoc` (Development) or `https://api.spywatcher.dev/api/redoc` (Production)

**Best for:**
- Reading and understanding the API structure
- Searching for specific endpoints
- Print-friendly documentation
- Mobile-friendly viewing

**Features:**
- ✅ Clean, professional design
- ✅ Three-panel layout
- ✅ Deep linking
- ✅ Responsive design
- ✅ Easy navigation

### 3. OpenAPI JSON Specification
**URL:** `http://localhost:3001/api/openapi.json` (Development) or `https://api.spywatcher.dev/api/openapi.json` (Production)

**Best for:**
- Generating client SDKs
- Importing into API tools (Postman, Insomnia)
- Automated testing
- CI/CD integration

## 🚀 Getting Started

### Step 1: Authentication

Most endpoints require authentication. Here's how to get started:

1. **Direct users to Discord OAuth2:**
   ```
   https://discord.com/oauth2/authorize?client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&response_type=code&scope=identify%20guilds
   ```

2. **Handle the OAuth callback:**
   ```bash
   GET /api/auth/discord?code={AUTHORIZATION_CODE}
   ```

3. **Save the access token from the response:**
   ```json
   {
     "accessToken": "eyJhbGciOiJIUzI1NiIs...",
     "user": {
       "id": "uuid",
       "discordId": "123456789",
       "username": "User#1234"
     }
   }
   ```

4. **Use the token in subsequent requests:**
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
   ```

### Step 2: Try Your First Request

#### Using Swagger UI

1. Open `http://localhost:3001/api/docs` in your browser
2. Click the **"Authorize"** button at the top right
3. Enter your JWT token: `Bearer {your-token}`
4. Click **"Authorize"** and **"Close"**
5. Navigate to any endpoint (e.g., `/api/auth/me`)
6. Click **"Try it out"**
7. Click **"Execute"**
8. See the response!

#### Using cURL

```bash
curl -X GET "http://localhost:3001/api/auth/me" \
  -H "Authorization: Bearer {your-token}" \
  -H "Content-Type: application/json"
```

## 💡 Code Examples

### JavaScript/TypeScript (Fetch API)

```javascript
// Authenticate and get user info
async function getUserInfo() {
  const response = await fetch('http://localhost:3001/api/auth/me', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer your-jwt-token',
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  return data;
}

// Get ghost scores
async function getGhostScores(guildId) {
  const params = new URLSearchParams({
    guildId: guildId,
    page: '1',
    perPage: '20'
  });
  
  const response = await fetch(`http://localhost:3001/api/ghosts?${params}`, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer your-jwt-token',
      'Content-Type': 'application/json'
    }
  });
  
  return response.json();
}
```

### Python (requests)

```python
import requests

# Base configuration
BASE_URL = "http://localhost:3001/api"
TOKEN = "your-jwt-token"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

# Get user info
def get_user_info():
    response = requests.get(
        f"{BASE_URL}/auth/me",
        headers=headers
    )
    response.raise_for_status()
    return response.json()

# Get ghost scores
def get_ghost_scores(guild_id, page=1, per_page=20):
    params = {
        "guildId": guild_id,
        "page": page,
        "perPage": per_page
    }
    
    response = requests.get(
        f"{BASE_URL}/ghosts",
        headers=headers,
        params=params
    )
    response.raise_for_status()
    return response.json()

# Request account deletion
def request_deletion(reason=""):
    data = {"reason": reason}
    
    response = requests.post(
        f"{BASE_URL}/privacy/delete-request",
        headers=headers,
        json=data
    )
    response.raise_for_status()
    return response.json()
```

### Node.js (axios)

```javascript
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
const TOKEN = 'your-jwt-token';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Get user info
async function getUserInfo() {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

// Get ghost scores
async function getGhostScores(guildId, page = 1, perPage = 20) {
  try {
    const response = await api.get('/ghosts', {
      params: { guildId, page, perPage }
    });
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

// Export user data (GDPR)
async function exportUserData() {
  try {
    const response = await api.get('/privacy/export');
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}
```

### Go

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
)

const (
    BaseURL = "http://localhost:3001/api"
    Token   = "your-jwt-token"
)

type Client struct {
    httpClient *http.Client
    token      string
}

func NewClient(token string) *Client {
    return &Client{
        httpClient: &http.Client{},
        token:      token,
    }
}

func (c *Client) doRequest(method, path string, body interface{}) (*http.Response, error) {
    var bodyReader io.Reader
    if body != nil {
        jsonBody, err := json.Marshal(body)
        if err != nil {
            return nil, err
        }
        bodyReader = bytes.NewReader(jsonBody)
    }

    req, err := http.NewRequest(method, BaseURL+path, bodyReader)
    if err != nil {
        return nil, err
    }

    req.Header.Set("Authorization", "Bearer "+c.token)
    req.Header.Set("Content-Type", "application/json")

    return c.httpClient.Do(req)
}

// Get user info
func (c *Client) GetUserInfo() (map[string]interface{}, error) {
    resp, err := c.doRequest("GET", "/auth/me", nil)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    var result map[string]interface{}
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, err
    }

    return result, nil
}

// Get ghost scores
func (c *Client) GetGhostScores(guildID string, page, perPage int) (map[string]interface{}, error) {
    path := fmt.Sprintf("/ghosts?guildId=%s&page=%d&perPage=%d", guildID, page, perPage)
    resp, err := c.doRequest("GET", path, nil)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    var result map[string]interface{}
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, err
    }

    return result, nil
}
```

### Java (OkHttp)

```java
import okhttp3.*;
import org.json.JSONObject;
import java.io.IOException;

public class SpywatcherClient {
    private static final String BASE_URL = "http://localhost:3001/api";
    private final String token;
    private final OkHttpClient client;

    public SpywatcherClient(String token) {
        this.token = token;
        this.client = new OkHttpClient();
    }

    // Get user info
    public JSONObject getUserInfo() throws IOException {
        Request request = new Request.Builder()
            .url(BASE_URL + "/auth/me")
            .header("Authorization", "Bearer " + token)
            .header("Content-Type", "application/json")
            .get()
            .build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("Unexpected code " + response);
            }
            return new JSONObject(response.body().string());
        }
    }

    // Get ghost scores
    public JSONObject getGhostScores(String guildId, int page, int perPage) throws IOException {
        HttpUrl url = HttpUrl.parse(BASE_URL + "/ghosts").newBuilder()
            .addQueryParameter("guildId", guildId)
            .addQueryParameter("page", String.valueOf(page))
            .addQueryParameter("perPage", String.valueOf(perPage))
            .build();

        Request request = new Request.Builder()
            .url(url)
            .header("Authorization", "Bearer " + token)
            .header("Content-Type", "application/json")
            .get()
            .build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("Unexpected code " + response);
            }
            return new JSONObject(response.body().string());
        }
    }

    // Export user data
    public JSONObject exportUserData() throws IOException {
        Request request = new Request.Builder()
            .url(BASE_URL + "/privacy/export")
            .header("Authorization", "Bearer " + token)
            .header("Content-Type", "application/json")
            .get()
            .build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("Unexpected code " + response);
            }
            return new JSONObject(response.body().string());
        }
    }
}
```

## 🔐 Authentication Details

### JWT Bearer Token

All authenticated endpoints require a JWT Bearer token in the Authorization header:

```
Authorization: Bearer {your-jwt-token}
```

### Token Lifespan

- **Access Token:** Valid for 15 minutes
- **Refresh Token:** Valid for 7 days

### Refreshing Tokens

When your access token expires, use the refresh endpoint:

```bash
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

Response:
```json
{
  "accessToken": "new-access-token",
  "refreshToken": "new-refresh-token"
}
```

## ⚡ Rate Limiting

The API implements multiple rate limiting tiers to ensure stability and fair usage:

### Rate Limit Tiers

| Tier | Endpoints | Limit | Window |
|------|-----------|-------|--------|
| **Global** | All `/api/*` routes | 100 requests | 15 minutes |
| **Analytics** | Analytics endpoints | 30 requests | 1 minute |
| **Authentication** | Auth endpoints | Custom limits | Varies |
| **Public API** | Public routes | 60 requests | 1 minute |
| **Admin** | Admin routes | 100 requests | 15 minutes |

### Rate Limit Headers

All responses include rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699999999
```

### Handling Rate Limits

When you exceed the rate limit, you'll receive a `429 Too Many Requests` response:

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded"
}
```

The response includes a `Retry-After` header indicating when you can retry:

```
Retry-After: 60
```

**Best Practices:**
1. Monitor `X-RateLimit-Remaining` header
2. Implement exponential backoff
3. Cache responses when possible
4. Use webhooks instead of polling
5. Respect `Retry-After` header

## 📊 Common Endpoints

### Authentication

- `GET /api/auth/discord?code={code}` - Discord OAuth callback
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/sessions` - List sessions
- `DELETE /api/auth/sessions/{sessionId}` - Revoke session

### Analytics

- `GET /api/ghosts` - Ghost scores
- `GET /api/heatmap` - Channel activity heatmap
- `GET /api/lurkers` - Lurker detection
- `GET /api/roles` - Role drift analysis
- `GET /api/clients` - Client usage patterns
- `GET /api/shifts` - Behavior shift detection

### Privacy (GDPR Compliance)

- `GET /api/privacy/export` - Export all user data
- `POST /api/privacy/delete-request` - Request account deletion
- `POST /api/privacy/cancel-deletion` - Cancel deletion request
- `GET /api/privacy/deletion-status` - Check deletion status
- `PATCH /api/privacy/profile` - Update profile

### Plugins (Admin Only)

- `GET /api/plugins` - List all plugins
- `GET /api/plugins/{id}` - Get plugin details
- `GET /api/plugins/{id}/health` - Plugin health status
- `POST /api/plugins/{id}/start` - Start plugin
- `POST /api/plugins/{id}/stop` - Stop plugin
- `DELETE /api/plugins/{id}` - Unload plugin

### System Status

- `GET /api/status` - System status
- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe

## 🛠️ Generating Client SDKs

You can auto-generate client libraries from the OpenAPI specification:

### Using OpenAPI Generator

```bash
# Install OpenAPI Generator
npm install @openapitools/openapi-generator-cli -g

# Generate TypeScript client
openapi-generator-cli generate \
  -i http://localhost:3001/api/openapi.json \
  -g typescript-fetch \
  -o ./generated-client

# Generate Python client
openapi-generator-cli generate \
  -i http://localhost:3001/api/openapi.json \
  -g python \
  -o ./generated-client

# Generate Java client
openapi-generator-cli generate \
  -i http://localhost:3001/api/openapi.json \
  -g java \
  -o ./generated-client

# Generate Go client
openapi-generator-cli generate \
  -i http://localhost:3001/api/openapi.json \
  -g go \
  -o ./generated-client
```

### Supported Languages

OpenAPI Generator supports 50+ languages including:
- TypeScript/JavaScript
- Python
- Java
- Go
- C#
- Ruby
- PHP
- Swift
- Kotlin
- Rust
- And many more!

## 📱 Importing to API Tools

### Postman

1. Open Postman
2. Click **"Import"**
3. Select **"Link"** tab
4. Enter: `http://localhost:3001/api/openapi.json`
5. Click **"Continue"** then **"Import"**

### Insomnia

1. Open Insomnia
2. Click **"Create"** → **"Import From"** → **"URL"**
3. Enter: `http://localhost:3001/api/openapi.json`
4. Click **"Fetch and Import"**

### VS Code REST Client

Create a file with `.http` extension:

```http
@baseUrl = http://localhost:3001/api
@token = your-jwt-token

### Get user info
GET {{baseUrl}}/auth/me
Authorization: Bearer {{token}}

### Get ghost scores
GET {{baseUrl}}/ghosts?guildId=123456&page=1&perPage=20
Authorization: Bearer {{token}}

### Export user data
GET {{baseUrl}}/privacy/export
Authorization: Bearer {{token}}
```

## ❓ Common Issues & Solutions

### Issue: 401 Unauthorized

**Cause:** Missing or invalid authentication token

**Solution:**
1. Ensure you've included the Authorization header
2. Check token format: `Bearer {token}`
3. Verify token hasn't expired
4. Use refresh endpoint to get a new token

### Issue: 429 Too Many Requests

**Cause:** Rate limit exceeded

**Solution:**
1. Check `Retry-After` header
2. Implement exponential backoff
3. Reduce request frequency
4. Consider caching responses

### Issue: 403 Forbidden

**Cause:** Insufficient permissions

**Solution:**
1. Verify your user role
2. Check if endpoint requires admin access
3. Contact support for elevated permissions

### Issue: 404 Not Found

**Cause:** Resource doesn't exist or incorrect URL

**Solution:**
1. Verify the endpoint URL
2. Check if resource ID is correct
3. Ensure resource hasn't been deleted

## 📞 Support

- **Documentation:** [GitHub Repository](https://github.com/subculture-collective/discord-spywatcher)
- **Issues:** [GitHub Issues](https://github.com/subculture-collective/discord-spywatcher/issues)
- **Email:** support@spywatcher.dev

## 📝 Additional Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [ReDoc Documentation](https://redocly.com/redoc/)
- [OAuth 2.0 Guide](https://oauth.net/2/)
- [Discord OAuth2 Documentation](https://discord.com/developers/docs/topics/oauth2)
