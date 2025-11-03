# Permission Management

Comprehensive guide to managing permissions, access control, and security policies in Spywatcher.

## Overview

Spywatcher's permission system provides:

- **Role-Based Access Control (RBAC)**: Hierarchical role system
- **Granular Permissions**: Fine-tuned access control
- **Resource-Based Permissions**: Per-guild, per-feature access
- **API Permissions**: Control API endpoint access
- **Custom Permission Sets**: Create custom permission profiles

## Permission Model

### Permission Structure

Permissions follow a hierarchical structure:

```
PERMISSION_CATEGORY
└── PERMISSION_SUBCATEGORY
    └── SPECIFIC_PERMISSION
        └── ACTION
```

**Example:**
```
USERS
└── MANAGEMENT
    └── USER_ACCOUNTS
        └── CREATE
        └── READ
        └── UPDATE
        └── DELETE
```

### Permission Format

Permissions use dot notation:

```
users.management.accounts.create
users.management.accounts.read
users.management.accounts.update
users.management.accounts.delete
```

### Wildcard Permissions

Use wildcards for broad access:

```
users.*                    # All user permissions
users.management.*         # All user management permissions
*.read                     # Read access to everything
```

## Core Permissions

### User Management Permissions

**users.management.accounts**
```yaml
users.management.accounts.create
  - Create new user accounts
  - Default: ADMIN

users.management.accounts.read
  - View user account details
  - Default: MODERATOR

users.management.accounts.update
  - Modify existing user accounts
  - Default: ADMIN

users.management.accounts.delete
  - Delete user accounts
  - Default: SUPER_ADMIN

users.management.accounts.list
  - List all user accounts
  - Default: MODERATOR
```

**users.management.roles**
```yaml
users.management.roles.assign
  - Assign roles to users
  - Default: ADMIN

users.management.roles.revoke
  - Remove roles from users
  - Default: ADMIN

users.management.roles.create
  - Create custom roles
  - Default: SUPER_ADMIN

users.management.roles.modify
  - Edit existing roles
  - Default: SUPER_ADMIN
```

**users.management.permissions**
```yaml
users.management.permissions.view
  - View user permissions
  - Default: ADMIN

users.management.permissions.grant
  - Grant permissions to users
  - Default: SUPER_ADMIN

users.management.permissions.revoke
  - Revoke user permissions
  - Default: SUPER_ADMIN
```

### Guild Management Permissions

**guilds.management**
```yaml
guilds.management.read
  - View guild information
  - Default: USER

guilds.management.update
  - Modify guild settings
  - Default: ADMIN

guilds.management.members.read
  - View guild member list
  - Default: USER

guilds.management.analytics.read
  - View guild analytics
  - Default: USER
```

### Ban Management Permissions

**moderation.bans**
```yaml
moderation.bans.create
  - Create new bans
  - Default: MODERATOR

moderation.bans.read
  - View active bans
  - Default: MODERATOR

moderation.bans.update
  - Modify existing bans
  - Default: MODERATOR

moderation.bans.delete
  - Remove bans
  - Default: ADMIN

moderation.bans.permanent
  - Create permanent bans
  - Default: ADMIN

moderation.bans.ip
  - Create IP bans
  - Default: ADMIN
```

### System Administration Permissions

**system.admin**
```yaml
system.admin.config.read
  - View system configuration
  - Default: ADMIN

system.admin.config.write
  - Modify system configuration
  - Default: SUPER_ADMIN

system.admin.logs.read
  - View system logs
  - Default: ADMIN

system.admin.logs.export
  - Export system logs
  - Default: ADMIN

system.admin.maintenance
  - Perform maintenance operations
  - Default: SUPER_ADMIN
```

### API Permissions

**api.access**
```yaml
api.access.public
  - Access public API endpoints
  - Default: USER

api.access.admin
  - Access admin API endpoints
  - Default: ADMIN

api.access.keys.create
  - Create API keys
  - Default: USER

api.access.keys.revoke
  - Revoke API keys
  - Default: ADMIN
```

### Analytics Permissions

