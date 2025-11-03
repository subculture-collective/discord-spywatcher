# User Management

Complete guide to managing user accounts, roles, permissions, and quotas in Spywatcher.

## Overview

User management in Spywatcher involves:

- **Account Administration**: Create, modify, and delete user accounts
- **Role Management**: Assign and manage user roles
- **Permission Control**: Configure granular access permissions
- **Quota Management**: Set and monitor usage quotas
- **Activity Monitoring**: Track user activity and behavior

## User Roles

Spywatcher has a hierarchical role system:

### USER

**Default role** for all authenticated users

**Permissions:**
- ✅ View own guild analytics
- ✅ Access dashboard features
- ✅ Manage own profile settings
- ✅ Use public API (with quota)
- ❌ Access admin panel
- ❌ View other users' data
- ❌ Modify system settings

**Quotas:**
- API calls: 1,000/day
- Rate limit: 10 requests/minute
- Data retention: 30 days

### MODERATOR

**Limited administrative** access

**Permissions:**
- ✅ All USER permissions
- ✅ View user reports
- ✅ Issue temporary bans (≤ 7 days)
- ✅ View analytics for assigned guilds
- ✅ Access limited admin panel
- ❌ Permanent bans
- ❌ System configuration
- ❌ User role changes

**Quotas:**
- API calls: 10,000/day
- Rate limit: 50 requests/minute
- Data retention: 90 days

### ADMIN

**Server administration** privileges

**Permissions:**
- ✅ All MODERATOR permissions
- ✅ Full user management
- ✅ Issue permanent bans
- ✅ Configure guild settings
- ✅ Access full admin panel
- ✅ View audit logs
- ❌ System-level changes
- ❌ Super admin actions

**Quotas:**
- API calls: 100,000/day
- Rate limit: 200 requests/minute
- Data retention: 365 days

### SUPER_ADMIN

**Full system access** (use sparingly)

**Permissions:**
- ✅ All ADMIN permissions
- ✅ System configuration
- ✅ Manage other admins
- ✅ Database operations
- ✅ Security settings
- ✅ Infrastructure management
- ✅ Audit log access

**Quotas:**
- API calls: Unlimited
- Rate limit: Unlimited
- Data retention: Unlimited

### BANNED

**Restricted access** - suspended account

**Permissions:**
- ❌ All access denied
- ❌ API access revoked
- ❌ Dashboard access blocked

## Creating Users

### Via Admin Panel

1. Navigate to **Admin Panel** → **Users** → **Create User**

2. Fill in required information:
   ```
   Discord ID: 123456789012345678
   Username: john_doe
   Email: john@example.com (optional)
   Role: USER
   ```

3. Set optional parameters:
   - Subscription tier (FREE/PRO/ENTERPRISE)
   - Custom quotas
   - Expiration date
   - Notes

4. Click **Create User**

### Via API

```bash
POST /api/admin/users
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json

{
  "discordId": "123456789012345678",
  "username": "john_doe",
  "email": "john@example.com",
  "role": "USER",
  "tier": "FREE"
}
```

### Bulk User Creation

For creating multiple users:

1. Prepare CSV file:
   ```csv
   discordId,username,email,role,tier
   123456789012345678,john_doe,john@example.com,USER,FREE
   987654321098765432,jane_smith,jane@example.com,MODERATOR,PRO
   ```

2. Import via admin panel:
   **Admin Panel** → **Users** → **Import** → Upload CSV

3. Review and confirm import

## Viewing Users

### User List

Access the user list at **Admin Panel** → **Users**

**Available Information:**
- Discord ID and username
- Avatar
- Role and tier
- Registration date
- Last login
- Account status
- Current quota usage

**List Controls:**
- **Search**: Find users by ID, username, or email
- **Filter**: Filter by role, tier, or status
- **Sort**: Sort by any column
- **Page size**: 10, 25, 50, or 100 users per page

### User Details

Click on any user to view detailed information:

**Profile Information**
- Full Discord profile
- Account metadata
- Registration source
- Email verification status

**Activity Summary**
- Total API calls
- Last API request
- Active sessions
- Guilds accessed

**Usage Statistics**
- API quota usage (daily/monthly)
- Rate limit hits
- Data storage used
- Feature usage breakdown

**Login History**
- Login timestamps
- IP addresses
- User agents
- Geographic locations

**Audit Trail**
- Account changes
- Role modifications
- Ban history
- Admin actions

## Editing Users

### Change User Role

1. Go to **Admin Panel** → **Users** → Select user
2. Click **Edit** → **Change Role**
3. Select new role:
   - USER
   - MODERATOR
   - ADMIN
   - SUPER_ADMIN
