# Privacy Controls

Manage privacy settings and data collection in Spywatcher.

## Privacy Philosophy

Spywatcher respects user privacy while providing valuable analytics:
- Minimal data collection
- User consent
- Data anonymization options
- Clear retention policies

## Privacy Settings

### User Privacy

Individual users can:
- Opt out of tracking
- Request data deletion
- Export their data
- View what's collected

### Admin Privacy

Administrators can configure:
- What data to collect
- How long to retain data
- Who can access analytics
- Data anonymization rules

## Data Collection

### What We Collect

By default, Spywatcher collects:
- Presence events (online/offline)
- Message counts (not content)
- User roles
- Timestamps

### Optional Collection

With consent:
- Message content (for content analysis)
- Voice channel activity
- Detailed presence data

### What We Don't Collect

Spywatcher never collects:
- Passwords
- Private messages content (unless explicitly enabled)
- Payment information
- Personal identification documents

## Data Retention

### Retention Periods

- **Active data**: 90 days
- **Analytics aggregates**: 1 year
- **Audit logs**: 2 years
- **Deleted user data**: Purged immediately

### Configuring Retention

Administrators can configure:
```bash
# Environment variables
DATA_RETENTION_DAYS=90
AUDIT_LOG_RETENTION_DAYS=730
```

## Data Access

### Who Can Access Data

- **Server Admins**: Full access to their server data
- **Moderators**: Limited access based on permissions
- **Users**: Access to their own data only

### Access Logs

All data access is logged:
- Who accessed data
- What data was accessed
- When access occurred
- Why access was requested (if provided)

## GDPR Compliance

Spywatcher supports GDPR requirements:
- Right to access
- Right to deletion
- Right to portability
- Right to correction
- Data processing agreements

## User Rights

### Request Your Data

Users can request:
1. All collected data
2. Data export (JSON/CSV)
3. Data deletion
4. Correction of inaccurate data

### Opt-Out

To opt out of tracking:
1. Navigate to Privacy Settings
2. Enable "Opt Out of Tracking"
3. Confirm decision

Note: Opting out may limit some features.

## Data Security

### Encryption

- Data encrypted at rest
- TLS for data in transit
- Encrypted backups
- Secure key management

### Access Control

- Role-based access control
- Two-factor authentication
- Session management
- Audit logging

## Related

- [Security Guide](../admin/security)
- [Admin Guide](../admin/)
- [FAQ](./faq)

::: tip
Regular privacy audits help ensure compliance and build user trust.
:::
