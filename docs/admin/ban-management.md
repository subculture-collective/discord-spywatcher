# Ban Management

Comprehensive guide to managing user bans, IP blocking, and abuse prevention in Spywatcher.

## Overview

Spywatcher's ban system provides multiple layers of protection:

- **User Bans**: Discord ID-based blocking
- **IP Bans**: Network-level blocking
- **Automatic Bans**: Policy-based auto-banning
- **Temporary Bans**: Time-limited restrictions
- **Ban Appeals**: Review and appeal process

## Ban Types

### User Ban

Blocks access based on Discord account:

**Scope:**
- Blocks specific Discord user
- Prevents authentication
- Revokes API access
- Terminates active sessions

**Use Cases:**
- Terms of service violations
- Abusive behavior
- Account compromise
- Policy violations

### IP Ban

Blocks access based on IP address:

**Scope:**
- Blocks entire IP address
- Affects all users from that IP
- Prevents new registrations
- Blocks API requests

**Use Cases:**
- DDoS attacks
- Automated abuse
- VPN/proxy abuse
- Multiple account violations

### Subnet Ban

Blocks IP ranges:

**Scope:**
- Blocks CIDR range (e.g., 192.168.1.0/24)
- Affects multiple IPs
- Useful for datacenter blocks

**Use Cases:**
- Datacenter abuse
- Known bot networks
- Geographic restrictions

## Creating Bans

### Ban a User

**Via Admin Panel:**

1. Navigate to **Admin Panel** → **Bans** → **Create Ban**

2. Select ban type: **User Ban**

3. Enter user details:
   ```
   Discord ID: 123456789012345678
   OR
   Username: @abusive_user
   ```

4. Configure ban settings:
   ```
   Duration: Permanent / Temporary (7 days, 30 days, custom)
   Reason: Harassment and abusive behavior
   Notify User: Yes / No
   Public Reason: [Optional] Displayed to user
   Internal Notes: [Optional] Admin-only notes
   ```

5. Click **Create Ban**

**Via API:**

```bash
POST /api/admin/bans
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json

{
  "type": "USER",
  "discordId": "123456789012345678",
  "duration": "PERMANENT",
  "reason": "Terms of service violation",
  "notifyUser": true,
  "publicReason": "Violation of community guidelines"
}
```

### Ban an IP Address

**Via Admin Panel:**

1. **Admin Panel** → **Bans** → **Create Ban**

2. Select ban type: **IP Ban**

3. Enter IP details:
   ```
   IP Address: 192.168.1.100
   OR
   Subnet: 192.168.1.0/24
   ```

4. Configure settings:
   ```
   Duration: 30 days
   Reason: Automated abuse detected
   Block Type: Hard / Soft
   Allow Whitelist Bypass: No
   ```

5. Click **Create Ban**

::: warning IP Bans
IP bans can affect multiple users. Use caution with shared IPs (offices, schools, cafes).
:::

### Temporary Bans

Create time-limited bans:

**Preset Durations:**
- 1 hour
- 24 hours
- 7 days
- 30 days
- 90 days

**Custom Duration:**
1. Select "Custom"
2. Set expiration date and time
3. Timezone: UTC (default)
4. Auto-unban when expired

**Auto-Expiration:**
- Ban automatically expires
- User access restored
- Email notification sent (optional)
- Audit log entry created

### Permanent Bans

Create indefinite bans:

**Characteristics:**
- No expiration date
- Requires manual review to lift
- Higher severity
- More detailed documentation required

**Requirements:**
- Detailed reason (minimum 50 characters)
- Review by senior admin (configurable)
- Notification to user (unless abusive)
- Appeal process information

## Viewing Bans

### Active Bans List

View all currently active bans:

**Admin Panel** → **Bans** → **Active**

**Display Information:**
- Ban ID
- Type (User/IP/Subnet)
- Target (Discord ID or IP)
- Banned by (admin)
- Ban date
- Expiration date
- Reason (truncated)
- Status

**Filter Options:**
- Ban type
- Duration (temporary/permanent)
- Date range
- Banned by admin
- Reason keywords

**Sort Options:**
- Most recent first
- Expiring soon
- Severity
- Ban type

### Ban Details

Click any ban to view full details:

**General Information**
- Ban ID
- Ban type
- Creation date
- Expiration date (if temporary)
- Last updated
- Status (active/expired/revoked)

**Target Information**
- Discord ID or IP address
- Associated accounts (for IP bans)
- Username(s)
- Registration date
- Previous violations

**Ban Details**
- Public reason (shown to user)
- Internal reason (admin-only)
- Evidence/notes
- Admin who created ban
- Review history

**Activity Since Ban**
- Access attempts
- API requests blocked
- Other violations

