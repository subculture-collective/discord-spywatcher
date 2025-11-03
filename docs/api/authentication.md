# Authentication

Learn how to authenticate with the Spywatcher API.

## Authentication Methods

### JWT Bearer Token

The primary authentication method uses JWT bearer tokens.

#### Getting Your API Key

1. Sign in to Spywatcher dashboard
2. Navigate to **Settings** > **API Keys**
3. Click **Create New API Key**
4. Copy your key (starts with `spy_live_`)

#### Using Your Token

Include the token in the Authorization header:

```http
Authorization: Bearer spy_live_your_api_key_here
```

### OAuth2 (Coming Soon)

OAuth2 authentication for third-party applications.

## API Key Management

### Creating Keys

- Name your keys descriptively
- Create separate keys for different applications
- Use environment-specific keys

### Key Security

- Never commit keys to version control
- Rotate keys regularly
- Use environment variables
- Revoke compromised keys immediately

### Permissions

API keys can have limited permissions:
- Read-only access
- Write access
- Admin access

## Code Examples

::: code-group

```typescript [TypeScript]
const apiKey = process.env.SPYWATCHER_API_KEY;

const response = await fetch('https://api.spywatcher.com/api/analytics', {
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
});
```

```python [Python]
import os
import requests

api_key = os.getenv('SPYWATCHER_API_KEY')

response = requests.get(
    'https://api.spywatcher.com/api/analytics',
    headers={
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    }
)
```

```bash [cURL]
curl -H "Authorization: Bearer spy_live_your_api_key" \
     -H "Content-Type: application/json" \
     https://api.spywatcher.com/api/analytics
```

:::

## Error Responses

### 401 Unauthorized

**Cause**: Invalid or missing token

**Response**:
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token",
  "statusCode": 401
}
```

### 403 Forbidden

**Cause**: Valid token but insufficient permissions

**Response**:
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions for this resource",
  "statusCode": 403
}
```

## Related

- [API Reference](./index)
- [Rate Limiting](./rate-limiting)
- [Error Handling](./errors)

::: warning Security
Never expose API keys in client-side code or commit them to version control.
:::
