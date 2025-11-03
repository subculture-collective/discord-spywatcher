# Security Settings

Comprehensive guide to security configuration, authentication, encryption, and security best practices for Spywatcher.

## Overview

Security settings control:

- **Authentication & Authorization**: User access control
- **Encryption**: Data protection at rest and in transit
- **API Security**: API keys, tokens, and access control
- **Session Management**: Session security and timeout
- **Security Headers**: HTTP security headers
- **Audit & Compliance**: Security logging and compliance

See [SECURITY.md](/SECURITY.md) for security policy and vulnerability reporting.

## Authentication Configuration

### Discord OAuth2

Configure Discord authentication:

**Admin Panel** → **Settings** → **Security** → **Authentication**

**OAuth2 Settings:**
```yaml
Discord OAuth2:
  Client ID: 123456789012345678
  Client Secret: [HIDDEN] ***********************
  Redirect URI: https://app.spywatcher.com/auth/callback
  
Scopes Required:
  ✅ identify
  ✅ guilds
  ✅ email (optional)

Bot Permissions:
  ✅ Read Messages
  ✅ View Channels
  ✅ Presence Intent
  ✅ Server Members Intent
```

**Environment Variables:**
```bash
# Discord OAuth2
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
DISCORD_REDIRECT_URI=https://app.spywatcher.com/auth/callback

# Bot
DISCORD_BOT_TOKEN=your_bot_token
```

::: warning Secrets Management
Never commit secrets to version control. Use environment variables or secrets management service.
:::

### JWT Configuration

Configure JSON Web Token settings:

**Token Settings:**
```yaml
JWT Configuration:
  Algorithm: HS256 (HMAC SHA-256)
  Secret: [CONFIGURED] ✅
  Secret Length: 64 characters (recommended: ≥32)
  
Access Token:
  Expiration: 15 minutes
  Refresh Enabled: Yes
  
Refresh Token:
  Expiration: 7 days
  Rotation: Enabled
  Reuse Grace Period: 10 seconds
```

**Environment Variables:**
```bash
# JWT Secrets (generate with: openssl rand -base64 32)
JWT_SECRET=your_secure_random_secret_min_32_chars
JWT_REFRESH_SECRET=different_secure_secret_min_32_chars

# Token Expiration
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

**Generate Secure Secrets:**
```bash
# Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or using OpenSSL
openssl rand -base64 32
```

### Session Management

Configure session security:

**Session Settings:**
```yaml
Sessions:
  Storage: Redis (recommended)
  Secret: [CONFIGURED] ✅
  Cookie Name: spywatcher.sid
  
Security:
  HTTP Only: Yes
  Secure: Yes (HTTPS only)
  Same Site: Strict
  
Timeout:
  Idle Timeout: 30 minutes
  Absolute Timeout: 24 hours
  Remember Me: 30 days (optional)
  
Concurrent Sessions:
  Max Per User: 5 sessions
  Exceed Action: Revoke oldest
```

**Session Environment:**
```bash
# Session Configuration
SESSION_SECRET=your_session_secret_min_32_chars
SESSION_MAX_AGE=86400000  # 24 hours in milliseconds
SESSION_SECURE=true  # Require HTTPS
SESSION_SAME_SITE=strict

# Redis for sessions
REDIS_URL=redis://localhost:6379
```

### Two-Factor Authentication (2FA)

Configure 2FA requirements:

**2FA Settings:**
```yaml
Two-Factor Authentication:
  Available Methods:
    ✅ TOTP (Google Authenticator, Authy)
    ✅ Backup Codes
    ⬜ SMS (not yet implemented)
    ⬜ Email (not yet implemented)
  
Requirements:
  - Admins: Required
  - Moderators: Recommended
  - Users: Optional
  
Enforcement:
  Grace Period: 7 days (for new admins)
  Backup Codes: 10 generated
  Recovery: Email to verified address
```

**Enforce 2FA:**
```bash
# Environment Configuration
REQUIRE_2FA_FOR_ADMINS=true
REQUIRE_2FA_FOR_MODERATORS=false
2FA_GRACE_PERIOD_DAYS=7
```

## API Security

### API Key Management

Configure API key security:

**API Key Settings:**
```yaml
API Keys:
  Format: spy_[env]_[32_random_chars]
  Example: spy_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
  
