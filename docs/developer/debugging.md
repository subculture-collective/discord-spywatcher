# Debugging Guide

Comprehensive guide to debugging Spywatcher applications effectively.

## Debugging Tools

### VS Code Debugger

The recommended way to debug Spywatcher.

#### Backend API Debugging

**Configuration (.vscode/launch.json):**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend API",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev:api"],
      "cwd": "${workspaceFolder}/backend",
      "skipFiles": ["<node_internals>/**"],
      "console": "integratedTerminal",
      "env": {
        "NODE_ENV": "development"
      }
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Discord Bot",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "cwd": "${workspaceFolder}/backend",
      "skipFiles": ["<node_internals>/**"],
      "console": "integratedTerminal"
    }
  ]
}
```

**Usage:**
1. Set breakpoints in your code
2. Press `F5` or go to Run & Debug
3. Select "Debug Backend API"
4. Debug with full IDE integration

#### Frontend Debugging

**Configuration:**

```json
{
  "type": "chrome",
  "request": "launch",
  "name": "Debug Frontend",
  "url": "http://localhost:5173",
  "webRoot": "${workspaceFolder}/frontend/src",
  "sourceMapPathOverrides": {
    "webpack:///src/*": "${webRoot}/*"
  }
}
```

**Usage:**
1. Start frontend: `npm run dev`
2. Press `F5` to launch Chrome with debugger
3. Set breakpoints in VS Code
4. Breakpoints hit in both browser and VS Code

### Chrome DevTools

For frontend debugging in the browser.

#### Opening DevTools

- **Windows/Linux**: `Ctrl + Shift + I` or `F12`
- **macOS**: `Cmd + Option + I`

#### Key Panels

**Console:**
- View logs, errors, warnings
- Execute JavaScript
- Inspect variables

```javascript
// In console
localStorage.getItem('auth_token')
JSON.parse(localStorage.getItem('user'))
```

**Sources:**
- Set breakpoints
- Step through code
- Inspect call stack
- Watch variables

**Network:**
- Monitor API requests
- Check request/response headers
- Verify payloads
- Measure timing

**Application:**
- Inspect localStorage
- View cookies
- Check session storage
- Manage service workers

**Performance:**
- Profile rendering
- Identify bottlenecks
- Analyze frame rates

### Node.js Inspector

For debugging without VS Code.

#### Starting with Inspector

```bash
# Backend API
cd backend
node --inspect src/server.ts

# Or with break on first line
node --inspect-brk src/server.ts
```

#### Connecting

1. Open Chrome
2. Navigate to `chrome://inspect`
3. Click "inspect" under your process
4. Chrome DevTools opens with full debugging

### React DevTools

Essential for React debugging.

#### Installation

