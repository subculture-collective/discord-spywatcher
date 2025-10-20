# Authentication & Authorization Enhancement - RBAC and Session Management

This document describes the enhanced authentication and authorization system with Role-Based Access Control (RBAC), session management, and secure OAuth flows.

## Overview

The system now includes:
- ✅ Role-Based Access Control (RBAC) with fine-grained permissions
- ✅ Enhanced session management with tracking and revocation
- ✅ Refresh token rotation with family tracking
- ✅ OAuth flow improvements with CSRF protection
- ✅ Login tracking and suspicious activity detection
- ✅ API key system for programmatic access

## Database Schema

### New Models

#### Permission
Defines available permissions in the system.

```prisma
model Permission {
  id          String   @id @default(cuid())
  name        String   @unique // e.g., "analytics.view", "users.ban"
  description String
  category    String   // e.g., "analytics", "admin"
  roles       RolePermission[]
}
```

#### RolePermission
Junction table linking roles to permissions.

```prisma
model RolePermission {
  role         Role       
  permissionId String
  permission   Permission @relation(fields: [permissionId], references: [id])
}
```

#### RefreshToken
Stores refresh tokens with rotation tracking.

```prisma
model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  familyId  String   // For token rotation detection
  used      Boolean  @default(false)
  revoked   Boolean  @default(false)
  expiresAt DateTime
  userAgent String?
  ipAddress String?
}
```

#### Session
Tracks active user sessions.

```prisma
model Session {
  id           String   @id @default(cuid())
  userId       String
  userAgent    String?
  ipAddress    String?
  lastActivity DateTime @default(now())
  expiresAt    DateTime
}
```

#### ApiKey
API keys for programmatic access.

```prisma
model ApiKey {
  id          String   @id @default(cuid())
  key         String   @unique  // Hashed
  name        String
  userId      String
  scopes      String   // JSON array of scopes
  lastUsedAt  DateTime?
  expiresAt   DateTime?
  revoked     Boolean  @default(false)
}
```

#### LoginLog
Tracks login attempts for security monitoring.

```prisma
model LoginLog {
  id         String   @id @default(cuid())
  userId     String
  ipAddress  String
  userAgent  String?
  success    Boolean
  reason     String?  // Failure reason
}
```

## Permission System

### Default Permissions

The system includes these default permissions:

**Analytics**
- `analytics.view` - View analytics data
- `analytics.export` - Export analytics data

**Users**
- `users.view` - View user list
- `users.ban` - Ban users
- `users.manage` - Manage user roles and permissions

**Guilds**
- `guilds.view` - View guild data
- `guilds.manage` - Manage guild settings

**Sessions**
- `sessions.view.own` - View own sessions
- `sessions.view.all` - View all user sessions
- `sessions.revoke.own` - Revoke own sessions
- `sessions.revoke.all` - Revoke any user sessions

**API Keys**
- `apikeys.create` - Create API keys
- `apikeys.view.own` - View own API keys
- `apikeys.revoke.own` - Revoke own API keys

**System**
- `system.admin` - Full system administration

### Role Permissions

Default permissions by role:

**ADMIN**: All permissions

**MODERATOR**: 
- analytics.view
- users.view
- users.ban
- guilds.view
- sessions.view.own
- sessions.revoke.own
- apikeys.create
- apikeys.view.own
- apikeys.revoke.own

**USER**:
- analytics.view
- guilds.view
- sessions.view.own
- sessions.revoke.own
- apikeys.create
- apikeys.view.own
- apikeys.revoke.own

**BANNED**: No permissions

### Seeding Permissions

Run the seed script to create default permissions:

```bash
npm run prisma:seed
```

## Enhanced Middleware

### requireAuth
Basic authentication with banned user check.

```typescript
import { requireAuth } from './middleware/auth';

router.get('/protected', requireAuth, (req, res) => {
  res.json({ user: req.user });
});
```

### requireRole
Requires specific role(s).

```typescript
import { requireRole } from './middleware/auth';
import { Role } from '@prisma/client';

router.post('/moderate', requireAuth, requireRole([Role.ADMIN, Role.MODERATOR]), (req, res) => {
  // Only admins and moderators can access
});
```

### requirePermission
Requires specific permission.

```typescript
import { requirePermission } from './middleware/auth';

router.get('/analytics', requireAuth, requirePermission('analytics.view'), (req, res) => {
  // Only users with analytics.view permission can access
});
```

### requireGuildAccess
Checks if user has access to a specific guild.

```typescript
import { requireGuildAccess } from './middleware/auth';

router.get('/guilds/:guildId/data', requireAuth, requireGuildAccess, (req, res) => {
  // Only users with access to this guild can view
});
```

