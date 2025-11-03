# Feature Flags

Guide to managing feature flags and controlling feature availability in Spywatcher.

## Overview

Feature flags allow you to:

- **Enable/Disable Features**: Control feature availability without code changes
- **Gradual Rollouts**: Release features to subset of users
- **A/B Testing**: Test features with different user groups
- **Emergency Rollback**: Quickly disable problematic features
- **Environment-Specific**: Different features per environment

## Available Feature Flags

### Core Features

**FEATURE_GHOST_DETECTION**
```yaml
Description: Enable ghost user detection
Default: true
Impact: Analytics, Dashboard
Dependencies: None
```

**FEATURE_LURKER_DETECTION**
```yaml
Description: Enable lurker tracking and analysis
Default: true
Impact: Analytics, Dashboard
Dependencies: None
```

**FEATURE_SUSPICION_SCORING**
```yaml
Description: Enable suspicion score calculation
Default: true
Impact: Analytics, Scoring System
Dependencies: FEATURE_GHOST_DETECTION
```

### Advanced Features

**FEATURE_PLUGINS**
```yaml
Description: Enable plugin system
Default: true
Impact: Plugin loading, API
Dependencies: None
Security: Plugin permissions required
```

**FEATURE_PUBLIC_API**
```yaml
Description: Enable public API endpoints
Default: true
Impact: API access, SDK
Dependencies: None
```

**FEATURE_WEBSOCKET**
```yaml
Description: Enable WebSocket real-time updates
Default: true
Impact: Real-time features
Dependencies: None
Performance: High memory usage
```

**FEATURE_WEBHOOKS**
```yaml
Description: Enable webhook notifications
Default: false
Impact: External integrations
Dependencies: None
```

### Analytics Features

**FEATURE_ADVANCED_ANALYTICS**
```yaml
Description: Enable advanced analytics and ML features
Default: false
Impact: Analytics, Performance
Dependencies: FEATURE_GHOST_DETECTION, FEATURE_LURKER_DETECTION
Performance: High CPU usage
```

**FEATURE_TIMELINE_ANALYSIS**
```yaml
Description: Enable timeline and historical analysis
Default: true
Impact: Dashboard, Analytics
Dependencies: None
Storage: High database usage
```

**FEATURE_HEATMAPS**
```yaml
Description: Enable activity heatmap visualization
Default: true
Impact: Dashboard
Dependencies: None
```

### Privacy Features

**FEATURE_PRIVACY_MODE**
```yaml
Description: Enhanced privacy controls
Default: false
Impact: Data collection, Storage
Dependencies: None
Compliance: GDPR friendly
```

**FEATURE_ANONYMOUS_ANALYTICS**
```yaml
Description: Collect analytics without PII
Default: false
Impact: Analytics quality
Dependencies: FEATURE_PRIVACY_MODE
```

### Experimental Features

**FEATURE_AI_INSIGHTS**
```yaml
Description: AI-powered behavior insights (Beta)
Default: false
Impact: Analytics, Performance
Dependencies: FEATURE_ADVANCED_ANALYTICS
Status: Experimental
Performance: Very high CPU/memory
```

**FEATURE_PREDICTIVE_ALERTS**
```yaml
Description: Predictive alerting system (Alpha)
Default: false
Impact: Alerts, Performance
Dependencies: FEATURE_AI_INSIGHTS
Status: Alpha
```

## Managing Feature Flags

### Via Environment Variables

Set feature flags in `.env`:

```bash
# Core features
FEATURE_GHOST_DETECTION=true
FEATURE_LURKER_DETECTION=true
FEATURE_SUSPICION_SCORING=true

# Advanced features
FEATURE_PLUGINS=true
FEATURE_PUBLIC_API=true
FEATURE_WEBSOCKET=true
FEATURE_WEBHOOKS=false

# Analytics
FEATURE_ADVANCED_ANALYTICS=false
FEATURE_TIMELINE_ANALYSIS=true
FEATURE_HEATMAPS=true

# Privacy
FEATURE_PRIVACY_MODE=false
FEATURE_ANONYMOUS_ANALYTICS=false

# Experimental
FEATURE_AI_INSIGHTS=false
FEATURE_PREDICTIVE_ALERTS=false
```

::: tip Environment Restart
Changes to environment variables require application restart.
:::

### Via Admin Panel

**Admin Panel** → **Settings** → **Feature Flags**

**Toggle Features:**
1. Navigate to feature flags page
2. Find feature to modify
3. Toggle switch on/off
4. Confirm change
5. Feature updates immediately (no restart required)

**Feature Details:**
```yaml
Feature: Ghost Detection
Status: ✅ Enabled
Usage: 1,247 users using this feature
Performance: Normal
Dependencies: None
Can Disable: Yes

Actions:
  [Disable] [View Usage] [Schedule Change]
```

### Scheduled Changes

Schedule feature flag changes:

**Create Schedule:**

1. Select feature → **Schedule Change**