**Browser Extension:**
- [Chrome](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- [Firefox](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)

**Standalone:**
```bash
npm install -g react-devtools
react-devtools
```

#### Features

**Components Tab:**
- Inspect component tree
- View props and state
- Edit values in real-time
- Find component by DOM element

**Profiler Tab:**
- Record performance
- Identify slow renders
- Analyze component lifecycle
- Optimize re-renders

## Debugging Techniques

### Console Logging

#### Strategic Logging

```typescript
// ✅ Good - Structured logging
console.log('[UserService] Fetching user:', { userId, timestamp: Date.now() });

// ❌ Bad - Unclear logging
console.log(userId);
```

#### Using Debug Library

```typescript
import debug from 'debug';

const log = debug('app:analytics');
const error = debug('app:analytics:error');

log('Calculating ghost score for user %s', userId);
error('Failed to fetch presence data', err);
```

**Enable debug output:**
```bash
# All debug logs
DEBUG=* npm run dev

# Specific namespace
DEBUG=app:analytics npm run dev

# Multiple namespaces
DEBUG=app:analytics,app:auth npm run dev
```

### Breakpoint Debugging

#### Setting Breakpoints

**In Code:**
```typescript
function calculateGhostScore(presenceCount: number, messageCount: number) {
    debugger; // Execution pauses here
    return (presenceCount - messageCount) / presenceCount * 100;
}
```

**In VS Code:**
- Click left of line number
- Red dot appears
- Execution pauses when hit

**Conditional Breakpoints:**
```typescript
// Right-click breakpoint in VS Code
// Add condition: userId === 'specific-user-id'
```

#### Stepping Through Code

- **F10 (Step Over)**: Execute current line
- **F11 (Step Into)**: Enter function call
- **Shift + F11 (Step Out)**: Exit current function
- **F5 (Continue)**: Run to next breakpoint

### Logging Best Practices

#### Backend Logging

```typescript
import winston from 'winston';

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
    ],
});

// Usage
logger.info('User logged in', { userId, ip });
logger.error('Database query failed', { query, error });
logger.debug('Cache hit', { key, ttl });
```

#### Frontend Logging

```typescript
// Custom logger with levels
const logger = {
    debug: (...args: any[]) => {
        if (import.meta.env.DEV) {
            console.log('[DEBUG]', ...args);
        }
    },
    info: (...args: any[]) => {
        console.info('[INFO]', ...args);
    },
    error: (...args: any[]) => {
        console.error('[ERROR]', ...args);
        // Send to error tracking
        Sentry.captureException(args[0]);
    },
};

// Usage
logger.debug('Rendering UserCard', { userId });
logger.error('API request failed', error);
```

## Debugging Common Scenarios

### API Request Debugging

#### Backend - Logging Requests

```typescript
// Middleware to log all requests
app.use((req, res, next) => {
    console.log({
        method: req.method,
        url: req.url,
        params: req.params,
        query: req.query,
        body: req.body,
        headers: req.headers,
    });
    next();
});
```

#### Backend - Debugging Routes

```typescript
router.get('/users/:id', async (req, res) => {
    try {
        console.log('[GET /users/:id] Request received', {
            params: req.params,
            user: req.user,
        });

        const user = await userService.getUserById(req.params.id);
        
        console.log('[GET /users/:id] User found', { userId: user.id });
        
        res.json(user);
    } catch (error) {
        console.error('[GET /users/:id] Error', {
            params: req.params,
            error: error.message,
            stack: error.stack,
        });
        res.status(500).json({ error: 'Internal server error' });
    }
});
```

#### Frontend - Intercepting Requests

```typescript
// Axios interceptor
api.interceptors.request.use(
    (config) => {
        console.log('[API Request]', {
            method: config.method,
            url: config.url,
            data: config.data,
            headers: config.headers,
        });
        return config;
    },
    (error) => {
        console.error('[API Request Error]', error);
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        console.log('[API Response]', {
            status: response.status,
            url: response.config.url,
            data: response.data,
        });
        return response;
    },
    (error) => {
        console.error('[API Response Error]', {
            status: error.response?.status,
            url: error.config?.url,
            data: error.response?.data,
        });
        return Promise.reject(error);
    }
);
```

### Database Query Debugging

#### Enable Query Logging

```typescript
// backend/src/db.ts
const prisma = new PrismaClient({
    log: [
        {
            emit: 'event',
            level: 'query',
        },
        {
            emit: 'stdout',
            level: 'error',
        },
        {
            emit: 'stdout',
            level: 'info',
        },
        {
            emit: 'stdout',
            level: 'warn',
        },
    ],
});

prisma.$on('query', (e) => {
    console.log('Query: ' + e.query);
    console.log('Params: ' + e.params);
    console.log('Duration: ' + e.duration + 'ms');
});
```

#### Analyze Slow Queries

```typescript
// Log queries taking > 100ms
prisma.$on('query', (e) => {
    if (e.duration > 100) {
        console.warn('[SLOW QUERY]', {
            query: e.query,
            duration: e.duration,
            params: e.params,
        });
    }
});
```

### React Component Debugging

#### useEffect Debugging

```typescript
useEffect(() => {
    console.log('[useEffect] Running', {
        dependencies: { userId, filter },
        timestamp: new Date().toISOString(),
    });

    async function fetchData() {
        try {
            console.log('[useEffect] Fetching data');
            const result = await api.get(`/users/${userId}`);
            console.log('[useEffect] Data received', result.data);
            setData(result.data);
        } catch (error) {
            console.error('[useEffect] Error', error);
            setError(error);
        }
    }

    fetchData();

    return () => {
        console.log('[useEffect] Cleanup');
    };
}, [userId, filter]);
```

#### Render Tracking

```typescript
import { useRef, useEffect } from 'react';

function useRenderCount(componentName: string) {
    const renders = useRef(0);
    
    useEffect(() => {
        renders.current += 1;
        console.log(`[${componentName}] Render #${renders.current}`);
    });
    
    return renders.current;
}

// Usage
function UserCard({ user }) {
    useRenderCount('UserCard');
    // ...
}
```

### Authentication Debugging

#### JWT Token Inspection

```typescript
// Decode JWT (frontend)
function decodeJWT(token: string) {
    const parts = token.split('.');
    if (parts.length !== 3) {
        console.error('Invalid JWT format');
        return;
    }
    
    const payload = JSON.parse(atob(parts[1]));
    console.log('[JWT] Payload:', payload);
    console.log('[JWT] Issued at:', new Date(payload.iat * 1000));
    console.log('[JWT] Expires at:', new Date(payload.exp * 1000));
    console.log('[JWT] Time until expiry:', (payload.exp * 1000 - Date.now()) / 1000, 'seconds');
    
    return payload;
}

