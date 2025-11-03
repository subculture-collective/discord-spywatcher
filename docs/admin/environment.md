# Environment Variables

Complete reference for configuring Spywatcher through environment variables.

## Core Configuration

### Application

```bash
# Node environment
NODE_ENV=production|development|test

# Application URLs
FRONTEND_URL=https://app.spywatcher.com
BACKEND_URL=https://api.spywatcher.com

# Server ports
PORT=3001
FRONTEND_PORT=5173
```

### Discord

```bash
# Bot configuration
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
DISCORD_REDIRECT_URI=https://app.spywatcher.com/auth/callback

# Guild settings
DISCORD_GUILD_ID=your_guild_id  # Optional: primary guild
```

### Database

```bash
# PostgreSQL connection
DATABASE_URL=postgresql://user:password@localhost:5432/spywatcher

# Connection pool settings
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
DATABASE_TIMEOUT=30000
```

### Redis

```bash
# Redis connection
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password  # Optional

# Redis configuration
REDIS_DB=0
REDIS_KEY_PREFIX=spywatcher:
```

## Security

### Authentication

```bash
# JWT configuration
JWT_SECRET=your_secure_random_secret_here
JWT_EXPIRES_IN=7d

# Session configuration
SESSION_SECRET=another_secure_secret
SESSION_MAX_AGE=604800000  # 7 days in milliseconds
```

### Encryption

```bash
# Data encryption
ENCRYPTION_KEY=your_encryption_key_here
ENCRYPTION_ALGORITHM=aes-256-gcm
```

## Features

### Feature Flags

```bash
# Enable/disable features
FEATURE_GHOST_DETECTION=true
FEATURE_LURKER_DETECTION=true
FEATURE_SUSPICION_SCORING=true
FEATURE_PLUGINS=true
FEATURE_PUBLIC_API=true
FEATURE_WEBHOOKS=false
```

### Rate Limiting

```bash
# API rate limits (requests per minute)
RATE_LIMIT_FREE=10
RATE_LIMIT_PRO=100
RATE_LIMIT_ENTERPRISE=1000

# Daily quotas
QUOTA_FREE=1000
QUOTA_PRO=100000
QUOTA_ENTERPRISE=unlimited
```

## Monitoring

### Logging

```bash
# Log level
LOG_LEVEL=info|debug|warn|error

# Log format
LOG_FORMAT=json|pretty

# Log destination
LOG_FILE=/var/log/spywatcher/app.log
```

### Sentry

```bash
# Sentry error tracking
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
SENTRY_ENVIRONMENT=production
SENTRY_TRACE_SAMPLE_RATE=0.1
```

### Prometheus

```bash
# Prometheus metrics
PROMETHEUS_ENABLED=true
PROMETHEUS_PORT=9090
PROMETHEUS_PATH=/metrics
```

## Operations

### Backups

```bash
# Backup configuration
BACKUP_ENABLED=true
BACKUP_SCHEDULE="0 2 * * *"  # Daily at 2 AM
BACKUP_RETENTION_DAYS=30
BACKUP_LOCATION=/backups
```

### Maintenance

```bash
# Maintenance mode
MAINTENANCE_MODE=false
MAINTENANCE_MESSAGE="System maintenance in progress"
```

## Third-party Services

### Email (Optional)

```bash
# SMTP configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@spywatcher.com
SMTP_PASSWORD=your_smtp_password
SMTP_FROM=Spywatcher <noreply@spywatcher.com>
```

### Storage (Optional)

```bash
# S3-compatible storage
S3_ENABLED=false
S3_BUCKET=spywatcher-backups
S3_REGION=us-east-1
S3_ACCESS_KEY=your_access_key
S3_SECRET_KEY=your_secret_key
```

## Development

### Development-specific

```bash
# Development tools
DEBUG=*
HOT_RELOAD=true
SOURCE_MAPS=true

# Database
DATABASE_LOGGING=true
PRISMA_STUDIO_PORT=5555
```

### Testing

```bash
# Test environment
TEST_DATABASE_URL=postgresql://test:test@localhost:5432/spywatcher_test
TEST_REDIS_URL=redis://localhost:6380
```

## Environment Files

### Location

Environment files should be placed in:
- Root: `.env`
- Backend: `backend/.env`
- Frontend: `frontend/.env`

### Example Structure

```bash
# Root .env (shared)
NODE_ENV=production
DISCORD_BOT_TOKEN=token_here

# Backend .env (backend-specific)
DATABASE_URL=postgresql://...
PORT=3001

# Frontend .env (frontend-specific)
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

## Security Best Practices

### Secrets Management

1. **Never commit secrets** to version control
2. **Use strong random values** for secrets:
   ```bash
   openssl rand -base64 32
   ```
3. **Rotate secrets regularly**
4. **Use environment-specific files**
5. **Consider secret management tools** (Vault, AWS Secrets Manager)

### Access Control

1. Limit access to environment files
2. Use proper file permissions (600)
3. Encrypt sensitive values
4. Use different secrets per environment

## Validation

### Check Configuration

```bash
# Validate environment
npm run config:validate

# Show configuration (secrets hidden)
npm run config:show
```

### Required Variables

Minimum required for basic operation:
- `DISCORD_BOT_TOKEN`
- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `DATABASE_URL`
- `JWT_SECRET`

## Troubleshooting

### Missing Variables

Error: "Missing required environment variable"

**Solution:** Ensure all required variables are set in `.env`

### Invalid Values

Error: "Invalid configuration value"

**Solution:** Check variable formats match expected patterns

### Conflicts

Error: "Configuration conflict detected"

**Solution:** Ensure development and production configs don't conflict

## Related

- [Feature Flags](./feature-flags)
- [Security Settings](./security)
- [Deployment Guide](/developer/deployment)

::: warning Security
Never commit `.env` files to version control! Always use `.env.example` as a template.
:::
