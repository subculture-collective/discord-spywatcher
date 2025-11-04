# WebSocket API Documentation

## Overview

The Discord SpyWatcher WebSocket API provides real-time updates for analytics, Discord events, and notifications. It uses Socket.io for reliable bidirectional communication with support for automatic reconnection and room-based broadcasting.

## Connection

### Endpoint

```
ws://localhost:3001 (development)
wss://your-domain.com (production)
```

### Authentication

All WebSocket connections require JWT authentication. Include your access token in the connection handshake:

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
    auth: {
        token: 'your-jwt-access-token',
    },
    transports: ['websocket', 'polling'],
});
```

### Connection Events

#### `connect`

Fired when the client successfully connects to the server.

```typescript
socket.on('connect', () => {
    console.log('Connected to WebSocket server');
});
```

#### `disconnect`

Fired when the client disconnects from the server.

```typescript
socket.on('disconnect', (reason) => {
    console.log('Disconnected:', reason);
});
```

#### `connect_error`

Fired when a connection error occurs (e.g., authentication failure).

```typescript
socket.on('connect_error', (error) => {
    console.error('Connection error:', error.message);
});
```

## Room Subscriptions

### Analytics Room

Subscribe to receive throttled analytics updates for a specific guild.

#### Subscribe

```typescript
socket.emit('subscribe:analytics', guildId);
```

**Parameters:**

- `guildId` (string): The Discord guild ID to subscribe to

#### Unsubscribe

```typescript
socket.emit('unsubscribe:analytics', guildId);
```

**Parameters:**

- `guildId` (string): The Discord guild ID to unsubscribe from

### Guild Events Room

Subscribe to receive real-time guild events (messages, joins, roles, etc.).

#### Subscribe

```typescript
socket.emit('subscribe:guild', guildId);
```

**Parameters:**

- `guildId` (string): The Discord guild ID to subscribe to

#### Unsubscribe

```typescript
socket.emit('unsubscribe:guild', guildId);
```

**Parameters:**

- `guildId` (string): The Discord guild ID to unsubscribe from

## Server Events

### Analytics Events

#### `analytics:update`

Receives throttled analytics updates (maximum once per 30 seconds per guild).

**Event Data:**

```typescript
{
    guildId: string;
    data: {
        ghosts: Array<{
            userId: string;
            username: string;
            ghostScore: number;
        }>;
        lurkers: Array<{
            userId: string;
            username: string;
            lurkerScore: number;
            channelCount: number;
        }>;
        channelDiversity: Array<{
            userId: string;
            username: string;
            channelCount: number;
        }>;
        timestamp: string;
    }
    timestamp: string;
}
```

**Example:**

```typescript
socket.on('analytics:update', (data) => {
    console.log('Analytics update:', data);
    // Update your dashboard with new analytics
});
```

### Guild Events

#### `message:new`

Receives real-time notifications when a new message is created in the guild.

**Event Data:**

```typescript
{
    userId: string;
    username: string;
    channelId: string;
    channelName: string;
    timestamp: string; // ISO 8601 format
}
```

**Example:**

```typescript
socket.on('message:new', (data) => {
    console.log(`New message from ${data.username} in #${data.channelName}`);
});
```

#### `alert:multiClient`

Receives alerts when a user is detected on multiple clients simultaneously.

**Event Data:**

```typescript
{
  userId: string;
  username: string;
  platforms: string[]; // e.g., ['desktop', 'mobile', 'web']
  timestamp: string; // ISO 8601 format
}
```

**Example:**

```typescript
socket.on('alert:multiClient', (data) => {
    console.warn(
        `Multi-client detected: ${data.username} on ${data.platforms.join(', ')}`
    );
});
```

#### `presence:update`

Receives real-time presence updates for guild members.

**Event Data:**

```typescript
{
    userId: string;
    username: string;
    status: string; // 'online', 'idle', 'dnd', 'offline'
    timestamp: string; // ISO 8601 format
}
```

**Example:**

```typescript
socket.on('presence:update', (data) => {
    console.log(`${data.username} is now ${data.status}`);
});
```

#### `role:change`

Receives notifications when a user's roles change in the guild.

**Event Data:**

```typescript
{
  userId: string;
  username: string;
  addedRoles: string[]; // Array of role names that were added
  timestamp: string; // ISO 8601 format
}
```

**Example:**

```typescript
socket.on('role:change', (data) => {
    console.log(`${data.username} gained roles: ${data.addedRoles.join(', ')}`);
});
```

#### `user:join`

Receives notifications when a new user joins the guild.

**Event Data:**

```typescript
{
    userId: string;
    username: string;
    accountAgeDays: number; // Age of the Discord account in days
    timestamp: string; // ISO 8601 format
}
```

**Example:**

```typescript
socket.on('user:join', (data) => {
    console.log(
        `${data.username} joined (account age: ${data.accountAgeDays} days)`
    );
});
```

## Error Handling

### `error`

Receives error messages from the server.

**Event Data:**

```typescript
{
    message: string;
}
```

**Example:**

```typescript
socket.on('error', (data) => {
    console.error('Server error:', data.message);
});
```

## Best Practices

### Connection Management

1. **Singleton Pattern**: Use a single WebSocket connection per application instance
2. **Reconnection**: Socket.io handles reconnection automatically
3. **Cleanup**: Always disconnect when unmounting components or closing the application

```typescript
// React example
useEffect(() => {
    const socket = socketService.connect();

    return () => {
        socketService.disconnect();
    };
}, []);
```

### Room Subscriptions

1. **Subscribe on mount**: Subscribe to rooms when components mount
2. **Unsubscribe on unmount**: Clean up subscriptions to prevent memory leaks
3. **Handle multiple guilds**: Subscribe to multiple guilds as needed

```typescript
useEffect(() => {
    socketService.subscribeToGuild(guildId);
    socketService.subscribeToAnalytics(guildId, handleAnalyticsUpdate);

    return () => {
        socketService.unsubscribeFromGuild(guildId);
        socketService.unsubscribeFromAnalytics(guildId, handleAnalyticsUpdate);
    };
}, [guildId]);
```

### Event Listeners

1. **Remove listeners**: Always remove event listeners when no longer needed
2. **Avoid duplicates**: Check if a listener is already attached before adding
3. **Use specific handlers**: Create separate handler functions for better control

```typescript
// Good practice
const handleNewMessage = (data) => {
    console.log('New message:', data);
};