// Usage
const token = localStorage.getItem('auth_token');
decodeJWT(token);
```

#### Session Debugging

```typescript
// Backend - Log session events
sessionMiddleware.use((req, res, next) => {
    console.log('[Session]', {
        sessionId: req.sessionID,
        userId: req.session?.userId,
        authenticated: !!req.user,
    });
    next();
});
```

### WebSocket Debugging

#### Client-Side

```typescript
const socket = io('http://localhost:3001');

socket.on('connect', () => {
    console.log('[WebSocket] Connected', {
        id: socket.id,
        transport: socket.io.engine.transport.name,
    });
});

socket.on('disconnect', (reason) => {
    console.log('[WebSocket] Disconnected', { reason });
});

socket.on('error', (error) => {
    console.error('[WebSocket] Error', error);
});

// Log all events
socket.onAny((event, ...args) => {
    console.log('[WebSocket] Event:', event, args);
});
```

#### Server-Side

```typescript
io.on('connection', (socket) => {
    console.log('[WebSocket] Client connected', {
        id: socket.id,
        ip: socket.handshake.address,
        headers: socket.handshake.headers,
    });

    socket.on('disconnect', (reason) => {
        console.log('[WebSocket] Client disconnected', {
            id: socket.id,
            reason,
        });
    });

    socket.onAny((event, ...args) => {
        console.log('[WebSocket] Received:', event, args);
    });
});
```

## Performance Debugging

### Profiling Backend

```typescript
// Measure function execution time
function measureTime<T>(fn: () => T, label: string): T {
    console.time(label);
    const result = fn();
    console.timeEnd(label);
    return result;
}

// Usage
const users = await measureTime(
    () => prisma.user.findMany(),
    'Fetch users'
);
```

### Profiling Frontend

```typescript
// React Profiler API
import { Profiler } from 'react';

function onRenderCallback(
    id: string,
    phase: 'mount' | 'update',
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number
) {
    console.log(`[Profiler] ${id}`, {
        phase,
        actualDuration,
        baseDuration,
    });
}

function App() {
    return (
        <Profiler id="App" onRender={onRenderCallback}>
            {/* Your components */}
        </Profiler>
    );
}
```

### Memory Profiling

```bash
# Start with heap snapshots
node --inspect --expose-gc backend/src/server.ts

# In Chrome DevTools:
# 1. Go to Memory tab
# 2. Take heap snapshot
# 3. Perform operations
# 4. Take another snapshot
# 5. Compare to find leaks
```

## Remote Debugging

### Docker Container

```bash
# Start container with debug port exposed
docker run -p 9229:9229 -p 3001:3001 \
  backend:latest \
  node --inspect=0.0.0.0:9229 src/server.ts

# Connect from VS Code:
# Add to launch.json:
{
  "type": "node",
  "request": "attach",
  "name": "Attach to Docker",
  "address": "localhost",
  "port": 9229,
  "localRoot": "${workspaceFolder}/backend",
  "remoteRoot": "/app"
}
```

### Production Debugging

**⚠️ Warning:** Be cautious debugging production!

```bash
# SSH into server
ssh user@production-server

# View logs
tail -f /var/log/spywatcher/app.log

# Check process
ps aux | grep node

# Attach debugger (if enabled)
kill -USR1 <PID>
# Then connect via chrome://inspect
```

## Debugging Tools Comparison

| Tool | Best For | Pros | Cons |
|------|----------|------|------|
| VS Code Debugger | General debugging | Full IDE integration | Requires setup |
| Chrome DevTools | Frontend debugging | Powerful, built-in | Browser-only |
| console.log | Quick checks | Fast, simple | Clutters code |
| Debug library | Controlled logging | Namespace filtering | Requires library |
| React DevTools | Component debugging | Component tree view | React-specific |
| Node Inspector | Backend debugging | Native Node support | Command-line heavy |

## Best Practices

1. **Remove debug code before committing**
   - Use debug libraries that can be toggled
   - Search for `console.log` before committing

2. **Use meaningful log messages**
   - Include context: function name, variables
   - Structure: `[Component/Service] Action: details`

3. **Log at appropriate levels**
   - DEBUG: Detailed development info
   - INFO: General informational
   - WARN: Warning conditions
   - ERROR: Error conditions

4. **Protect sensitive data**
   - Never log passwords, tokens, API keys
   - Sanitize user data in logs

5. **Use source maps**
   - Always enable in development
   - Consider for production with proper access control

## Resources

- [VS Code Debugging](https://code.visualstudio.com/docs/editor/debugging)
- [Chrome DevTools](https://developers.google.com/web/tools/chrome-devtools)
- [Node.js Debugging Guide](https://nodejs.org/en/docs/guides/debugging-getting-started/)
- [React DevTools](https://react.dev/learn/react-developer-tools)

## Next Steps

- [Common Issues](./common-issues)
- [Testing Guide](./testing)
- [Performance Optimization](../admin/performance)
- [Monitoring Setup](../admin/monitoring)