**analytics.data**
```yaml
analytics.data.ghosts.read
  - View ghost detection data
  - Default: USER

analytics.data.lurkers.read
  - View lurker detection data
  - Default: USER

analytics.data.suspicion.read
  - View suspicion scores
  - Default: USER

analytics.data.export
  - Export analytics data
  - Default: ADMIN
```

### Audit Log Permissions

**audit.logs**
```yaml
audit.logs.read
  - View audit logs
  - Default: ADMIN

audit.logs.export
  - Export audit logs
  - Default: ADMIN

audit.logs.delete
  - Delete audit logs
  - Default: SUPER_ADMIN
```

## Role Permissions

### Default Role Permissions

**USER Role:**
```yaml
Permissions:
  - guilds.management.read
  - guilds.management.members.read
  - guilds.management.analytics.read
  - analytics.data.ghosts.read
  - analytics.data.lurkers.read
  - analytics.data.suspicion.read
  - api.access.public
  - api.access.keys.create
```

**MODERATOR Role:**
```yaml
Inherits: USER permissions

Additional Permissions:
  - users.management.accounts.read
  - users.management.accounts.list
  - moderation.bans.create (temporary only)
  - moderation.bans.read
  - moderation.bans.update (own bans only)
  - audit.logs.read (limited)
```

**ADMIN Role:**
```yaml
Inherits: MODERATOR permissions

Additional Permissions:
  - users.management.accounts.create
  - users.management.accounts.update
  - users.management.accounts.delete
  - users.management.roles.assign
  - users.management.roles.revoke
  - guilds.management.update
  - moderation.bans.*
  - system.admin.config.read
  - system.admin.logs.read
  - system.admin.logs.export
  - api.access.admin
  - api.access.keys.revoke
  - analytics.data.export
  - audit.logs.read
  - audit.logs.export
```

**SUPER_ADMIN Role:**
```yaml
Inherits: ALL ADMIN permissions

Additional Permissions:
  - users.management.*
  - system.admin.*
  - audit.logs.delete
  - *.* (full access)
```

## Managing Permissions

### Viewing User Permissions

**Via Admin Panel:**

1. Navigate to **Admin Panel** → **Users** → Select user

2. Click **Permissions** tab

3. View permissions:
   ```
   Effective Permissions:
   ✅ users.management.accounts.read
   ✅ guilds.management.read
   ✅ analytics.data.ghosts.read
   ❌ system.admin.config.write
   
   Inherited from: ADMIN role
   Direct Grants: 2
   Role Permissions: 15
   Total: 17 permissions
   ```

**Via API:**

```bash
GET /api/admin/users/:userId/permissions
Authorization: Bearer YOUR_ADMIN_TOKEN

Response:
{
  "userId": "123456789012345678",
  "role": "ADMIN",
  "permissions": [
    "users.management.accounts.read",
    "guilds.management.read",
    ...
  ],
  "directGrants": [
    "analytics.data.export"
  ],
  "inheritedFromRole": [
    "users.management.accounts.read",
    ...
  ]
}
```

### Granting Permissions

**Grant Individual Permission:**

1. **Admin Panel** → **Users** → Select user → **Permissions**

2. Click **Grant Permission**

3. Enter permission:
   ```
   Permission: analytics.data.export
   Reason: User needs to export data for reports
   Expires: 2024-12-31 (optional)
   ```

4. Click **Grant**

**Grant Multiple Permissions:**

1. Select user → **Permissions** → **Bulk Grant**

2. Select permissions from list:
   - ☑ analytics.data.export
   - ☑ audit.logs.read
   - ☑ system.admin.logs.read

3. Add reason and expiration (optional)

4. Click **Grant Selected**

### Revoking Permissions

**Revoke Single Permission:**

1. Select user → **Permissions**

2. Find permission to revoke

3. Click **Revoke** next to permission

4. Add revocation reason

5. Confirm revocation

**Revoke All Custom Permissions:**

1. Select user → **Permissions**

2. Click **Revoke All Custom**

3. Confirm action

4. User retains only role-based permissions

## Custom Roles

### Creating Custom Roles

Create specialized roles:

1. **Admin Panel** → **Settings** → **Roles** → **Create Role**

2. Define role:
   ```yaml
   Role Name: Guild Moderator
   Description: Moderator for specific guilds
   Priority: 50 (between USER and MODERATOR)
   Color: #FFA500 (orange)
   ```