4. Add reason for change (required)
5. Confirm change

::: warning Role Changes
Role changes take effect immediately. Users will need to refresh their session to see new permissions.
:::

### Modify User Quotas

**Set Custom Quotas:**

1. Select user → **Edit** → **Quotas**
2. Modify quota values:
   ```
   Daily API calls: 5000 (default: 1000)
   Rate limit: 25 req/min (default: 10)
   Data retention: 90 days (default: 30)
   ```
3. Set expiration (optional)
4. Save changes

**Reset Quotas:**
- Click **Reset to Tier Defaults**
- Removes custom overrides
- Applies tier-based quotas

### Update User Subscription

Change subscription tier:

1. Select user → **Edit** → **Subscription**
2. Choose tier:
   - **FREE**: Basic features, limited quotas
   - **PRO**: Enhanced features, higher quotas
   - **ENTERPRISE**: Full features, custom quotas
3. Set billing period (if applicable)
4. Save changes

### Modify Permissions

Set granular permissions:

**Feature Access**
- Ghost detection
- Lurker tracking
- Suspicion scoring
- Plugin access
- API access
- WebSocket access

**Data Access**
- Own guilds only
- Specific guilds (whitelist)
- All guilds (admin)

**Export Permissions**
- Can export data
- Export formats allowed
- Export frequency limits

## User Status Management

### Account Status Types

**ACTIVE**
- Normal operating status
- Full access to features
- Default status

**SUSPENDED**
- Temporary suspension
- Limited access
- Can be reactivated
- Common for policy violations

**BANNED**
- Permanent suspension
- No access allowed
- Requires admin review to lift

**INACTIVE**
- No recent activity
- Account dormant
- Can self-reactivate by logging in

**PENDING**
- Account created but not verified
- Limited access
- Awaiting email verification

### Suspending Users

Temporary account suspension:

1. Select user → **Actions** → **Suspend**
2. Set suspension details:
   ```
   Duration: 7 days
   Reason: Violation of terms of service
   Notify user: Yes
   ```
3. Confirm suspension

**During Suspension:**
- User cannot login
- API access revoked
- Active sessions terminated
- User receives suspension notice

### Reactivating Users

Restore suspended accounts:

1. Select user → **Actions** → **Reactivate**
2. Add reactivation notes
3. Optionally reset quotas
4. Confirm reactivation
5. User receives reactivation email

## Deleting Users

::: danger Permanent Action
User deletion is **irreversible**. All user data will be permanently deleted.
:::

### Soft Delete (Recommended)

Mark user as deleted without removing data:

1. Select user → **Actions** → **Soft Delete**
2. Account marked as deleted
3. Data retained for recovery period (30 days)
4. Can be restored within recovery period

### Hard Delete

Permanently delete user and all data:

1. Select user → **Actions** → **Delete Permanently**
2. Confirm deletion by typing username
3. Data permanently removed:
   - User account
   - API keys
   - Session data
   - Usage history
   - Personal information

4. Audit log entry created
5. Cannot be undone

::: warning Data Retention
Check data retention policies and legal requirements before permanently deleting users.
:::

## Bulk Operations

### Bulk User Actions

Select multiple users to perform actions:

**Available Bulk Actions:**
- Change role
- Modify quotas
- Suspend accounts
- Send notifications
- Export user data
- Apply tags/labels

**Steps:**
1. Filter/search for target users
2. Select users (checkbox)
3. Click **Bulk Actions**
4. Choose action
5. Configure action parameters
6. Preview changes
7. Confirm and apply

### Export User Data

Export user information for analysis:

**Export Formats:**
- **CSV**: Spreadsheet import
- **JSON**: Programmatic access
- **Excel**: Formatted reports
- **PDF**: Printable reports

**Export Options:**
1. Select users or filters
2. Choose export format
3. Select fields to include:
   - Profile information
   - Activity data
   - Usage statistics
   - Audit logs
4. Click **Export**
5. Download file

## Monitoring User Activity

### Activity Dashboard

View user activity metrics:

**Real-time Metrics**
- Currently active users
- Active sessions
- Concurrent API requests
- Geographic distribution

**Historical Metrics**
- Daily active users (DAU)
- Monthly active users (MAU)
- Retention rates
- Churn analysis

### User Sessions

View and manage active sessions:

**Session Information**
- Session ID
- Login time
- Last activity
- IP address
- User agent
- Geographic location

**Session Actions**
- View session details
- Terminate session
- Terminate all user sessions
- Block session IP