### requireApiKey
Authenticates using API key.

```typescript
import { requireApiKey } from './middleware/apiKey';

router.get('/api/data', requireApiKey, (req, res) => {
  // API key authentication only
});
```

### requireAuthOrApiKey
Accepts either JWT or API key.

```typescript
import { requireAuthOrApiKey } from './middleware/apiKey';

router.get('/api/data', requireAuthOrApiKey, (req, res) => {
  // Either JWT or API key works
});
```

## API Endpoints

### OAuth & Authentication

#### GET /auth/discord
Discord OAuth callback with enhanced security.

**Features:**
- State parameter validation
- Scope validation
- Session creation
- Refresh token with rotation family
- Login logging
- Suspicious login detection

#### POST /auth/refresh
Refresh access token with rotation.

**Features:**
- Token rotation (old token marked as used)
- Family tracking
- Reuse detection (revokes entire family)
- Fingerprinting (user agent + IP)

#### POST /auth/logout
Logout and revoke refresh token.

### Session Management

#### GET /auth/sessions
List user's active sessions.

#### DELETE /auth/sessions/:sessionId
Revoke a specific session.

#### POST /auth/sessions/revoke-all
Force logout from all sessions.

#### GET /auth/login-history
View login history.

### API Key Management

#### POST /auth/api-keys
Generate a new API key.

**Required Permission:** `apikeys.create`

**Request:**
```json
{
  "name": "Production API Key",
  "scopes": ["analytics.view", "guilds.view"],
  "expiresInDays": 90
}
```

**Response:**
```json
{
  "id": "key-id",
  "key": "spy_live_abc123...",
  "name": "Production API Key",
  "scopes": ["analytics.view", "guilds.view"],
  "warning": "Save this key now. You will not be able to see it again."
}
```

#### GET /auth/api-keys
List user's API keys.

**Required Permission:** `apikeys.view.own`

#### DELETE /auth/api-keys/:keyId
Revoke an API key.

**Required Permission:** `apikeys.revoke.own`

### Admin Routes

#### GET /auth/admin/sessions
View all active sessions (admin only).

**Required Permission:** `sessions.view.all`

#### DELETE /auth/admin/sessions/:sessionId
Admin revoke any session.

**Required Permission:** `sessions.revoke.all`

#### POST /auth/admin/users/:userId/revoke-sessions
Revoke all sessions for a user.

**Required Permission:** `sessions.revoke.all`

#### GET /auth/admin/permissions
List all permissions (admin only).

#### GET /auth/admin/roles/:role/permissions
Get permissions for a role (admin only).

## Security Features

### Refresh Token Rotation

The system implements refresh token rotation to prevent token theft:

1. Each refresh creates a new token pair
2. Old refresh token is marked as "used"
3. All tokens belong to a "family" (familyId)
4. If a used token is reused, entire family is revoked

### Token Fingerprinting

Tokens are associated with:
- User Agent
- IP Address

This helps detect token theft across devices/locations.

### Session Limiting

- Maximum 5 concurrent sessions per user (configurable)
- Sessions expire after 7 days of inactivity
- Admin can revoke any session

### Login Tracking

All login attempts are logged with:
- Success/failure status
- IP address
- User agent
- Failure reason

### Suspicious Login Detection

The system detects:
- Logins from new IP addresses
- Multiple failed login attempts

### API Key Security

- Keys are hashed before storage (SHA-256)
- Plain key shown only once at creation
- Keys can be scoped to specific permissions
- Keys can have expiration dates
- Usage tracking (last used timestamp)

## Migration Guide

### 1. Run Prisma Migration

```bash
cd backend
npx prisma migrate dev --name add_rbac_session_management
```

### 2. Seed Permissions

```bash
npm run prisma:seed
```

### 3. Update Environment Variables

Ensure these are set in `.env`:

```env
JWT_SECRET=your-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### 4. Testing

Run tests:

```bash
npm test
```

All tests should pass (23 new tests added).

## Best Practices

### API Keys

1. **Scope appropriately** - Only grant necessary permissions
2. **Set expiration** - Use `expiresInDays` for production keys
3. **Rotate regularly** - Create new keys, revoke old ones
4. **Store securely** - Never commit keys to version control

### Sessions

1. **Regular cleanup** - Run cleanup job to remove expired sessions
2. **Monitor active sessions** - Alert on unusual session counts
3. **Revoke on password change** - Force re-authentication

### Permissions

1. **Principle of least privilege** - Grant minimum necessary permissions
2. **Regular audits** - Review role permissions periodically
3. **Test thoroughly** - Verify permission checks work correctly

## Support

For issues or questions, check the test files for usage examples or review the middleware source code.