3. Select base permissions:
   - Copy from existing role: MODERATOR
   - OR start from scratch

4. Add/remove permissions:
   ```
   ✅ guilds.management.read
   ✅ guilds.management.update (limited to assigned guilds)
   ✅ moderation.bans.create (temporary only)
   ✅ analytics.data.*
   ❌ users.management.*
   ❌ system.admin.*
   ```

5. Set constraints:
   ```yaml
   Guild Restriction: Yes
   Allowed Guilds: Must be assigned
   Max Ban Duration: 7 days
   API Rate Limit: 100 req/min
   ```

6. Save role

### Editing Custom Roles

1. **Admin Panel** → **Settings** → **Roles**

2. Select role → **Edit**

3. Modify:
   - Role name/description
   - Permissions
   - Constraints
   - Priority

4. Save changes

::: warning Role Changes
Changes to role permissions affect all users with that role immediately.
:::

### Deleting Custom Roles

1. Select role → **Delete**

2. Choose action for existing users:
   - Assign to different role
   - Remove role (keep custom permissions)
   - Delete all associated permissions

3. Confirm deletion

## Permission Sets

### Creating Permission Sets

Group permissions for easy assignment:

1. **Admin Panel** → **Settings** → **Permission Sets** → **Create**

2. Define set:
   ```yaml
   Set Name: Analytics Access
   Description: Full analytics and reporting access
   Category: Analytics
   ```

3. Add permissions:
   ```
   - analytics.data.ghosts.read
   - analytics.data.lurkers.read
   - analytics.data.suspicion.read
   - analytics.data.export
   ```

4. Save set

### Applying Permission Sets

**Apply to User:**

1. Select user → **Permissions** → **Apply Set**

2. Choose permission set:
   - Analytics Access
   - Moderation Tools
   - Guild Management

3. Set expiration (optional)

4. Apply set

**Apply to Role:**

1. **Settings** → **Roles** → Select role

2. **Permissions** → **Apply Set**

3. Choose set and confirm

## Resource-Based Permissions

### Guild-Level Permissions

Restrict permissions to specific guilds:

**Grant Guild Access:**

1. Select user → **Permissions** → **Guild Access**

2. Add guild:
   ```yaml
   Guild: "Example Server" (123456789012345678)
   
   Permissions:
     - guilds.management.read
     - guilds.management.analytics.read
     - moderation.bans.create (guild-only)
   
   Expires: 2024-12-31
   ```

3. Save guild permissions

**User Can Now:**
- View this guild's data
- Access analytics for this guild
- Create bans in this guild only

**User Cannot:**
- Access other guilds
- Create system-wide bans
- Modify guild settings

### Feature-Level Permissions

Control feature access:

**Enable Feature:**

1. Select user → **Permissions** → **Features**

2. Toggle features:
   ```
   ☑ Ghost Detection
   ☑ Lurker Tracking
   ☑ Suspicion Scoring
   ☐ Plugin System
   ☐ Advanced Analytics
   ```

3. Save feature permissions

### API Endpoint Permissions

Fine-tune API access:

**Configure Endpoint Access:**

1. **Settings** → **API Permissions**

2. Set endpoint rules:
   ```yaml
   /api/analytics/ghosts:
     Roles: [USER, MODERATOR, ADMIN]
     Rate Limit: 100/hour
     
   /api/admin/users:
     Roles: [ADMIN, SUPER_ADMIN]
     Rate Limit: 1000/hour
     Requires: users.management.accounts.read
     
   /api/admin/system/config:
     Roles: [SUPER_ADMIN]
     Rate Limit: Unlimited
     Requires: system.admin.config.write
   ```

## Permission Policies

### Creating Policies

Define complex permission rules:

**Example Policy - Weekend Moderators:**

```yaml
Policy Name: Weekend Moderator Access
Description: Grant moderation powers on weekends only

Conditions:
  - Day of week: Saturday OR Sunday
  - Time: 00:00 - 23:59 UTC

Permissions:
  - moderation.bans.create
  - moderation.bans.update
  - audit.logs.read

Applied To:
  - Users with role: WEEKEND_MOD
```

**Example Policy - Regional Access:**

