# Migration Guide: RBAC and Session Management

This guide will help you migrate your existing Discord SpyWatcher installation to use the new authentication and authorization system.

## Prerequisites

- Backup your database
- Review the [AUTH_RBAC_GUIDE.md](./AUTH_RBAC_GUIDE.md) for feature overview
- Update to the latest code from the PR

## Step-by-Step Migration

### Step 1: Backup Database

```bash
# For PostgreSQL
pg_dump -U your_user -d spywatcher > backup_$(date +%Y%m%d).sql

# Or using Prisma
npx prisma db pull
```

### Step 2: Update Dependencies

```bash
cd backend
npm install
```

### Step 3: Update Environment Variables

Add these to your `.env` file if not already present:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

Generate secure secrets:

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Run Database Migration

```bash
cd backend
npx prisma migrate dev --name add_rbac_session_management
```

This will:
- Add new tables: Permission, RolePermission, RefreshToken, Session, ApiKey, LoginLog
- Update User model with new relations
- Create necessary indexes

### Step 5: Seed Permissions

```bash
npm run prisma:seed
```

This creates:
- Default permissions (analytics, users, guilds, sessions, apikeys, system)
- Role-permission mappings for all roles

Verify permissions were created:

```bash
npx prisma studio
# Check Permission and RolePermission tables
```

### Step 6: Update Application Code

#### No Changes Required

The following existing features continue to work:
- OAuth login (`/auth/discord`)
- Token refresh (`/auth/refresh`)
- Logout (`/auth/logout`)
- User info (`/auth/me`)
- Basic `requireAuth` middleware

#### Optional: Add New Features

**Use Permission-Based Authorization:**

```typescript
// Before
router.get('/admin/users', requireAuth, requireAdmin, handler);

// After (more flexible)
router.get('/admin/users', requireAuth, requirePermission('users.view'), handler);
```

**Use Role-Based Authorization:**

```typescript
import { requireRole } from './middleware/auth';
import { Role } from '@prisma/client';

router.post('/moderate', 
  requireAuth, 
  requireRole([Role.ADMIN, Role.MODERATOR]), 
  handler
);
```

**Use Guild Access Control:**

```typescript
import { requireGuildAccess } from './middleware/auth';

router.get('/guilds/:guildId/analytics', 
  requireAuth, 
  requireGuildAccess, 
  handler
);
```

### Step 7: Test the Migration

Run the test suite:

```bash
npm test
```

Expected results:
- 95+ tests should pass
- 23 new tests for RBAC and sessions

Test manually:

1. **Login**: Visit the app and login via Discord
2. **Check Sessions**: GET `/auth/sessions` - should show current session
3. **Check Permissions**: Verify your role has expected permissions
4. **Test Refresh**: Let access token expire and verify auto-refresh works
5. **Create API Key**: POST `/auth/api-keys` with name and scopes

### Step 8: Frontend Updates (If Applicable)

#### Update Token Refresh Logic

The refresh endpoint now rotates tokens. Update your frontend to handle new refresh token in response cookie.

**Before:**
```typescript
// Old refresh might not update cookie
const response = await fetch('/auth/refresh', {
  method: 'POST',
  credentials: 'include'
});
```

**After:**
```typescript
// New refresh updates cookie automatically
const response = await fetch('/auth/refresh', {
  method: 'POST',
  credentials: 'include' // Important: ensure cookies are sent/received
});
```

#### Add Session Management UI (Optional)

```typescript
// Fetch active sessions
const sessions = await fetch('/auth/sessions', {
  headers: { Authorization: `Bearer ${accessToken}` }
});

// Revoke a session
await fetch(`/auth/sessions/${sessionId}`, {
  method: 'DELETE',
  headers: { Authorization: `Bearer ${accessToken}` }
});

// Revoke all sessions
await fetch('/auth/sessions/revoke-all', {
  method: 'POST',
  headers: { Authorization: `Bearer ${accessToken}` }
});
```