## Modifying Bans

### Edit Ban Details

Update existing ban information:

1. Select ban → **Actions** → **Edit**

2. Modifiable fields:
   - Reason (public and internal)
   - Expiration date (extend/shorten)
   - Notification settings
   - Severity level

3. Add edit reason: **Required**

4. Save changes

::: tip Audit Trail
All ban modifications are logged in the audit trail with reasons and admin details.
:::

### Extend Ban Duration

Increase ban length:

1. Select ban → **Actions** → **Extend**

2. Choose extension:
   - Add days: +7, +30, +90
   - Set new expiration date
   - Convert to permanent

3. Add reason for extension

4. Confirm extension

### Reduce Ban Duration

Shorten ban length:

1. Select ban → **Actions** → **Reduce**

2. Set new expiration:
   - Reduce by days: -7, -14
   - Set earlier expiration
   - Expire immediately (unban)

3. Add reason for reduction

4. Confirm changes

## Removing Bans

### Unban User

Remove active ban:

1. Select ban → **Actions** → **Unban**

2. Provide unban details:
   ```
   Reason: Appeal approved - evidence insufficient
   Notify User: Yes
   Restore Data: Yes / No
   Notes: User demonstrated understanding of rules
   ```

3. Confirm unban

**Effects:**
- Ban immediately removed
- User can login again
- API access restored
- Optional notification sent
- Audit log entry created

### Bulk Unban

Remove multiple bans:

1. **Admin Panel** → **Bans** → Select multiple bans

2. Click **Bulk Actions** → **Unban**

3. Apply filters (optional):
   - Only temporary bans
   - Expired bans
   - Specific admin's bans
   - Date range

4. Add bulk unban reason

5. Preview affected users

6. Confirm bulk unban

## Automatic Ban Rules

### Auto-Ban Configuration

Set up automatic bans based on behavior:

**Admin Panel** → **Settings** → **Auto-Ban Rules**

**Available Rules:**

**Rate Limit Violations**
```
Trigger: 5+ rate limit hits in 1 hour
Action: 24-hour IP ban
Notification: Email to admin
```

**Failed Authentication**
```
Trigger: 10+ failed login attempts in 15 minutes
Action: 1-hour IP ban
Escalation: 24 hours after 3rd occurrence
```

**API Abuse**
```
Trigger: 100+ quota exceeded errors in 1 day
Action: Suspend API access for 7 days
Review: Manual admin review required
```

**Suspicious Activity**
```
Trigger: 3+ different IPs in 1 hour
Action: Flag for review + temporary restriction
Notification: Security alert
```

### Creating Auto-Ban Rules

1. **Admin Panel** → **Settings** → **Auto-Ban Rules** → **Create**

2. Configure rule:
   ```yaml
   Rule Name: Excessive API Errors
   
   Trigger Conditions:
     - API Error Rate > 50% (over 100 requests)
     - Within 1 hour
   
   Action:
     - Ban Type: User Ban
     - Duration: 24 hours
     - Severity: Medium
   
   Notifications:
     - Email admin team
     - Log security event
   
   Exemptions:
     - Admin users
     - Whitelisted IPs
   ```

3. Test rule (dry-run mode)

4. Enable rule

### Managing Auto-Bans

**View Auto-Ban History:**
- Triggered rules
- Affected users
- Success rate
- False positives

**Adjust Sensitivity:**
- Threshold values
- Time windows
- Action severity
- Exemption lists

**Disable Rules:**
- Temporary disable
- Permanent disable
- Edit and re-enable

## Ban Appeals

### Appeal Process

Users can appeal bans:

**User Submits Appeal:**
1. User visits appeal page
2. Provides Discord ID or email
3. Explains why ban should be lifted
4. Provides evidence (optional)
5. Submits appeal

**Admin Reviews Appeal:**
1. **Admin Panel** → **Bans** → **Appeals**
2. Review appeal details
3. Check ban history
4. Review evidence
5. Make decision

### Appeal Decisions

**Approve Appeal:**
1. Select appeal → **Approve**
2. Unban user
3. Add approval notes
4. Send notification to user
5. Update records

**Deny Appeal:**
1. Select appeal → **Deny**
2. Provide detailed reason
3. Send notification to user
4. Log decision
5. Set re-appeal date (optional)

**Request More Information:**
1. Select appeal → **Request Info**
2. Specify what information needed
3. Send to user
4. Await response
5. Continue review

## Ban Analytics

### Ban Statistics

View ban metrics:

**Admin Panel** → **Analytics** → **Bans**

**Metrics:**
- Total active bans
- Bans created (daily/weekly/monthly)
- Ban type distribution
- Average ban duration
- Unban rate
- Appeal success rate