```yaml
Policy Name: EU Region Access
Description: Access limited to EU hours and IPs

Conditions:
  - Time: 08:00 - 20:00 CET
  - IP GeoLocation: European Union
  - OR: VPN allowlist

Permissions:
  - guilds.management.read
  - analytics.data.*

Applied To:
  - Users: [user1, user2, user3]
```

### Policy Evaluation

Policies are evaluated in order:

1. **Direct Permission Grants** (highest priority)
2. **Custom Role Permissions**
3. **Base Role Permissions**
4. **Policy-Based Permissions**
5. **Default Permissions** (lowest priority)

**Conflict Resolution:**
- Explicit DENY overrides any ALLOW
- More specific permission overrides wildcard
- Higher role overrides lower role

## Permission Auditing

### Audit Permission Changes

All permission changes are logged:

**View Permission Audit:**

**Admin Panel** → **Audit Logs** → Filter: **Permissions**

**Log Entry Example:**
```yaml
Timestamp: 2024-11-03 14:30:00 UTC
Action: PERMISSION_GRANTED
Admin: admin_user (987654321098765432)
Target: john_doe (123456789012345678)
Permission: analytics.data.export
Reason: Requested for quarterly reports
Previous State: Not granted
New State: Granted
Expires: 2024-12-31
```

### Permission Reports

Generate permission reports:

**User Permission Report:**
- List all users
- Show effective permissions
- Highlight custom grants
- Show expiring permissions

**Role Permission Report:**
- List all roles
- Show role hierarchy
- Display permission count
- Compare roles

**Unused Permission Report:**
- Permissions never used
- Rarely used permissions
- Obsolete permissions
- Recommendations

## Best Practices

### Permission Management Best Practices

✅ **Do:**
- Follow principle of least privilege
- Use roles for common permission sets
- Document permission grants
- Set expiration dates for temporary access
- Regular permission audits
- Review and remove unused permissions
- Use permission sets for consistency
- Test permission changes in staging

❌ **Don't:**
- Grant wildcard permissions unnecessarily
- Skip documentation for grants
- Forget to set expiration dates
- Give SUPER_ADMIN role casually
- Ignore audit logs
- Create too many custom roles
- Use overly broad permissions
- Skip permission reviews

### Security Guidelines

🔒 **Security best practices:**

1. **Minimal Access**
   - Start with minimum permissions
   - Add as needed
   - Regular reviews

2. **Time-Limited Access**
   - Use expiration dates
   - Automatic revocation
   - Renewal process

3. **Audit Everything**
   - Log all changes
   - Regular reviews
   - Anomaly detection

4. **Role Separation**
   - Separate admin duties
   - Multiple admin levels
   - No single point of control

5. **Documentation**
   - Document all grants
   - Reason for permissions
   - Review schedule

## Troubleshooting

### Permission Not Working

**Symptoms:**
- User can't access feature
- API returns 403 Forbidden
- Action button disabled

**Solutions:**
1. Check user's effective permissions
2. Verify role permissions
3. Check for expired grants
4. Review policy conditions
5. Check resource-level restrictions
6. Clear permission cache
7. Check audit logs for changes

### Permission Conflict

**Symptoms:**
- Inconsistent access
- Permission works sometimes
- Unexpected denials

**Solutions:**
1. Review permission hierarchy
2. Check for DENY rules
3. Review policy conditions (time, location)
4. Check multiple role assignments
5. Review permission priority
6. Check for bugs in permission logic

### Can't Grant Permission

**Symptoms:**
- Permission grant fails
- "Access denied" error
- Grant button disabled

**Solutions:**
1. Verify admin has permission to grant
2. Check permission exists in system
3. Review permission constraints
4. Check target user role
5. Verify not trying to grant higher privilege
6. Check permission grant limits

## Related Documentation

- [Admin Panel](./panel) - Admin panel overview
- [User Management](./user-management) - User administration
- [Security Settings](./security) - Security configuration
- [Audit Logs](./audit-logs) - Permission audit trail

---

::: tip Need Help?
For additional support, check the [troubleshooting guide](/guide/troubleshooting) or open an issue on [GitHub](https://github.com/subculture-collective/discord-spywatcher/issues).
:::