Security:
  Minimum Length: 32 characters
  Hashing: SHA-256
  Storage: Encrypted in database
  
Rotation:
  Auto-Expire: 90 days (configurable)
  Rotation Warning: 14 days before expiry
  Grace Period: 7 days after expiry
```

**API Key Permissions:**
```yaml
Per-Key Permissions:
  ✅ Scope restrictions
  ✅ IP whitelist
  ✅ Rate limit overrides
  ✅ Expiration dates
  ✅ Revocable anytime
```

### CORS Configuration

Configure Cross-Origin Resource Sharing:

**CORS Settings:**
```yaml
CORS Configuration:
  Mode: Whitelist (secure)
  
Allowed Origins:
  - https://app.spywatcher.com
  - https://dashboard.spywatcher.com
  - https://admin.spywatcher.com
  
Credentials: Yes
Methods: GET, POST, PUT, DELETE, PATCH
Headers: Authorization, Content-Type
Max Age: 86400 (24 hours)
```

**Environment Configuration:**
```bash
# CORS Configuration
CORS_ORIGINS=https://app.spywatcher.com,https://dashboard.spywatcher.com
CORS_CREDENTIALS=true
CORS_MAX_AGE=86400
```

### API Rate Limiting

See [Rate Limiting Configuration](./rate-limiting) for complete details.

**Quick Configuration:**
```yaml
API Rate Limiting:
  Global: 100 requests / 15 minutes
  Per Endpoint: Varies
  Per User: Tier-based
  Per IP: 1000 requests / 15 minutes
```

## Encryption

### Data at Rest

Configure database encryption:

**Encryption Settings:**
```yaml
Database Encryption:
  Method: AES-256-GCM
  Key Management: Environment variable
  Key Rotation: Manual (recommended: quarterly)
  
Encrypted Fields:
  ✅ API Keys
  ✅ OAuth Tokens
  ✅ Email Addresses
  ✅ IP Addresses (if logged)
  ⬜ Discord IDs (not sensitive)
  ⬜ Usernames (public data)
```

**Environment Configuration:**
```bash
# Encryption Key (generate: openssl rand -base64 32)
ENCRYPTION_KEY=your_encryption_key_32_chars_minimum
ENCRYPTION_ALGORITHM=aes-256-gcm
```

**Encrypt Backups:**
```bash
# Backup Encryption
ENABLE_ENCRYPTION=true
GPG_RECIPIENT=backups@example.com
BACKUP_ENCRYPTION_METHOD=GPG
```

### Data in Transit

Configure TLS/HTTPS:

**TLS Configuration:**
```yaml
TLS/HTTPS:
  Version: TLS 1.3 (minimum: TLS 1.2)
  Cipher Suites: Strong only
  
Certificate:
  Provider: Let's Encrypt / Commercial CA
  Renewal: Automatic (recommended)
  HSTS: Enabled
  
Force HTTPS: Yes
HTTP Redirect: 301 Permanent
```

**HTTPS Environment:**
```bash
# Force HTTPS
FORCE_HTTPS=true
HSTS_MAX_AGE=31536000  # 1 year
HSTS_INCLUDE_SUBDOMAINS=true
HSTS_PRELOAD=true
```

## Security Headers

### HTTP Security Headers

Configure security headers (via Helmet.js):

**Header Configuration:**
```yaml
Security Headers:
  
Content-Security-Policy:
  default-src: 'self'
  script-src: 'self' 'unsafe-inline' (minimize unsafe-inline)
  style-src: 'self' 'unsafe-inline'
  img-src: 'self' data: https:
  connect-src: 'self' https://discord.com
  
Strict-Transport-Security:
  max-age: 31536000 (1 year)
  includeSubDomains: true
  preload: true
  
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=()
```

**Environment Configuration:**
```bash
# Security Headers
ENABLE_SECURITY_HEADERS=true
CSP_ENABLED=true
HSTS_ENABLED=true
```

## Access Control

### Role-Based Access Control (RBAC)

See [Permission Management](./permissions) for complete details.

**Role Hierarchy:**
```
SUPER_ADMIN > ADMIN > MODERATOR > USER > BANNED
```

**Default Permissions:**
```yaml
USER:
  - Read own data
  - Access dashboard
  - Use public API