#### Add API Key Management UI (Optional)

```typescript
// Create API key
const response = await fetch('/auth/api-keys', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'My API Key',
    scopes: ['analytics.view', 'guilds.view'],
    expiresInDays: 90
  })
});

const { key } = await response.json();
// IMPORTANT: Display key to user and warn them to save it
```

### Step 9: Monitor and Verify

After deployment:

1. **Check Logs**: Monitor for any authentication errors
2. **Verify Sessions**: Ensure sessions are being created properly
3. **Test Revocation**: Try revoking a session and verify user is logged out
4. **Monitor Login History**: Check `/auth/login-history` for suspicious activity
5. **Review Permissions**: Verify users have appropriate access

### Step 10: Clean Up (Optional)

After confirming everything works:

1. **Remove Old Refresh Token Fields** (if desired):
   - User.refreshToken
   - User.refreshTokenIssuedAt
   
   These are now managed in the RefreshToken table.

2. **Set up Cleanup Jobs**:

```typescript
import { cleanupExpiredSessions } from './utils/sessions';
import { cleanupRefreshTokens } from './utils/refreshToken';

// Run daily at 2 AM
const job = new CronJob('0 2 * * *', async () => {
  console.log('Running cleanup jobs...');
  const sessions = await cleanupExpiredSessions();
  const tokens = await cleanupRefreshTokens();
  console.log(`Cleaned up ${sessions} sessions and ${tokens} tokens`);
});

job.start();
```

## Rollback Plan

If you need to rollback:

### Option 1: Revert Migration

```bash
# Revert the latest migration
npx prisma migrate resolve --rolled-back 20250xxx_add_rbac_session_management

# Restore from backup
psql -U your_user -d spywatcher < backup_YYYYMMDD.sql
```

### Option 2: Keep Schema, Disable Features

If you want to keep the new schema but disable features:

1. Don't use new middleware (`requirePermission`, `requireRole`, etc.)
2. Continue using old `requireAuth` and `requireAdmin`
3. Ignore new API endpoints for sessions and API keys

## Common Issues

### Issue: "Permission not found"

**Solution**: Run the seed script again:

```bash
npm run prisma:seed
```

### Issue: "Token reuse detected"

**Cause**: Client is making duplicate refresh requests

**Solution**: 
- Add debouncing to refresh logic
- Ensure only one refresh request at a time
- Check network for duplicate requests

### Issue: Sessions not being created

**Check**:
1. Ensure `/auth/discord` callback is being used (not old auth endpoint)
2. Verify session creation is not throwing errors (check logs)
3. Check database for session records

### Issue: API keys not working

**Check**:
1. Verify key format: `spy_live_...`
2. Check if key is revoked in database
3. Ensure using `requireApiKey` middleware
4. Verify key hasn't expired

## Performance Considerations

### Database Indexes

The migration creates these indexes automatically:
- RefreshToken: userId, familyId
- Session: userId
- ApiKey: userId
- LoginLog: userId, createdAt

### Query Optimization

For high-traffic apps, consider:

1. **Cache permissions** per role (they rarely change)
2. **Use connection pooling** for database
3. **Implement Redis** for session storage
4. **Add rate limiting** to auth endpoints

## Security Recommendations

After migration:

1. ✅ **Rotate JWT secrets** in production
2. ✅ **Force all users to re-login** (optional but recommended)
3. ✅ **Enable HTTPS** in production
4. ✅ **Set secure cookie flags** in production
5. ✅ **Monitor login attempts** for suspicious activity
6. ✅ **Set up alerting** for failed logins
7. ✅ **Review user roles** and permissions
8. ✅ **Document permission structure** for your team

## Support

If you encounter issues:

1. Check the test files for working examples
2. Review logs for detailed error messages
3. Verify environment variables are set correctly
4. Check database migrations applied successfully
5. Ensure all dependencies are installed

For questions, create an issue in the repository with:
- Error messages
- Steps to reproduce
- Environment details (Node version, database version, etc.)
