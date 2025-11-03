# Spywatcher API Documentation

Welcome to the Spywatcher API documentation! This comprehensive guide will help you integrate with the Discord Spywatcher analytics and monitoring platform.

## 📖 Documentation Structure

### Quick Start Guides

1. **[Interactive API Guide](./INTERACTIVE_API_GUIDE.md)** 🚀
   - Getting started with the API
   - Code examples in 6+ languages (JavaScript, Python, Node.js, Go, Java, etc.)
   - Common use cases and patterns
   - Best practices and tips

2. **[Authentication Guide](./AUTHENTICATION_GUIDE.md)** 🔐
   - Discord OAuth2 setup and flow
   - JWT token management
   - Session handling
   - Security best practices

3. **[Rate Limiting Guide](./RATE_LIMITING_GUIDE.md)** ⚡
   - Understanding rate limits
   - Handling rate limit errors
   - Best practices for optimization
   - Subscription tier limits

## 🌐 Interactive Documentation Portals

### Swagger UI - Try It Out!

**URL:** `http://localhost:3001/api/docs` (Development)  
**URL:** `https://api.spywatcher.dev/api/docs` (Production)

The most interactive way to explore the API! Features:
- ✅ **Try It Out** - Test endpoints directly in your browser
- ✅ Authentication support with JWT Bearer tokens
- ✅ Request/response examples with validation
- ✅ Auto-complete for parameters
- ✅ Real-time API testing

**Perfect for:**
- Testing API endpoints
- Understanding request/response formats
- Prototyping integrations
- Debugging API calls

### ReDoc - Clean Documentation

**URL:** `http://localhost:3001/api/redoc` (Development)  
**URL:** `https://api.spywatcher.dev/api/redoc` (Production)

A clean, professional documentation view. Features:
- ✅ Three-panel layout for easy navigation
- ✅ Deep linking to specific endpoints
- ✅ Mobile-friendly responsive design
- ✅ Print-friendly format
- ✅ Search functionality

**Perfect for:**
- Reading API documentation
- Understanding the API structure
- Sharing with team members
- Reference documentation

### OpenAPI Specification

**URL:** `http://localhost:3001/api/openapi.json` (Development)  
**URL:** `https://api.spywatcher.dev/api/openapi.json` (Production)

The raw OpenAPI 3.0 specification in JSON format.

**Perfect for:**
- Generating client SDKs
- Importing into Postman/Insomnia
- Automated testing
- CI/CD integration

## 🚀 Quick Start

### 1. Get Your Credentials

1. Create a Discord application at [Discord Developer Portal](https://discord.com/developers/applications)
2. Note your Client ID and Client Secret
3. Add redirect URI: `http://localhost:5173/auth/callback`

### 2. Authenticate

```javascript
// Redirect user to Discord OAuth2
const authUrl = `https://discord.com/oauth2/authorize?` +
  `client_id=${CLIENT_ID}&` +
  `redirect_uri=${REDIRECT_URI}&` +
  `response_type=code&` +
  `scope=identify%20guilds`;

window.location.href = authUrl;

// Handle callback
const code = new URLSearchParams(window.location.search).get('code');
const response = await fetch(`http://localhost:3001/api/auth/discord?code=${code}`);
const { accessToken } = await response.json();
```

### 3. Make Your First Request

```javascript
const response = await fetch('http://localhost:3001/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});

const user = await response.json();
console.log('Authenticated user:', user);
```

## 📚 API Categories

### Authentication
- Discord OAuth2 authentication
- JWT token management
- Session handling
- User profile management

**Key Endpoints:**
- `GET /api/auth/discord` - OAuth callback
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

[View Auth Endpoints in Swagger UI →](http://localhost:3001/api/docs#/Authentication)

### Analytics
- Ghost user detection
- Lurker analysis
- Activity heatmaps
- Behavior patterns
- Role drift analysis

**Key Endpoints:**
- `GET /api/ghosts` - Ghost scores
- `GET /api/heatmap` - Channel activity
- `GET /api/lurkers` - Lurker detection
- `GET /api/shifts` - Behavior shifts

[View Analytics Endpoints in Swagger UI →](http://localhost:3001/api/docs#/Analytics)

### Privacy & GDPR
- Data export (Right to Access)
- Account deletion (Right to Erasure)
- Profile updates (Right to Rectification)
- Consent management
- Audit logs

**Key Endpoints:**
- `GET /api/privacy/export` - Export user data
- `POST /api/privacy/delete-request` - Request deletion
- `GET /api/privacy/deletion-status` - Check status
- `PATCH /api/privacy/profile` - Update profile

[View Privacy Endpoints in Swagger UI →](http://localhost:3001/api/docs#/Privacy)

### Plugins
- Plugin management
- Health monitoring
- Configuration
- Lifecycle control

**Key Endpoints:**
- `GET /api/plugins` - List plugins
- `GET /api/plugins/{id}` - Plugin details
- `POST /api/plugins/{id}/start` - Start plugin
- `POST /api/plugins/{id}/stop` - Stop plugin

[View Plugin Endpoints in Swagger UI →](http://localhost:3001/api/docs#/Plugins)

### Admin
- User management
- System monitoring
- Quota management
- Audit logs
- IP management

**Key Endpoints:**
- `GET /api/admin/privacy/audit-logs` - Audit logs
- `GET /api/quota/usage` - Quota usage
- `GET /api/metrics/summary` - Metrics summary

[View Admin Endpoints in Swagger UI →](http://localhost:3001/api/docs#/Admin)

## 💡 Code Examples

### JavaScript/TypeScript

```javascript
// Using Fetch API
const api = {
  baseUrl: 'http://localhost:3001/api',
  token: 'your-jwt-token',
  
  async get(endpoint) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  },
  
  async post(endpoint, data) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }
};