MODERATOR:
  - USER permissions
  - View reports
  - Temporary bans
  - Limited admin panel

ADMIN:
  - MODERATOR permissions
  - Full user management
  - System configuration
  - Audit logs access

SUPER_ADMIN:
  - ALL permissions
  - System administration
  - Security settings
  - Infrastructure access
```

### Admin Verification

Configure admin verification:

**Admin Configuration:**
```bash
# Admin Discord IDs (comma-separated)
ADMIN_DISCORD_IDS=123456789012345678,987654321098765432

# Super Admin (limited to 2-3 people)
SUPER_ADMIN_DISCORD_IDS=123456789012345678
```

**Admin Verification Process:**
1. User authenticates via Discord
2. System checks Discord ID against admin list
3. Assigns appropriate role
4. Logs admin access
5. Enforces 2FA if required

## IP Security

### IP Whitelisting

Allow access from trusted IPs only:

**Whitelist Configuration:**
```yaml
IP Whitelist:
  Enabled: No (default: allow all)
  Mode: Blacklist (block specific) / Whitelist (allow only)
  
Trusted IPs:
  - 203.0.113.0/24 (Corporate network)
  - 198.51.100.42 (Office static IP)
  - 192.0.2.10 (VPN endpoint)

Apply To:
  - Admin panel: Yes
  - API endpoints: No
  - Authentication: No
```

### GeoIP Blocking

Block by geographic location:

**GeoIP Configuration:**
```yaml
GeoIP Blocking:
  Enabled: No (default)
  
Blocked Countries: []
Allowed Countries: [] (empty = all allowed)

Exceptions:
  - Admin IPs bypass
  - Known VPN for staff
```

See [IP Blocking](./ip-blocking) for complete IP security configuration.

## Security Monitoring

### Audit Logging

All security events are logged:

**Security Events Logged:**
- Authentication attempts (success/failure)
- Authorization failures
- Token generation/revocation
- Admin actions
- Configuration changes
- Security policy violations
- IP blocks
- Rate limit violations

See [Audit Logs](./audit-logs) for complete audit logging documentation.

### Security Alerts

Configure real-time security alerts:

**Alert Configuration:**

**Failed Login Alerts:**
```yaml
Alert: Multiple Failed Logins
Trigger: 5 failed attempts in 15 minutes
Severity: HIGH
Notification: Email security team
Action: Temporary IP block
```

**Privilege Escalation:**
```yaml
Alert: Admin Role Granted
Trigger: User promoted to ADMIN/SUPER_ADMIN
Severity: CRITICAL
Notification: All admins + SMS
Action: Log + manual review
```

**Unusual Access Pattern:**
```yaml
Alert: After-Hours Admin Access
Trigger: Admin login outside 9am-5pm
Severity: MEDIUM
Notification: Email admin team
Action: Log + 2FA verification
```

## Compliance

### GDPR Compliance

Configure GDPR compliance features:

**GDPR Settings:**
```yaml
GDPR Compliance:
  Data Processing Agreement: Yes
  Privacy Policy: /privacy
  Terms of Service: /terms
  
User Rights:
  ✅ Right to Access: Data export available
  ✅ Right to Erasure: Account deletion
  ✅ Right to Portability: Export in JSON
  ✅ Right to Rectification: Profile editing
  
Data Retention:
  Active Users: Indefinite
  Inactive Users: 2 years
  Deleted Users: 30 days (then purged)
  Audit Logs: 2 years
  Backups: Encrypted, 90 days
```

**Environment Configuration:**
```bash
# GDPR Compliance
ENABLE_GDPR_MODE=true
DATA_RETENTION_DAYS=730
DELETED_USER_RETENTION_DAYS=30
```

### SOC 2 Compliance

Configure SOC 2 controls:

**SOC 2 Controls:**
```yaml
Access Control:
  ✅ RBAC implemented
  ✅ 2FA for admins
  ✅ Session timeout
  ✅ Audit logging

Data Protection:
  ✅ Encryption at rest
  ✅ Encryption in transit
  ✅ Secure backups
  ✅ Key management

Monitoring:
  ✅ Security monitoring
  ✅ Intrusion detection
  ✅ Audit trails
  ✅ Incident response

