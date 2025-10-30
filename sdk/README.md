# @spywatcher/sdk

Official TypeScript/JavaScript SDK for the Discord Spywatcher API.

## Installation

```bash
npm install @spywatcher/sdk
```

or

```bash
yarn add @spywatcher/sdk
```

## Quick Start

```typescript
import { Spywatcher } from '@spywatcher/sdk';

// Initialize the client
const client = new Spywatcher({
  baseUrl: 'https://api.spywatcher.com',
  apiKey: 'spy_live_your_api_key_here',
  timeout: 30000, // optional, default: 30000ms
  debug: false, // optional, enable debug logging
});

// Use the API
try {
  // Get ghost users (inactive users)
  const ghosts = await client.analytics.getGhosts();
  console.log('Ghost users:', ghosts);

  // Get lurkers (low activity users)
  const lurkers = await client.analytics.getLurkers();
  console.log('Lurkers:', lurkers);

  // Get suspicion data
  const suspicions = await client.getSuspicionData();
  console.log('Suspicious users:', suspicions);
} catch (error) {
  if (error instanceof SpywatcherError) {
    console.error('API Error:', error.message, error.statusCode);
  }
}
```

## Authentication

The SDK uses API key authentication. You can generate an API key from the Spywatcher dashboard:

1. Log in to the Spywatcher dashboard
2. Navigate to Settings > API Keys
3. Click "Create New API Key"
4. Copy your API key (format: `spy_live_...`)

⚠️ **Keep your API key secure!** Never commit it to version control or expose it in client-side code.

## API Reference

### Configuration

```typescript
interface SpywatcherConfig {
  baseUrl: string;        // Base URL of the Spywatcher API
  apiKey: string;         // API key (format: spy_live_...)
  timeout?: number;       // Request timeout in ms (default: 30000)
  debug?: boolean;        // Enable debug logging (default: false)
  headers?: Record<string, string>; // Custom headers
}
```

### Analytics API

The Analytics API provides access to user analytics and behavioral data.

#### Get Ghost Users

```typescript
const ghosts = await client.analytics.getGhosts({
  guildId: 'optional-guild-id',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  page: 1,
  perPage: 50,
});
```

#### Get Lurkers

```typescript
const lurkers = await client.analytics.getLurkers({
  guildId: 'optional-guild-id',
});
```

#### Get Activity Heatmap

```typescript
const heatmap = await client.analytics.getHeatmap({
  guildId: 'optional-guild-id',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
});
```

#### Get Role Changes

```typescript
const roleChanges = await client.analytics.getRoleChanges({
  page: 1,
  perPage: 50,
});
```

#### Get Client Data

```typescript
const clients = await client.analytics.getClients();
```

#### Get Status Shifts

```typescript
const shifts = await client.analytics.getShifts();
```

### Suspicion API

#### Get Suspicion Data

```typescript
const suspicions = await client.getSuspicionData({
  guildId: 'optional-guild-id',
});
```

### Timeline API

#### Get Timeline Events

```typescript
const timeline = await client.getTimeline({
  page: 1,
  perPage: 50,
});
```

#### Get User Timeline

```typescript
const userTimeline = await client.getUserTimeline('user-id', {
  page: 1,
  perPage: 50,
});
```

### Bans API

#### Get Banned Guilds

```typescript
const bannedGuilds = await client.getBannedGuilds();
```

#### Ban a Guild

```typescript
await client.banGuild('guild-id', 'Reason for ban');
```

#### Unban a Guild

```typescript
await client.unbanGuild('guild-id');
```

#### Get Banned Users

```typescript
const bannedUsers = await client.getBannedUsers();
```

#### Ban a User

```typescript
await client.banUser('user-id', 'Reason for ban');
```

#### Unban a User

```typescript
await client.unbanUser('user-id');
```

### Auth & User API

#### Get Current User

```typescript
const user = await client.getCurrentUser();
```

#### Get API Keys

```typescript
const apiKeys = await client.getApiKeys();
```

#### Create API Key

```typescript
const newKey = await client.createApiKey('My API Key', ['read', 'write']);
console.log('New API key:', newKey.key); // Save this securely!
```

#### Revoke API Key

```typescript
await client.revokeApiKey('key-id');
```

### Health Check

```typescript
const health = await client.healthCheck();
console.log('API Status:', health.status);
```

## Error Handling

The SDK provides custom error classes for different types of errors:

```typescript
import {
  SpywatcherError,
  AuthenticationError,
  RateLimitError,
  ValidationError,
} from '@spywatcher/sdk';

try {
  const data = await client.analytics.getGhosts();
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Authentication failed:', error.message);
  } else if (error instanceof RateLimitError) {
    console.error('Rate limit exceeded:', error.message);
  } else if (error instanceof ValidationError) {
    console.error('Validation failed:', error.message);
  } else if (error instanceof SpywatcherError) {
    console.error('API error:', error.message, error.statusCode);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## TypeScript Support

The SDK is written in TypeScript and includes full type definitions. All API methods return strongly-typed data:

```typescript
import { Spywatcher, GhostUser, LurkerUser } from '@spywatcher/sdk';

const client = new Spywatcher({ /* ... */ });

// TypeScript knows the exact shape of the data
const ghosts: GhostUser[] = await client.analytics.getGhosts();
const lurkers: LurkerUser[] = await client.analytics.getLurkers();
```

## Rate Limiting

The Spywatcher API enforces rate limits to ensure fair usage:

- **Global**: 100 requests per 15 minutes
- **Analytics endpoints**: 30 requests per minute
- **Admin endpoints**: 100 requests per 15 minutes

The SDK will throw a `RateLimitError` when rate limits are exceeded. Implement exponential backoff or retry logic as needed:

```typescript
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof RateLimitError && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

// Usage
const ghosts = await fetchWithRetry(() => client.analytics.getGhosts());
```

## Examples

See the [examples](./examples) directory for complete example applications:

- [Basic Usage](./examples/basic-usage.ts) - Simple examples of common use cases
- [Advanced Analytics](./examples/advanced-analytics.ts) - Complex analytics queries
- [Error Handling](./examples/error-handling.ts) - Comprehensive error handling
- [Rate Limiting](./examples/rate-limiting.ts) - Handle rate limits gracefully

## License

MIT

## Support

- GitHub Issues: https://github.com/subculture-collective/discord-spywatcher/issues
- Documentation: https://github.com/subculture-collective/discord-spywatcher
