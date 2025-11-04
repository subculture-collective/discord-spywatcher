# Analytics & Metrics System

## Overview

Discord SpyWatcher includes a comprehensive, GDPR-compliant analytics system for tracking user behavior, feature usage, and application performance. The system provides actionable insights while respecting user privacy.

## Features

### 📊 Tracking Capabilities

- **User Behavior Tracking**: Page views, button clicks, feature usage
- **Performance Metrics**: API response times, database query performance
- **Feature Analytics**: Track which features are most used
- **Custom Events**: Track any application-specific events
- **Error Tracking**: Automatic error event capture

### 🔒 Privacy & Compliance

- **GDPR Compliant**: Full compliance with European data protection regulations
- **Consent Management**: User opt-in/opt-out support
- **Data Anonymization**: Automatic hashing of sensitive data when consent not given
- **Transparent**: Clear messaging about data collection practices
- **Data Retention**: Configurable retention policies

### 📈 Dashboard & Insights

- Real-time analytics dashboard
- User activity metrics
- Feature usage statistics
- Performance monitoring
- Aggregated reports

## Architecture

### Backend Components

#### Database Models

```prisma
model UserAnalyticsEvent {
  id           String   @id @default(cuid())
  userId       String?
  sessionId    String?
  eventType    String   // PAGE_VIEW, BUTTON_CLICK, FEATURE_USED, etc.
  eventName    String
  category     String?
  properties   Json?
  consentGiven Boolean  @default(false)
  anonymized   Boolean  @default(false)
  createdAt    DateTime @default(now())
}

model FeatureUsageMetric {
  id           String   @id @default(cuid())
  featureName  String
  userId       String?
  usageCount   Int      @default(1)
  lastUsedAt   DateTime @default(now())
  metadata     Json?
  consentGiven Boolean  @default(false)
}

model PerformanceMetric {
  id            String   @id @default(cuid())
  metricType    String
  metricName    String
  value         Float
  unit          String
  endpoint      String?
  userId        String?
  metadata      Json?
  createdAt     DateTime @default(now())
}

model AnalyticsSummary {
  id              String   @id @default(cuid())
  summaryDate     DateTime @db.Date
  summaryType     String   // DAILY, WEEKLY, MONTHLY
  metric          String
  value           Float
  metadata        Json?
}
```

#### Analytics Service

Location: `backend/src/services/analytics.ts`

**Key Functions:**

- `trackEvent()` - Track any analytics event
- `trackFeatureUsage()` - Track feature usage
- `trackPerformance()` - Track performance metrics
- `getAnalyticsSummary()` - Get aggregated summaries
- `getFeatureUsageStats()` - Get feature statistics
- `getUserActivityMetrics()` - Get user activity data
- `aggregateDailySummary()` - Create daily aggregations
- `cleanOldAnalyticsData()` - Clean data based on retention policy

**Event Types:**

```typescript
enum AnalyticsEventType {
    PAGE_VIEW = 'PAGE_VIEW',
    BUTTON_CLICK = 'BUTTON_CLICK',
    FEATURE_USED = 'FEATURE_USED',
    API_CALL = 'API_CALL',
    FORM_SUBMIT = 'FORM_SUBMIT',
    ERROR = 'ERROR',
    SEARCH = 'SEARCH',
    EXPORT = 'EXPORT',
}
```

#### Middleware

Location: `backend/src/middleware/analyticsTracking.ts`

Automatically tracks:

- All API requests
- Response times
- Error events
- Consent status

#### API Endpoints

**GET /api/metrics/summary**
Get analytics summary for a date range

```bash
GET /api/metrics/summary?startDate=2024-01-01&endDate=2024-01-07&metric=active_users
```

**GET /api/metrics/features**
Get feature usage statistics

```bash
GET /api/metrics/features?startDate=2024-01-01&endDate=2024-01-07
```

**GET /api/metrics/activity**
Get user activity metrics

```bash
GET /api/metrics/activity?startDate=2024-01-01&endDate=2024-01-07
```

**GET /api/metrics/performance**
Get performance metrics

```bash
GET /api/metrics/performance?type=API_RESPONSE_TIME&startDate=2024-01-01
```