// Get user info
const user = await api.get('/auth/me');

// Get ghost scores
const ghosts = await api.get('/ghosts?guildId=123456');

// Export user data
const exportData = await api.get('/privacy/export');
```

### Python

```python
import requests

class SpywatcherAPI:
    def __init__(self, token):
        self.base_url = "http://localhost:3001/api"
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    
    def get(self, endpoint, params=None):
        response = requests.get(
            f"{self.base_url}{endpoint}",
            headers=self.headers,
            params=params
        )
        response.raise_for_status()
        return response.json()
    
    def post(self, endpoint, data=None):
        response = requests.post(
            f"{self.base_url}{endpoint}",
            headers=self.headers,
            json=data
        )
        response.raise_for_status()
        return response.json()

# Initialize client
api = SpywatcherAPI("your-jwt-token")

# Get user info
user = api.get("/auth/me")

# Get ghost scores
ghosts = api.get("/ghosts", params={"guildId": "123456"})

# Export user data
export_data = api.get("/privacy/export")
```

See [Interactive API Guide](./INTERACTIVE_API_GUIDE.md) for examples in Go, Java, Node.js, and more!

## 🔐 Authentication

The API uses Discord OAuth2 for authentication and JWT Bearer tokens for authorization:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token Lifespan:**
- Access Token: 15 minutes
- Refresh Token: 7 days

See the [Authentication Guide](./AUTHENTICATION_GUIDE.md) for detailed setup instructions.

## ⚡ Rate Limiting

The API implements multiple rate limiting tiers:

| Tier | Limit | Window |
|------|-------|--------|
| Global API | 100 requests | 15 minutes |
| Analytics | 30 requests | 1 minute |
| Authentication | 5 attempts | 15 minutes |
| Public API | 60 requests | 1 minute |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699999999
```

See the [Rate Limiting Guide](./RATE_LIMITING_GUIDE.md) for best practices and handling.

## 🛠️ SDKs and Tools

### Generate Client SDKs

Use OpenAPI Generator to create client libraries:

```bash
# TypeScript
openapi-generator-cli generate \
  -i http://localhost:3001/api/openapi.json \
  -g typescript-fetch \
  -o ./client

# Python
openapi-generator-cli generate \
  -i http://localhost:3001/api/openapi.json \
  -g python \
  -o ./client

# Go
openapi-generator-cli generate \
  -i http://localhost:3001/api/openapi.json \
  -g go \
  -o ./client

# Java
openapi-generator-cli generate \
  -i http://localhost:3001/api/openapi.json \
  -g java \
  -o ./client
```