2. Configure schedule:
   ```yaml
   Feature: FEATURE_AI_INSIGHTS
   Action: Enable
   Schedule: 2024-11-10 00:00 UTC
   Rollback: 2024-11-17 00:00 UTC (if errors > 5%)
   Notification: Email admins 24h before
   ```

3. Confirm schedule

**View Scheduled Changes:**
- Upcoming changes
- Past changes
- Automated rollbacks

## Gradual Rollouts

### Percentage Rollouts

Enable features for percentage of users:

**Configuration:**

1. **Admin Panel** → **Feature Flags** → Select feature

2. Click **Gradual Rollout**

3. Configure rollout:
   ```yaml
   Feature: FEATURE_AI_INSIGHTS
   Rollout Type: Percentage
   
   Initial: 5% of users
   Increase By: 5% every 2 days
   Target: 100%
   
   Success Criteria:
     - Error rate < 1%
     - User satisfaction > 80%
   
   Rollback if:
     - Error rate > 5%
     - Critical bug reported
   ```

4. Start rollout

**Monitor Rollout:**
- Current percentage
- Users affected
- Error rates
- Performance metrics
- User feedback

### User Segment Rollouts

Enable features for specific user groups:

**By Role:**
```yaml
Feature: FEATURE_ADVANCED_ANALYTICS
Enabled For:
  - ADMIN: Yes
  - MODERATOR: Yes
  - USER: No (gradual rollout)
```

**By Subscription Tier:**
```yaml
Feature: FEATURE_AI_INSIGHTS
Enabled For:
  - ENTERPRISE: Yes
  - PRO: Gradual (50%)
  - FREE: No
```

**By Guild:**
```yaml
Feature: FEATURE_WEBHOOKS
Enabled For:
  - Guild: "Beta Testers" (123456)
  - Guild: "Premium Server" (789012)
  - Others: No
```

**Custom Criteria:**
```yaml
Feature: FEATURE_PREDICTIVE_ALERTS
Enabled For:
  - Account Age: > 30 days
  - Activity Level: High
  - Opt-in: Beta features
```

## A/B Testing

### Creating A/B Tests

Test feature variations:

**Admin Panel** → **Feature Flags** → **A/B Tests** → **Create**

**Example Test:**

```yaml
Test Name: Ghost Detection Algorithm V2
Duration: 14 days
Traffic Split: 50/50

Variant A (Control):
  - Current algorithm
  - Features: Standard ghost detection
  
Variant B (Test):
  - New ML-based algorithm
  - Features: Enhanced ghost detection

Success Metrics:
  - Detection accuracy
  - False positive rate
  - Performance impact
  - User satisfaction

Target Audience:
  - Role: All users
  - Guild Size: > 100 members
  - Sample Size: 1000 users minimum
```

**Test Results Dashboard:**
```yaml
Test: Ghost Detection Algorithm V2
Status: Running (Day 7/14)

Results:
  Variant A (Control):
    - Users: 512
    - Accuracy: 87.3%
    - False Positives: 4.2%
    - Avg Response Time: 145ms
    - Satisfaction: 3.8/5
  
  Variant B (Test):
    - Users: 488
    - Accuracy: 92.1% ⬆️
    - False Positives: 2.1% ⬇️
    - Avg Response Time: 167ms ⬆️
    - Satisfaction: 4.2/5 ⬆️

Statistical Significance: 95% ✅
Recommendation: Enable Variant B
```

### Analyzing Test Results

**View Test Analytics:**

**Admin Panel** → **Feature Flags** → **A/B Tests** → Select test

**Available Metrics:**
- User engagement
- Feature usage
- Performance impact
- Error rates
- User feedback
- Conversion rates

**Export Results:**
- CSV for analysis
- PDF report
- Share with team

## Feature Dependencies

### Managing Dependencies

Some features require others:

**Dependency Chain Example:**
```
FEATURE_AI_INSIGHTS
  ├── FEATURE_ADVANCED_ANALYTICS (required)
  │     ├── FEATURE_GHOST_DETECTION (required)
  │     └── FEATURE_LURKER_DETECTION (required)
  └── FEATURE_PREDICTIVE_ALERTS (optional)
```

**Dependency Enforcement:**

When disabling a feature:
```yaml
Attempting to disable: FEATURE_ADVANCED_ANALYTICS

⚠️ Warning: The following features depend on this:
  - FEATURE_AI_INSIGHTS (currently enabled)

Options:
  1. Disable dependent features first
  2. Force disable (may cause errors)
  3. Cancel operation
```

### Viewing Dependencies

**Admin Panel** → **Feature Flags** → Select feature → **Dependencies**

**Dependency Graph:**
```
FEATURE_GHOST_DETECTION
  ⬆️ Required by:
    - FEATURE_SUSPICION_SCORING
    - FEATURE_ADVANCED_ANALYTICS
  ⬇️ Depends on:
    - None

Current Impact:
  - Disabling will affect 2 features
  - 1,247 users actively using dependent features
```

## Performance Impact

### Monitoring Feature Performance

Track feature performance impact:

**Admin Panel** → **Feature Flags** → **Performance**