**Charts:**
- Bans over time
- Ban reasons distribution
- Admin ban activity
- Auto-ban triggers

### Ban Reports

Generate ban reports:

**Report Types:**

**Summary Report**
- Total bans by type
- Most common reasons
- Busiest admins
- Trend analysis

**Detailed Report**
- Individual ban records
- Full audit trail
- Evidence attached
- Appeal history

**Export Options:**
- CSV for spreadsheets
- JSON for processing
- PDF for documentation

## IP Ban Management

### IP Block Lists

Manage IP block lists:

**Admin Panel** → **Bans** → **IP Management**

**View Options:**
- Active IP bans
- Subnet bans
- Whitelisted IPs
- Blacklisted ranges

### Whitelist IPs

Exempt trusted IPs from bans:

1. **IP Management** → **Whitelist** → **Add**

2. Enter IP details:
   ```
   IP Address: 203.0.113.0
   OR
   IP Range: 203.0.113.0/24
   Label: Office Network
   Reason: Corporate IP range
   ```

3. Set priority (overrides auto-bans)

4. Save whitelist entry

### Blacklist IPs

Permanently block malicious IPs:

1. **IP Management** → **Blacklist** → **Add**

2. Configure block:
   ```
   IP/Range: 198.51.100.0/24
   Reason: Known bot network
   Block Level: Hard (no bypass)
   Expires: Never
   ```

3. Confirm block

### GeoIP Blocking

Block by geographic location:

**Admin Panel** → **Settings** → **GeoIP Blocking**

**Options:**
- Block specific countries
- Block regions
- Allow-list only mode
- VPN/Proxy detection

**Configuration:**
```yaml
Blocked Countries:
  - XX (Country code)
  - YY

Block VPNs: Yes
Block Proxies: Yes
Block Tor: Yes

Whitelist Exceptions:
  - Known VPN provider for staff
```

## Best Practices

### Ban Management Best Practices

✅ **Do:**
- Document ban reasons clearly
- Review temporary bans regularly
- Process appeals promptly
- Monitor auto-ban effectiveness
- Keep IP whitelist updated
- Communicate ban policies clearly
- Use progressive discipline

❌ **Don't:**
- Ban without clear evidence
- Use IP bans for user-specific issues
- Ignore ban appeals
- Create overly broad subnet bans
- Skip documentation
- Ban without notification (unless abuse)
- Keep unnecessary permanent bans

### When to Use Each Ban Type

**User Ban:**
- Individual policy violations
- Account-specific issues
- Harassment or abuse
- Terms of service violations

**IP Ban:**
- Automated attacks
- Rate limit abuse
- Multiple account violations
- Geographic threats

**Temporary Ban:**
- First-time offenses
- Warning period
- Cooling-off period
- Testing/verification

**Permanent Ban:**
- Severe violations
- Repeated offenses
- Malicious intent
- Security threats

## Troubleshooting

### Ban Not Working

**Symptoms:**
- User still accessing system
- API requests not blocked
- Ban shows active but ineffective

**Solutions:**
1. Check ban is saved correctly
2. Verify target (Discord ID or IP)
3. Check for whitelist entries
4. Clear Redis cache
5. Check active sessions
6. Verify middleware is running
7. Review ban configuration

### Can't Unban User

**Symptoms:**
- Unban action fails
- User still blocked after unban
- Error message displayed

**Solutions:**
1. Check admin permissions
2. Verify ban ID is correct
3. Clear ban cache
4. Check database connection
5. Review audit logs for errors
6. Try via API endpoint
7. Contact system administrator

### Auto-Ban Too Aggressive

**Symptoms:**
- Legitimate users getting banned
- High false positive rate
- Too many bans created

**Solutions:**
1. Review auto-ban rule thresholds
2. Adjust sensitivity settings
3. Add whitelist exemptions
4. Increase trigger windows
5. Add manual review step
6. Disable rule temporarily
7. Analyze ban patterns

### Appeal Not Showing

**Symptoms:**
- User submitted appeal but not visible
- Appeal notification not received
- Appeal form not working

**Solutions:**
1. Check appeal submission logs
2. Verify email configuration
3. Check spam filters
4. Review appeal queue filters
5. Check database for appeal record
6. Test appeal form
7. Verify notification settings

## Related Documentation

- [Admin Panel](./panel) - Admin panel overview
- [User Management](./user-management) - User administration
- [IP Blocking](./ip-blocking) - Advanced IP management
- [Security Settings](./security) - Security configuration
- [Audit Logs](./audit-logs) - Tracking ban actions

---

::: tip Need Help?
For additional support, check the [troubleshooting guide](/guide/troubleshooting) or open an issue on [GitHub](https://github.com/subculture-collective/discord-spywatcher/issues).
:::