### Import to API Tools

**Postman:**
1. Open Postman → Import
2. Select "Link"
3. Enter: `http://localhost:3001/api/openapi.json`
4. Click "Import"

**Insomnia:**
1. Open Insomnia → Create → Import From → URL
2. Enter: `http://localhost:3001/api/openapi.json`
3. Click "Fetch and Import"

## 📊 Response Formats

All responses follow consistent formats:

### Success Response

```json
{
  "data": { ... },
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error Response

```json
{
  "error": "Error Type",
  "message": "Detailed error message",
  "details": {
    "field": "Additional context"
  }
}
```

### Common HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Successful request |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing/invalid auth |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily down |

## 🔍 Searching and Filtering

Many endpoints support query parameters for filtering:

```javascript
// Pagination
GET /api/ghosts?page=1&perPage=20

// Guild filtering
GET /api/ghosts?guildId=123456789

// Date filtering
GET /api/analytics/summary?startDate=2024-01-01&endDate=2024-12-31

// Sorting
GET /api/users?sortBy=createdAt&order=desc

// Multiple filters
GET /api/ghosts?guildId=123456&page=2&perPage=50&filterBanned=true
```

## 🚨 Error Handling

Always implement proper error handling:

```javascript
async function makeRequest(endpoint) {
  try {
    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      if (response.status === 429) {
        // Handle rate limit
        const retryAfter = response.headers.get('Retry-After');
        console.log(`Rate limited. Retry after ${retryAfter}s`);
      } else if (response.status === 401) {
        // Handle unauthorized - refresh token
        await refreshToken();
      } else {
        // Handle other errors
        const error = await response.json();
        console.error('API Error:', error);
      }
    }
    
    return response.json();
  } catch (error) {
    console.error('Network Error:', error);
    throw error;
  }
}
```

## 🎯 Best Practices

1. **Cache Responses** - Reduce API calls by caching data
2. **Use Webhooks** - Instead of polling for updates
3. **Batch Requests** - Combine related requests when possible
4. **Implement Backoff** - Use exponential backoff for retries
5. **Monitor Rate Limits** - Check headers and plan accordingly
6. **Handle Errors** - Implement proper error handling
7. **Secure Tokens** - Store tokens securely, never in code
8. **Use HTTPS** - Always use HTTPS in production

## 📱 WebSocket API

For real-time updates, use the WebSocket connection:

```javascript
const ws = new WebSocket('ws://localhost:3001');

ws.onopen = () => {
  console.log('WebSocket connected');
  
  // Authenticate
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'your-jwt-token'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Update received:', data);
};
```

See [WEBSOCKET_API.md](../../WEBSOCKET_API.md) for full WebSocket documentation.

## 🧪 Testing

### Manual Testing

Use Swagger UI at `http://localhost:3001/api/docs`:
1. Click "Authorize"
2. Enter: `Bearer {your-token}`
3. Try any endpoint with "Try it out"

### Automated Testing

```bash
# Using curl
curl -X GET "http://localhost:3001/api/auth/me" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Using httpie
http GET http://localhost:3001/api/auth/me \
  Authorization:"Bearer YOUR_TOKEN"
```

## 📞 Support

### Documentation Resources
- [Interactive API Guide](./INTERACTIVE_API_GUIDE.md)
- [Authentication Guide](./AUTHENTICATION_GUIDE.md)
- [Rate Limiting Guide](./RATE_LIMITING_GUIDE.md)
- [Main Documentation](../)

### Get Help
- **GitHub Issues:** [Report bugs or request features](https://github.com/subculture-collective/discord-spywatcher/issues)
- **Email:** support@spywatcher.dev
- **Documentation:** This repository

### Contributing
Contributions are welcome! See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## 📝 Additional Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [Discord OAuth2 Docs](https://discord.com/developers/docs/topics/oauth2)
- [JWT.io](https://jwt.io/) - JWT Debugger
- [Postman](https://www.postman.com/)
- [Insomnia](https://insomnia.rest/)

## 📄 License

MIT License - See [LICENSE](../../LICENSE) for details.

---

**Ready to get started?** Visit [Interactive API Guide](./INTERACTIVE_API_GUIDE.md) for step-by-step instructions!
