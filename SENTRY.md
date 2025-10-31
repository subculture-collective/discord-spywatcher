# Sentry Error Tracking & Monitoring

This document describes the Sentry integration for error tracking, performance monitoring, and alerting across both frontend and backend.

## 📋 Overview

Sentry is integrated into both the frontend (React) and backend (Node.js/Express) to provide:

- **Error Tracking**: Automatic capture and reporting of errors
- **Performance Monitoring**: Transaction tracing and performance metrics
- **Session Replay**: Video-like reproduction of user sessions (frontend only)
- **Error Grouping**: Intelligent grouping of similar errors
- **Source Maps**: Readable stack traces in production
- **Alert Rules**: Notifications for critical errors
- **User Context**: User information attached to errors

## 🚀 Setup

### 1. Create Sentry Projects

1. Sign up at [sentry.io](https://sentry.io) or use your organization's Sentry instance
2. Create two projects:
   - **Backend Project**: Node.js/Express platform
   - **Frontend Project**: React platform
3. Note the DSN (Data Source Name) for each project

### 2. Configure Environment Variables

#### Backend Configuration

Add to `backend/.env`:

```bash
# Sentry Configuration
SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/backend-project-id
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=backend@1.0.0
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_SAMPLE_RATE=1.0
```

#### Frontend Configuration

Add to `frontend/.env`:

```bash
# Sentry Configuration
VITE_SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/frontend-project-id
VITE_SENTRY_RELEASE=frontend@1.0.0
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1
VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE=0.1
VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE=1.0
```

For production builds with source map uploads, also add:

```bash
VITE_SENTRY_AUTH_TOKEN=your_sentry_auth_token
VITE_SENTRY_ORG=your_sentry_org_slug
VITE_SENTRY_PROJECT=your_frontend_project_slug
```

### 3. Generate Sentry Auth Token

For source map uploads:

1. Go to Sentry Settings > Auth Tokens
2. Create a new token with these scopes:
   - `project:read`
   - `project:releases`
   - `org:read`
3. Copy the token to `VITE_SENTRY_AUTH_TOKEN`

## 📊 Features

### Error Tracking

Both frontend and backend automatically capture and report:

- **Unhandled Exceptions**: Crashes and unexpected errors
- **Handled Errors**: Manually reported errors
- **Promise Rejections**: Unhandled promise rejections
- **Network Errors**: Failed API calls (configurable)

### Performance Monitoring

- **Transaction Tracing**: Track request/response times
- **Database Queries**: Monitor Prisma query performance (backend)
- **API Calls**: Track frontend API requests
- **Page Loads**: Monitor frontend page load performance

### Session Replay (Frontend Only)

- Records user sessions when errors occur
- Privacy-focused: masks all text and blocks media by default
- Configurable sampling rates

### Error Context

Errors include rich context:

- **User Information**: ID, username, email
- **Request Details**: URL, method, headers (sanitized)
- **Breadcrumbs**: User actions leading to the error
- **Tags**: Environment, release, custom tags
- **Custom Context**: Additional application-specific data

### Data Privacy

Sensitive data is automatically filtered:

- Authorization headers
- Cookies
- Passwords and tokens
- Custom sensitive fields

## 🔧 Usage

### Backend

#### Automatic Error Capture

Errors are automatically captured by the Express error handler:

```typescript
throw new Error('Something went wrong'); // Automatically captured
```

#### Manual Error Capture

```typescript
import { captureException, captureMessage } from './monitoring';

// Capture an exception with context
captureException(
    new Error('Payment failed'),
    {
        userId: user.id,
        amount: 99.99,
        currency: 'USD',
    },
    'error'
);

// Capture a message
captureMessage('User completed checkout', { orderId: '12345' }, 'info');
```

#### User Context

```typescript
import { setUser, clearUser } from './monitoring';

// Set user context (persists across errors)
setUser({
    id: user.id,
    username: user.username,
    email: user.email,
});

// Clear user context (e.g., on logout)
clearUser();
```

#### Breadcrumbs

```typescript
import { addBreadcrumb } from './monitoring';

addBreadcrumb({
    message: 'User clicked checkout button',
    category: 'ui.click',
    level: 'info',
    data: { cartTotal: 99.99 },
});
```

#### Tags

```typescript
import { setTag, setTags } from './monitoring';

// Single tag
setTag('payment_method', 'credit_card');

// Multiple tags
setTags({
    payment_method: 'credit_card',
    subscription_tier: 'premium',
});
```

#### Performance Monitoring

```typescript
import { startTransaction } from './monitoring';

const transaction = startTransaction('process-order', 'task');

try {
    // Your code here
    await processOrder(order);
    transaction?.setStatus('ok');
} catch (error) {
    transaction?.setStatus('internal_error');
    throw error;
} finally {
    transaction?.finish();
}
```

### Frontend

#### Automatic Error Capture

React component errors are automatically captured by the ErrorBoundary:

```tsx
// Wrap your app with ErrorBoundary (already done in main.tsx)
<ErrorBoundary>
    <App />
</ErrorBoundary>
```

#### Manual Error Capture

```typescript
import { captureException, captureMessage } from './config/sentry';

// Capture an exception
try {
    await fetchData();
} catch (error) {
    captureException(error as Error, { component: 'DataFetcher' }, 'error');
}

// Capture a message
captureMessage('User viewed dashboard', { userId: user.id }, 'info');
```

#### User Context

```typescript
import { setUser, clearUser } from './config/sentry';

// Set user context on login
setUser({
    id: user.id,
    username: user.username,
    email: user.email,
});

// Clear on logout
clearUser();
```

#### Integration with React Router

Navigation tracking is automatically enabled via `reactRouterV7BrowserTracingIntegration`.

## 🔔 Alert Rules

### Recommended Alert Rules

Set up the following alert rules in Sentry:

#### Critical Errors

- **Condition**: Event count > 10 in 5 minutes
- **Filter**: `level:error` OR `level:fatal`
- **Action**: Email + Slack notification
- **Purpose**: Catch sudden spikes in errors

#### High Error Rate

- **Condition**: Error rate > 5% (errors / total events)
- **Filter**: None
- **Action**: Email team
- **Purpose**: Monitor overall application health

#### New Issues

- **Condition**: A new issue is created
- **Filter**: `level:error` OR `level:fatal`
- **Action**: Slack notification
- **Purpose**: Stay informed of new error types

#### Performance Degradation

- **Condition**: Average transaction duration > 3 seconds
- **Filter**: None
- **Action**: Email team
- **Purpose**: Catch performance regressions

### Setting Up Alerts

1. Go to Project Settings > Alerts
2. Click "Create Alert Rule"
3. Configure conditions and actions
4. Add team members to notifications

## 📦 Source Maps

### Backend Source Maps

Source maps are generated during TypeScript compilation and referenced in the compiled code.

To upload backend source maps:

```bash
# Install Sentry CLI
npm install -g @sentry/cli

# Create release and upload source maps
sentry-cli releases new backend@1.0.0
sentry-cli releases files backend@1.0.0 upload-sourcemaps ./dist
sentry-cli releases finalize backend@1.0.0
```

### Frontend Source Maps

Source maps are automatically uploaded during production builds when configured:

```bash
# Build with source map upload
VITE_SENTRY_AUTH_TOKEN=your_token \
VITE_SENTRY_ORG=your_org \
VITE_SENTRY_PROJECT=your_project \
npm run build
```

The Vite plugin will:

1. Generate source maps
2. Upload them to Sentry
3. Delete local source maps (security)
4. Create a release in Sentry

## 🚢 Deployment

### Release Tracking

Use git commit SHA or version numbers for releases:

```bash
# Using git SHA
export SENTRY_RELEASE="$(git rev-parse HEAD)"

# Using version
export SENTRY_RELEASE="backend@1.0.0"
```

### CI/CD Integration

#### GitHub Actions Example

```yaml
- name: Deploy with Sentry
  env:
    SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
    SENTRY_ORG: ${{ secrets.SENTRY_ORG }}
    SENTRY_PROJECT: ${{ secrets.SENTRY_PROJECT }}
    SENTRY_RELEASE: ${{ github.sha }}
  run: |
    npm run build
    # Source maps are automatically uploaded by the build
```

## 🧪 Testing

### Testing Error Capture

Backend:

```bash
curl http://localhost:3001/api/test-error
```

Frontend:

```typescript
// In your component
<button onClick={() => { throw new Error('Test error'); }}>
  Test Error
</button>
```

### Verifying Setup

1. Trigger a test error
2. Check Sentry dashboard for the error
3. Verify source maps show correct file/line numbers
4. Check that user context is attached (if user is logged in)

## 📈 Best Practices

### Error Handling

1. **Use Error Boundaries**: Wrap components to catch React errors
2. **Add Context**: Include relevant data with errors
3. **Set User Context**: Always set user info when available
4. **Use Breadcrumbs**: Track user actions leading to errors
5. **Tag Errors**: Use tags for filtering and searching

### Performance

1. **Sample Rates**: Use lower sample rates in production (0.1 = 10%)
2. **Filter Noise**: Ignore expected errors (network errors, validation)
3. **Session Replay**: Sample only error sessions in production
4. **Transaction Names**: Use meaningful transaction names

### Security

1. **Sensitive Data**: Never log passwords, tokens, or secrets
2. **PII**: Be cautious with personally identifiable information
3. **Environment Variables**: Use secure secret management
4. **Source Maps**: Delete after upload (automatic with Vite plugin)

### Monitoring

1. **Review Regularly**: Check Sentry dashboard weekly
2. **Fix Issues**: Address errors by priority
3. **Set Up Alerts**: Configure notifications for critical errors
4. **Track Trends**: Monitor error rates over time

## 🔗 Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [Sentry Node.js SDK](https://docs.sentry.io/platforms/node/)
- [Sentry React SDK](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Source Maps Guide](https://docs.sentry.io/platforms/javascript/sourcemaps/)
- [Alert Rules](https://docs.sentry.io/product/alerts/)

## 🆘 Troubleshooting

### Source Maps Not Working

- Verify `SENTRY_RELEASE` matches between app and uploaded source maps
- Check that source maps were uploaded successfully
- Ensure source map files are accessible during build

### High Event Volume

- Increase sample rates to reduce volume
- Add more filters to `ignoreErrors` in config
- Review and fix high-frequency errors

### Missing Context

- Verify user context is set after login
- Check breadcrumbs are being added
- Ensure tags are set where needed

### Performance Issues

- Lower trace sample rate
- Disable session replay or reduce sample rate
- Review transaction instrumentation

## 📝 Notes

- Sentry is optional - the application works without it
- Configuration is environment-based
- All sensitive data is filtered automatically
- Source maps improve debugging significantly
- Regular review of errors improves application quality