### API Usage Tracking

Monitor API usage per user:

**Usage Metrics**
- Total requests
- Requests by endpoint
- Error rates
- Average response time
- Quota consumption

**Usage Alerts**
- Near quota limit (80%)
- Quota exceeded
- Unusual usage patterns
- Potential abuse

## Security Features

### Two-Factor Authentication

Require 2FA for users:

**Admin-Enforced 2FA:**
1. Select user → **Security** → **Require 2FA**
2. User must enable 2FA on next login
3. Cannot access system without 2FA

**2FA Status:**
- Enabled/Disabled
- Last verification
- Backup codes remaining
- 2FA method (TOTP, SMS, etc.)

### Password Management

Manage user passwords:

**Reset Password**
1. Select user → **Security** → **Reset Password**
2. Generate temporary password
3. Email sent to user
4. User must change on next login

**Password Policies**
- Minimum length: 12 characters
- Require uppercase, lowercase, numbers, symbols
- No common passwords
- No password reuse (last 5)
- Expiration: 90 days (configurable)

### Login Security

Monitor and control login behavior:

**Failed Login Attempts**
- View failed login history
- IP addresses involved
- Lock account after 5 failures
- Auto-unlock after 30 minutes

**IP Whitelist**
- Restrict user to specific IPs
- Allow IP ranges
- Corporate network only
- VPN detection and blocking

## User Reports and Analytics

### User Behavior Reports

Generate reports on user behavior:

**Activity Reports**
- Login frequency
- Feature usage
- API endpoint usage
- Time-of-day patterns

**Engagement Reports**
- Active vs. inactive users
- Feature adoption rates
- User segments
- Retention cohorts

**Abuse Reports**
- Rate limit violations
- Quota exceeded incidents
- Suspicious activity
- Security violations

### Custom Reports

Create custom user reports:

1. **Admin Panel** → **Reports** → **Create Report**
2. Select report type:
   - User activity
   - API usage
   - Security events
   - Quota usage
3. Set date range
4. Apply filters
5. Choose format
6. Generate and download

## Best Practices

### User Management Best Practices

✅ **Do:**
- Regularly review user accounts for inactive users
- Monitor quota usage and adjust as needed
- Use role-based access control consistently
- Document role changes in audit logs
- Communicate with users about account changes
- Keep user data up-to-date
- Regular security audits

❌ **Don't:**
- Grant admin roles unnecessarily
- Ignore failed login attempts
- Skip documentation for role changes
- Delete users without verification
- Share user data without consent
- Ignore quota violations
- Allow inactive accounts indefinitely

### Security Recommendations

🔒 **Security best practices:**

1. **Least Privilege Principle**
   - Start with minimum permissions
   - Add permissions as needed
   - Regular permission reviews

2. **Regular Audits**
   - Monthly user list review
   - Quarterly role review
   - Annual security audit

3. **Monitor Activity**
   - Set up alerts for suspicious activity
   - Review login patterns
   - Track failed authentication

4. **Data Protection**
   - Encrypt sensitive user data
   - Secure backup of user data
   - Follow privacy regulations (GDPR, CCPA)

## Troubleshooting

### User Can't Login

**Symptoms:**
- Login fails with valid credentials
- "Account not found" error
- Infinite redirect loop

**Solutions:**
1. Verify user exists in database
2. Check account status (not banned/suspended)
3. Verify Discord ID matches
4. Check for IP blocks
5. Review failed login logs
6. Clear user sessions
7. Reset password

### User Permissions Not Updating

**Symptoms:**
- Role change not reflected
- User still has old permissions
- Access denied to new features

**Solutions:**
1. Verify role change was saved
2. Check audit log for confirmation
3. Have user logout and login again
4. Clear user sessions
5. Check permission cache
6. Verify role permissions are correct

### Quota Not Updating

**Symptoms:**
- Quota shows incorrect values
- User exceeds quota but not blocked
- Quota resets not working

**Solutions:**
1. Check quota configuration
2. Verify Redis connection
3. Manually reset quota
4. Check scheduled task logs
5. Review quota calculation logic

## Related Documentation

- [Admin Panel](./panel) - Admin panel overview
- [Ban Management](./ban-management) - Banning users
- [Permissions](./permissions) - Permission system
- [Audit Logs](./audit-logs) - Tracking changes
- [Security Settings](./security) - Security configuration

---

::: tip Need Help?
For additional support, check the [troubleshooting guide](/guide/troubleshooting) or open an issue on [GitHub](https://github.com/subculture-collective/discord-spywatcher/issues).
:::
