# Privacy & GDPR Compliance API Documentation

This document describes the privacy and GDPR compliance endpoints available in the Discord Spywatcher API.

## Table of Contents
- [User Privacy Endpoints](#user-privacy-endpoints)
- [Admin Privacy Management](#admin-privacy-management)
- [Data Models](#data-models)

## User Privacy Endpoints

### Export User Data (GDPR Article 15 - Right to Access)

**Endpoint:** `GET /api/privacy/export`

**Authentication:** Required (JWT token)

**Rate Limiting:** Standard auth limiter

**Description:** Exports all personal data associated with the authenticated user in machine-readable JSON format.

**Response:**
```json
{
  "exportDate": "2025-10-24T18:00:00.000Z",
  "exportVersion": "1.0",
  "userId": "user_cuid",
  "profile": {
    "id": "user_cuid",
    "discordId": "123456789",
    "username": "username",
    "discriminator": "0001",
    "avatar": "avatar_hash",
    "email": "user@example.com",
    "locale": "en-US",
    "verified": true,
    "role": "USER",
    "lastSeenAt": "2025-10-24T18:00:00.000Z",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-10-24T18:00:00.000Z"
  },
  "guilds": [...],
  "sessions": [...],
  "refreshTokens": [...],
  "apiKeys": [...],
  "loginLogs": [...],
  "consentLogs": [...],
  "deletionRequest": null,
  "activityData": {
    "presenceEvents": [...],
    "messageEvents": [...],
    "typingEvents": [...],
    "joinEvents": [...],
    "reactionTimes": [...],
    "roleChangeEvents": [...],
    "deletedMessageEvents": [...]
  }
}
```

**Notes:**
- Sensitive fields like access tokens and refresh tokens are excluded from the export
- The export includes all data categories: profile, guilds, sessions, activity data, etc.
- Audit log entry is created for this action

---

### Request Account Deletion (GDPR Article 17 - Right to Erasure)

**Endpoint:** `POST /api/privacy/delete-request`

**Authentication:** Required (JWT token)

**Rate Limiting:** Standard auth limiter

**Request Body:**
```json
{
  "reason": "Optional reason for deletion (max 500 characters)"
}
```

**Response:**
```json
{
  "message": "Account deletion requested",
  "scheduledFor": "2025-11-23T18:00:00.000Z",
  "gracePeriodDays": 30
}
```

**Description:** Creates a deletion request with a 30-day grace period. The account will be permanently deleted after the grace period unless cancelled.

**Notes:**
- Only one pending deletion request can exist per user
- Returns error if a pending request already exists
- Audit log entry is created for this action
- Email notification is not yet implemented (future enhancement)

---

### Cancel Account Deletion

**Endpoint:** `POST /api/privacy/cancel-deletion`

**Authentication:** Required (JWT token)

**Rate Limiting:** Standard auth limiter

**Response:**
```json
{
  "message": "Account deletion cancelled"
}
```

**Description:** Cancels a pending account deletion request.

**Notes:**
- Returns 404 if no pending deletion request exists
- Audit log entry is created for this action

---

### Get Deletion Status

**Endpoint:** `GET /api/privacy/deletion-status`

**Authentication:** Required (JWT token)

**Rate Limiting:** Standard auth limiter

**Response (No pending deletion):**
```json
{
  "hasPendingDeletion": false
}
```

**Response (Pending deletion):**
```json
{
  "hasPendingDeletion": true,
  "status": "PENDING",
  "requestedAt": "2025-10-24T18:00:00.000Z",
  "scheduledFor": "2025-11-23T18:00:00.000Z",
  "reason": "Optional reason"
}
```

**Description:** Returns the current deletion request status for the authenticated user.

---

### Update User Profile (GDPR Article 16 - Right to Rectification)

**Endpoint:** `PATCH /api/privacy/profile`

**Authentication:** Required (JWT token)

**Rate Limiting:** Standard auth limiter

**Request Body:**
```json
{
  "email": "newemail@example.com",
  "locale": "en-GB"
}
```

**Response:**
```json
{
  "message": "Profile updated",
  "user": {
    "id": "user_cuid",
    "discordId": "123456789",
    "username": "username",
    "discriminator": "0001",
    "email": "newemail@example.com",
    "locale": "en-GB"
  }
}
```

**Description:** Allows users to update specific profile fields (email and locale).

**Validation:**
- `email`: Optional, must be a valid email address
- `locale`: Optional, max 10 characters

**Notes:**
- At least one field must be provided
- Audit log entry is created for this action

---

## Admin Privacy Management

### Get All Audit Logs (Admin Only)

**Endpoint:** `GET /api/admin/privacy/audit-logs`

**Authentication:** Required (JWT token + ADMIN role)

**Rate Limiting:** Admin rate limiter

**Query Parameters:**
- `limit` (optional): Number of results to return (default: 100, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "logs": [
    {
      "id": "log_cuid",
      "userId": "user_cuid",
      "action": "DATA_EXPORTED",
      "details": {},
      "ipAddress": "127.0.0.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2025-10-24T18:00:00.000Z"
    }
  ],
  "pagination": {
    "limit": 100,
    "offset": 0,
    "total": 1543
  }
}
```

**Description:** Returns all audit logs for privacy-related actions across the platform.

**Audit Actions:**
- `ACCOUNT_CREATED`
- `ACCOUNT_DELETED`
- `ACCOUNT_DELETION_REQUESTED`
- `ACCOUNT_DELETION_CANCELLED`
- `DATA_EXPORTED`
- `DATA_UPDATED`
- `CONSENT_GRANTED`
- `CONSENT_REVOKED`
- `PRIVACY_SETTINGS_CHANGED`

---

### Get Pending Deletion Requests (Admin Only)

**Endpoint:** `GET /api/admin/privacy/deletion-requests`

**Authentication:** Required (JWT token + ADMIN role)

**Rate Limiting:** Admin rate limiter

**Response:**
```json
{
  "requests": [
    {
      "id": "deletion_cuid",
      "userId": "user_cuid",
      "user": {
        "discordId": "123456789",
        "username": "username",
        "email": "user@example.com"
      },
      "reason": "Optional reason",
      "requestedAt": "2025-10-24T18:00:00.000Z",
      "scheduledFor": "2025-11-23T18:00:00.000Z",
      "status": "PENDING"
    }
  ]
}
```

**Description:** Returns all pending account deletion requests for review.

---

### Get Data Retention Policies (Admin Only)

**Endpoint:** `GET /api/admin/privacy/retention-policies`

**Authentication:** Required (JWT token + ADMIN role)

**Rate Limiting:** Admin rate limiter

**Response:**
```json
{
  "policies": [
    {
      "id": "policy_cuid",
      "dataType": "MESSAGE_EVENTS",
      "retentionDays": 90,
      "description": "Default retention policy for MESSAGE_EVENTS",
      "enabled": true,
      "lastCleanupAt": "2025-10-24T02:00:00.000Z"
    }
  ]
}
```

**Description:** Returns all data retention policies configured in the system.

**Data Types:**
- `PRESENCE_EVENTS` (default: 90 days)
- `MESSAGE_EVENTS` (default: 90 days)
- `TYPING_EVENTS` (default: 90 days)
- `DELETED_MESSAGE_EVENTS` (default: 30 days)
- `JOIN_EVENTS` (default: 90 days)
- `REACTION_TIMES` (default: 90 days)
- `ROLE_CHANGE_EVENTS` (default: 90 days)
- `SESSIONS` (default: 30 days)
- `AUDIT_LOGS` (default: 365 days)

---

### Update Data Retention Policy (Admin Only)

**Endpoint:** `PATCH /api/admin/privacy/retention-policies/:dataType`

**Authentication:** Required (JWT token + ADMIN role)

**Rate Limiting:** Admin rate limiter

**Path Parameters:**
- `dataType`: The type of data to update (e.g., "MESSAGE_EVENTS")

**Request Body:**
```json
{
  "retentionDays": 60,
  "enabled": true
}
```

**Response:**
```json
{
  "message": "Retention policy updated",
  "dataType": "MESSAGE_EVENTS",
  "retentionDays": 60,
  "enabled": true
}
```

**Description:** Updates or creates a data retention policy for the specified data type.

**Validation:**
- `retentionDays`: Required, must be a positive integer (min: 1)
- `enabled`: Optional, boolean

---

### Trigger Manual Data Cleanup (Admin Only)

**Endpoint:** `POST /api/admin/privacy/cleanup`

**Authentication:** Required (JWT token + ADMIN role)

**Rate Limiting:** Admin rate limiter

**Response:**
```json
{
  "message": "Data cleanup completed",
  "results": {
    "PRESENCE_EVENTS": 1234,
    "MESSAGE_EVENTS": 5678,
    "TYPING_EVENTS": 234,
    "DELETED_MESSAGE_EVENTS": 123,
    "SESSIONS": 45
  }
}
```

**Description:** Manually triggers the data cleanup process based on configured retention policies.

**Notes:**
- This runs the same cleanup process that runs automatically daily at 2 AM
- Returns the number of records deleted for each data type
- Only processes data types with enabled retention policies

---

### Get Privacy Statistics (Admin Only)

**Endpoint:** `GET /api/admin/privacy/statistics`

**Authentication:** Required (JWT token + ADMIN role)

**Rate Limiting:** Admin rate limiter

**Response:**
```json
{
  "users": {
    "total": 1543
  },
  "deletions": {
    "pending": 3,
    "completed": 12
  },
  "dataExports": {
    "last30Days": 45
  },
  "consent": [
    {
      "type": "PRIVACY_POLICY",
      "count": 1200
    },
    {
      "type": "COOKIES",
      "count": 980
    }
  ]
}
```

**Description:** Returns aggregated privacy statistics for the platform.

---

## Data Models

### DeletionRequest

```typescript
{
  id: string;              // Unique identifier
  userId: string;          // User ID (unique constraint)
  reason: string | null;   // Optional deletion reason
  requestedAt: Date;       // When the request was made
  scheduledFor: Date;      // When the deletion will occur
  status: string;          // PENDING, CANCELLED, or COMPLETED
}
```

### AuditLog

```typescript
{
  id: string;              // Unique identifier
  userId: string | null;   // User ID (optional for system actions)
  action: string;          // Action type (e.g., DATA_EXPORTED)
  details: Json | null;    // Additional details about the action
  ipAddress: string | null; // IP address of the requester
  userAgent: string | null; // User agent of the requester
  createdAt: Date;         // When the action occurred
}
```

### ConsentLog

```typescript
{
  id: string;              // Unique identifier
  userId: string;          // User ID
  consentType: string;     // Type of consent (e.g., PRIVACY_POLICY)
  granted: boolean;        // Whether consent was granted or revoked
  version: string;         // Policy version
  createdAt: Date;         // When the consent was logged
}
```

### DataRetentionPolicy

```typescript
{
  id: string;              // Unique identifier
  dataType: string;        // Data type (unique constraint)
  retentionDays: number;   // Number of days to retain data
  description: string | null; // Optional description
  enabled: boolean;        // Whether the policy is active
  lastCleanupAt: Date | null; // Last cleanup timestamp
  createdAt: Date;         // When the policy was created
  updatedAt: Date;         // When the policy was last updated
}
```

---

## Scheduled Tasks

### Daily Cleanup Task

**Schedule:** Daily at 2:00 AM UTC

**Actions:**
1. Process pending account deletions (deletes accounts scheduled for deletion)
2. Clean up old data based on retention policies

**Implementation:**
The scheduled tasks are automatically started when the server starts and run every 24 hours.

---

## Security Considerations

1. **Authentication:** All privacy endpoints require valid JWT authentication
2. **Authorization:** Admin endpoints require ADMIN role
3. **Rate Limiting:** All endpoints are rate-limited to prevent abuse
4. **Audit Logging:** All privacy actions are logged with IP address and user agent
5. **Data Minimization:** Only necessary data is collected and stored
6. **Cascading Deletes:** Account deletion removes all related data (guilds, sessions, tokens, etc.)
7. **Validation:** All inputs are validated using Zod schemas

---

## Future Enhancements

- [ ] Email notifications for deletion requests and confirmations
- [ ] CSV export format support (in addition to JSON)
- [ ] Data anonymization (soft delete) option
- [ ] Granular consent management UI
- [ ] Privacy policy versioning and user acceptance tracking
- [ ] Data breach notification procedures
- [ ] Enhanced audit trail with detailed change tracking
- [ ] Automated privacy impact assessments