**POST /api/metrics/event**
Track a custom event from frontend

```bash
POST /api/metrics/event
{
  "eventType": "BUTTON_CLICK",
  "eventName": "export_button",
  "properties": { "format": "csv" }
}
```

**GET /api/metrics/dashboard**
Get comprehensive dashboard data

```bash
GET /api/metrics/dashboard
```

### Frontend Components

#### Analytics Service

Location: `frontend/src/lib/analytics.ts`

**Tracking Functions:**

```typescript
import {
    trackEvent,
    trackPageView,
    trackButtonClick,
    trackFeatureUsage,
} from '../lib/analytics';

// Track a page view
trackPageView('/dashboard');

// Track a button click
trackButtonClick('export_button', { format: 'csv' });

// Track feature usage
trackFeatureUsage('ghost_analysis', { userCount: 50 });
```

**Consent Management:**

```typescript
import {
    hasAnalyticsConsent,
    setAnalyticsConsent,
    getAnalyticsConsentStatus,
} from '../lib/analytics';

// Check consent
if (hasAnalyticsConsent()) {
    // Track event
}

// Grant consent
setAnalyticsConsent(true);

// Check status
const status = getAnalyticsConsentStatus(); // 'granted' | 'denied' | 'pending'
```

#### React Hooks

Location: `frontend/src/hooks/useAnalytics.ts`

```typescript
import { usePageTracking, useAnalytics } from '../hooks/useAnalytics';

// Automatic page tracking
function App() {
  usePageTracking(); // Tracks all route changes
  return <Routes>...</Routes>;
}

// Manual tracking
function MyComponent() {
  const { trackButtonClick, trackFeatureUsage, hasConsent } = useAnalytics();

  const handleExport = () => {
    trackButtonClick('export');
    // ... export logic
  };

  return <button onClick={handleExport}>Export</button>;
}
```

#### Consent Banner

Location: `frontend/src/components/AnalyticsConsentBanner.tsx`

Shows automatically when user hasn't made a consent choice. Displays at bottom of page with Accept/Decline buttons.

#### Metrics Dashboard

Location: `frontend/src/pages/MetricsDashboard.tsx`

Access at: `/metrics`

**Features:**

- Summary cards (total events, unique users, consented users, avg response time)
- Top events bar chart
- Feature usage pie chart
- Detailed feature usage table
- Auto-refresh capability

## Usage Guide

### Backend Tracking

#### Automatic Tracking

All API requests are automatically tracked via middleware. No additional code needed.

#### Manual Event Tracking

In route handlers:

```typescript
import { trackCustomEvent } from '../middleware/analyticsTracking';

router.post('/export', (req, res) => {
    trackCustomEvent(req, 'data_export', { format: 'csv', rows: 100 });
    // ... handle export
});
```

#### Feature Usage Tracking

```typescript
import { trackFeatureUsage } from '../services/analytics';

// Track when user uses a feature
await trackFeatureUsage({
    featureName: 'ghost_analysis',
    userId: user.id,
    metadata: { resultCount: 25 },
    consentGiven: user.analyticsConsent,
});
```

#### Performance Tracking

```typescript
import { trackPerformance, PerformanceMetricType } from '../services/analytics';

const startTime = Date.now();
// ... perform operation
const duration = Date.now() - startTime;

await trackPerformance({
    metricType: PerformanceMetricType.DB_QUERY,
    metricName: 'fetch_ghost_scores',
    value: duration,
    unit: 'ms',
    metadata: { rowCount: 100 },
});
```

### Frontend Tracking

#### Page Views

Automatic via `usePageTracking()` hook in App component.

#### Button Clicks

```typescript
import { trackButtonClick } from '../lib/analytics';

<button onClick={() => {
  trackButtonClick('settings_save');
  // ... handle click
}}>
  Save Settings
</button>
```

#### Feature Usage

```typescript
import { trackFeatureUsage } from '../lib/analytics';

const handleAnalysisRun = () => {
    trackFeatureUsage('lurker_detection', { threshold: 5 });
    // ... run analysis
};
```

#### Form Submissions