**Per-Feature Metrics:**
```yaml
FEATURE_AI_INSIGHTS:
  CPU Usage: +15% (High)
  Memory: +250MB (Medium)
  Response Time: +45ms (Medium)
  Database Queries: +12/request (High)
  
  Recommendations:
    ⚠️ Consider caching
    ⚠️ Optimize queries
    ✅ Acceptable for ENTERPRISE tier
    ❌ Too heavy for FREE tier
```

**System-Wide Impact:**
```yaml
All Features Enabled:
  Total CPU: 65% utilization
  Total Memory: 2.1GB / 4GB
  Avg Response Time: 245ms
  
Recommended Actions:
  ⚠️ Consider disabling FEATURE_AI_INSIGHTS for FREE tier
  ✅ Performance acceptable overall
```

### Resource Management

**Auto-Disable on Resource Exhaustion:**

```yaml
Feature: FEATURE_AI_INSIGHTS
Auto-Disable: Yes

Thresholds:
  - CPU > 85% for 5 minutes → Disable
  - Memory > 90% → Disable
  - Error rate > 10% → Disable
  
Action:
  - Disable feature
  - Send alert to admins
  - Log event
  - Auto-enable when resources normal
```

## Feature Usage Analytics

### Tracking Feature Adoption

**Admin Panel** → **Analytics** → **Feature Usage**

**Adoption Metrics:**
```yaml
FEATURE_HEATMAPS:
  Total Users: 5,247
  Active Users (30d): 3,891 (74%)
  Daily Active: 1,234
  
  Growth:
    - Week 1: 1,200 users
    - Week 2: 2,450 users
    - Week 3: 3,891 users
    - Trend: ⬆️ Growing
  
  User Segments:
    - FREE: 45%
    - PRO: 35%
    - ENTERPRISE: 20%
```

**Feature Engagement:**
```yaml
Top Features by Usage:
  1. FEATURE_GHOST_DETECTION - 98% adoption
  2. FEATURE_DASHBOARD - 95% adoption
  3. FEATURE_HEATMAPS - 74% adoption
  4. FEATURE_AI_INSIGHTS - 12% adoption
  5. FEATURE_WEBHOOKS - 8% adoption

Least Used:
  - FEATURE_PREDICTIVE_ALERTS - 2% adoption
  - Recommendation: Improve UX or deprecate
```

## Best Practices

### Feature Flag Best Practices

✅ **Do:**
- Document all feature flags
- Use descriptive names
- Set reasonable defaults
- Monitor feature performance
- Test before enabling
- Gradual rollouts for major features
- Clean up old flags
- Track dependencies
- Communicate changes
- Have rollback plan

❌ **Don't:**
- Enable experimental features in production without testing
- Ignore performance impact
- Forget to remove old flags
- Skip dependency checks
- Enable all features by default
- Disable features without warning
- Forget to monitor adoption
- Skip A/B testing for major changes

### Naming Conventions

**Feature Flag Names:**
```
Format: FEATURE_<CATEGORY>_<NAME>

Categories:
  - CORE: Core functionality
  - ANALYTICS: Analytics features
  - UI: User interface features
  - API: API features
  - EXPERIMENTAL: Beta/Alpha features
  - PRIVACY: Privacy-related
  - PERFORMANCE: Performance optimizations

Examples:
  ✅ FEATURE_ANALYTICS_HEATMAP
  ✅ FEATURE_UI_DARK_MODE
  ✅ FEATURE_EXPERIMENTAL_AI_INSIGHTS
  ❌ FEATURE_NEW_THING
  ❌ ENABLE_STUFF
```

## Troubleshooting

### Feature Not Enabling

**Symptoms:**
- Toggle doesn't work
- Feature still disabled after enabling
- No error message

**Solutions:**
1. Check dependencies are enabled
2. Verify permissions to change flags
3. Check for conflicting settings
4. Review application logs
5. Clear feature cache
6. Restart application (for env vars)
7. Check database connection

### Feature Causing Errors

**Symptoms:**
- Errors after enabling feature
- Performance degradation
- User complaints

**Solutions:**
1. Disable feature immediately
2. Check error logs
3. Review feature performance metrics
4. Check dependency versions
5. Rollback recent changes
6. Test in staging environment
7. Report bug to developers

### Can't Disable Feature

**Symptoms:**
- Disable action fails
- Feature remains enabled
- Dependent features blocking

**Solutions:**
1. Check dependencies (disable those first)
2. Verify admin permissions
3. Check for scheduled changes
4. Review feature locks
5. Check ongoing A/B tests
6. Use force disable (caution)

## Related Documentation

- [Admin Panel](./panel) - Admin panel overview
- [Environment Variables](./environment) - Configuration
- [Monitoring](./monitoring) - Performance monitoring
- [Security Settings](./security) - Security configuration

---

::: tip Need Help?
For additional support, check the [troubleshooting guide](/guide/troubleshooting) or open an issue on [GitHub](https://github.com/subculture-collective/discord-spywatcher/issues).
:::