Availability:
  ✅ High availability setup
  ✅ Backup strategy
  ✅ Disaster recovery
  ✅ Monitoring and alerts
```

## Incident Response

### Security Incident Workflow

**Incident Detection:**
1. Alert triggered or reported
2. Initial assessment
3. Severity classification
4. Incident response team notified

**Incident Response:**
1. Contain the incident
2. Investigate root cause
3. Implement fixes
4. Document incident
5. Post-mortem review

See [Incident Response](./incident-response) for complete procedures.

### Security Hardening

**Hardening Checklist:**

✅ **Authentication & Authorization:**
- [ ] 2FA enforced for admins
- [ ] Strong password policy
- [ ] Session timeout configured
- [ ] JWT secrets rotated quarterly

✅ **Network Security:**
- [ ] HTTPS enforced
- [ ] HSTS enabled
- [ ] Security headers configured
- [ ] CORS properly configured

✅ **API Security:**
- [ ] Rate limiting enabled
- [ ] API keys securely stored
- [ ] Endpoint authentication required
- [ ] Input validation implemented

✅ **Data Protection:**
- [ ] Encryption at rest enabled
- [ ] Backups encrypted
- [ ] PII properly protected
- [ ] Secure key management

✅ **Monitoring:**
- [ ] Audit logging enabled
- [ ] Security alerts configured
- [ ] Intrusion detection active
- [ ] Regular log reviews

## Best Practices

### Security Best Practices

✅ **Do:**
- Use strong, unique secrets (≥32 characters)
- Rotate secrets regularly (quarterly)
- Enable 2FA for all admins
- Encrypt sensitive data
- Use HTTPS everywhere
- Monitor security logs
- Regular security audits
- Keep dependencies updated
- Follow principle of least privilege
- Document security policies

❌ **Don't:**
- Commit secrets to version control
- Use default/weak secrets
- Disable security features
- Ignore security alerts
- Share admin accounts
- Skip security updates
- Store passwords in plain text
- Expose admin endpoints publicly
- Grant unnecessary permissions
- Skip security testing

### Secret Management

**Storing Secrets:**

**Development:**
```bash
# Use .env file (gitignored)
JWT_SECRET=dev_secret_not_for_production
```

**Production:**
```bash
# Use secrets management service
# - AWS Secrets Manager
# - HashiCorp Vault
# - Azure Key Vault
# - Google Secret Manager

# Or secure environment variables
# Set via deployment platform
```

**Never:**
```bash
❌ const SECRET = "hardcoded-secret";
❌ git commit -m "added secrets"
❌ console.log(process.env.JWT_SECRET);
```

## Troubleshooting

### Authentication Failing

**Symptoms:**
- Users can't login
- "Authentication failed" errors
- OAuth redirect errors

**Solutions:**
1. Verify Discord client ID/secret
2. Check redirect URI matches exactly
3. Verify bot token is valid
4. Check OAuth scopes
5. Review Discord Developer Portal settings
6. Check CORS configuration
7. Review authentication logs

### JWT Token Errors

**Symptoms:**
- "Invalid token" errors
- Token expired immediately
- Refresh token not working

**Solutions:**
1. Verify JWT secrets are set
2. Check secret length (≥32 chars)
3. Verify token expiration settings
4. Check system clock synchronization
5. Review token generation logs
6. Verify Redis connection (if used)
7. Check refresh token rotation

### CORS Errors

**Symptoms:**
- "CORS policy" errors in browser
- API requests blocked
- Preflight requests failing

**Solutions:**
1. Verify origin in CORS_ORIGINS
2. Check protocol (http vs https)
3. Verify port numbers
4. Check credentials setting
5. Review allowed methods
6. Check headers configuration
7. Verify browser not caching old CORS policy

## Related Documentation

- [Admin Panel](./panel) - Admin panel overview
- [Rate Limiting](./rate-limiting) - API rate limits
- [IP Blocking](./ip-blocking) - Network security
- [Audit Logs](./audit-logs) - Security logging
- [Incident Response](./incident-response) - Security incidents
- [SECURITY.md](/SECURITY.md) - Security policy

---

::: tip Need Help?
For security concerns or vulnerability reports, see our [Security Policy](/SECURITY.md) or contact security@spywatcher.com
:::