```typescript
import { trackFormSubmit } from '../lib/analytics';

const handleSubmit = (data) => {
    trackFormSubmit('user_settings', { fields: Object.keys(data) });
    // ... submit form
};
```

## Configuration

### Environment Variables

**Backend:**

```env
# Optional: Enable/disable analytics tracking
ENABLE_ANALYTICS=true

# Optional: Data retention period (days)
ANALYTICS_RETENTION_DAYS=90
```

**Frontend:**

```env
# Enable analytics tracking
VITE_ENABLE_ANALYTICS=true

# Optional: Analytics tracking ID (for external services)
VITE_ANALYTICS_TRACKING_ID=
```

### Data Retention

Configure retention policies in Prisma:

```typescript
// Example: Clean data older than 90 days
import { cleanOldAnalyticsData } from './services/analytics';

// Run as scheduled job
await cleanOldAnalyticsData(90);
```

### Daily Aggregation

Create scheduled jobs for daily summaries:

```typescript
import { aggregateDailySummary } from './services/analytics';

// Run daily at midnight
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
await aggregateDailySummary(yesterday);
```

## Privacy & GDPR Compliance

### Data Anonymization

When user consent is not given:

- User IDs are hashed (SHA-256, 16 chars)
- IP addresses are hashed
- Session IDs are hashed
- User agents are hashed
- `anonymized` flag set to `true`

### Consent Management

- Consent stored in localStorage and cookies
- Cookie synced to backend for server-side tracking
- Users can change consent at any time
- Declining consent anonymizes all future tracking

### Data Rights

Users have the right to:

- View their data (via existing privacy endpoints)
- Request deletion (via existing privacy endpoints)
- Opt-out of tracking (consent banner)
- Access summary of collected data

### Best Practices

1. Always check consent before tracking sensitive actions
2. Use generic event names (avoid PII in event names)
3. Store minimal data in properties
4. Regular cleanup of old data
5. Document what data is collected

## Testing

### Unit Tests

```bash
cd backend
npm test -- __tests__/unit/services/analytics.test.ts
```

### Integration Tests

```bash
cd backend
npm test -- __tests__/integration/routes/metricsAnalytics.test.ts
```

### Manual Testing

1. Open application in browser
2. Accept/decline consent banner
3. Navigate pages (check page tracking)
4. Click buttons (check event tracking)
5. Visit `/metrics` dashboard
6. View collected metrics

## Monitoring

### Check Data Collection

```sql
-- Recent events
SELECT * FROM "UserAnalyticsEvent"
ORDER BY "createdAt" DESC
LIMIT 10;

-- Feature usage
SELECT "featureName", COUNT(*) as usage_count
FROM "FeatureUsageMetric"
GROUP BY "featureName"
ORDER BY usage_count DESC;

-- Performance metrics
SELECT "metricName", AVG("value") as avg_value
FROM "PerformanceMetric"
WHERE "metricType" = 'API_RESPONSE_TIME'
GROUP BY "metricName"
ORDER BY avg_value DESC;
```

### Dashboard Access

- Frontend: Navigate to `/metrics`
- Backend API: `GET /api/metrics/dashboard`

## Troubleshooting

### Events Not Being Tracked

1. Check consent status in browser console
2. Verify `VITE_ENABLE_ANALYTICS=true` in frontend
3. Check network tab for failed requests
4. Review browser console for errors

### Dashboard Shows No Data

1. Verify database contains analytics records
2. Check API endpoint permissions
3. Verify user is authenticated
4. Check date range filters

### Performance Issues

1. Add database indexes (already included in schema)
2. Implement data retention cleanup
3. Use aggregated summaries instead of raw events
4. Cache dashboard data with short TTL

## Future Enhancements

- [ ] Scheduled aggregation jobs
- [ ] Email reports for admins
- [ ] More detailed user journey tracking
- [ ] A/B testing framework
- [ ] Funnel analysis
- [ ] Cohort analysis
- [ ] Export analytics data
- [ ] Custom dashboard builder
- [ ] Real-time analytics streaming

## Support

For issues or questions:

1. Check this documentation
2. Review test files for examples
3. Check server logs for errors
4. Open an issue on GitHub