socket.on('message:new', handleNewMessage);

// Cleanup
socket.off('message:new', handleNewMessage);
```

## Performance Considerations

### Throttling

Analytics updates are throttled to once per 30 seconds per guild to prevent overwhelming clients with data. This is handled automatically on the server side.

### Connection Pooling

The server uses a Redis adapter for horizontal scaling, allowing multiple server instances to share WebSocket connections.

### Resource Management

- Maximum connections per IP: Configured via rate limiting
- Heartbeat interval: 25 seconds
- Ping timeout: 60 seconds

## Example Implementation

### Frontend Service (TypeScript)

```typescript
import { io, Socket } from 'socket.io-client';

class SocketService {
    private socket: Socket | null = null;

    connect(token: string): Socket {
        if (this.socket?.connected) {
            return this.socket;
        }

        this.socket = io('http://localhost:3001', {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        this.socket.on('connect', () => {
            console.log('WebSocket connected');
        });

        this.socket.on('disconnect', () => {
            console.log('WebSocket disconnected');
        });

        return this.socket;
    }

    subscribeToAnalytics(guildId: string, callback: (data: any) => void) {
        if (!this.socket) return;

        this.socket.emit('subscribe:analytics', guildId);
        this.socket.on('analytics:update', callback);
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export const socketService = new SocketService();
```

### React Component Example

```typescript
import { useEffect, useState } from 'react';
import { socketService } from './socketService';
import toast from 'react-hot-toast';

export function LiveAnalyticsDashboard({ guildId, token }) {
  const [analytics, setAnalytics] = useState(null);
  const [recentMessages, setRecentMessages] = useState([]);

  useEffect(() => {
    // Connect to WebSocket
    const socket = socketService.connect(token);

    // Subscribe to analytics
    socketService.subscribeToAnalytics(guildId, (data) => {
      setAnalytics(data);
    });

    // Subscribe to guild events
    socket.emit('subscribe:guild', guildId);

    // Listen for new messages
    socket.on('message:new', (message) => {
      setRecentMessages(prev => [message, ...prev].slice(0, 50));
    });

    // Listen for multi-client alerts
    socket.on('alert:multiClient', (alert) => {
      toast.warning(`Multi-client detected: ${alert.username}`);
    });

    // Cleanup
    return () => {
      socket.emit('unsubscribe:guild', guildId);
      socketService.disconnect();
    };
  }, [guildId, token]);

  return (
    <div>
      <h2>Live Analytics</h2>
      {analytics && (
        <div>
          <h3>Ghost Users</h3>
          <ul>
            {analytics.data.ghosts.map(ghost => (
              <li key={ghost.userId}>
                {ghost.username}: {ghost.ghostScore}
              </li>
            ))}
          </ul>
        </div>
      )}

      <h3>Recent Messages</h3>
      <ul>
        {recentMessages.map((msg, i) => (
          <li key={i}>
            {msg.username} in #{msg.channelName}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Security

### Authentication

- All connections require a valid JWT access token
- Tokens are verified using the server's JWT secret
- Invalid tokens result in immediate connection rejection

### Authorization

- Users can only access data for guilds they have permission to view
- Room subscriptions are validated against user permissions
- Sensitive data is sanitized before transmission

### Rate Limiting

- Connection attempts are rate-limited per IP address
- Event emissions are throttled to prevent abuse
- Excessive reconnection attempts are blocked

## Troubleshooting

### Common Issues

#### Connection Refused

- Verify the WebSocket server is running
- Check that the port (3001) is not blocked by firewall
- Ensure CORS settings allow your origin

#### Authentication Failed

- Verify your JWT token is valid and not expired
- Check that the token includes required fields (discordId, access, role)
- Ensure the token is passed in the auth object during connection

#### Events Not Received

- Confirm you've subscribed to the correct room
- Check that event listeners are attached before events fire
- Verify the guild ID is correct

#### Multiple Connections

- Use a singleton pattern to ensure only one connection
- Check for duplicate connection attempts in your code
- Implement proper cleanup in component unmount

## Support

For issues, questions, or feature requests, please open an issue on the GitHub repository.

## Related Documentation

- [Socket.io Documentation](https://socket.io/docs/v4/)
- [Discord API Documentation](https://discord.com/developers/docs)
- [Project README](./README.md)
