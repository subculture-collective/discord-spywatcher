# Spywatcher

[![Backend CI](https://github.com/subculture-collective/discord-spywatcher/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/subculture-collective/discord-spywatcher/actions/workflows/backend-ci.yml)
[![Frontend CI](https://github.com/subculture-collective/discord-spywatcher/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/subculture-collective/discord-spywatcher/actions/workflows/frontend-ci.yml)
[![Security Scan](https://github.com/subculture-collective/discord-spywatcher/actions/workflows/security.yml/badge.svg)](https://github.com/subculture-collective/discord-spywatcher/actions/workflows/security.yml)

Spywatcher is a full-stack surveillance and analytics tool for Discord servers. It consists of a presence-monitoring Discord bot and a web-based dashboard powered by a REST API.

## 🧩 Features

- Detects multi-client logins (web, mobile, desktop simultaneously)
- Tracks inactive users, lurkers, and behavioral shifts
- Offers analytics endpoints for presence and role drift
- Includes a React-based frontend with dashboards and settings
- Secure Discord OAuth2 authentication
- **Public API** with comprehensive documentation for third-party integrations
- **Official TypeScript/JavaScript SDK** for easy API access
- **Tier-based quotas** with FREE, PRO, and ENTERPRISE subscription tiers
- **Per-endpoint rate limiting** and daily usage quotas

## 🏗️ Tech Stack

- **Backend**: Node.js, Express, TypeScript, Prisma, SQLite
- **Bot**: discord.js (presence + message tracking)
- **Frontend**: React + Vite + Tailwind CSS
- **Authentication**: Discord OAuth2 with JWT sessions

## 📦 Monorepo Structure

```bash
backend/        # Discord bot + API server
frontend/       # React + Vite frontend client
sdk/            # TypeScript/JavaScript SDK for API integration
docs/           # Comprehensive documentation
.github/        # CI/CD workflows and automation
```

## 🔄 CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment:

- **Backend CI**: TypeScript compilation, Prisma validation, and builds
- **Frontend CI**: ESLint, TypeScript checks, and Vite builds
- **Security Scanning**: CodeQL analysis, dependency scanning, and secret detection
- **Automated Deployment**: Staging and production deployment workflows
- **Dependabot**: Automated dependency updates

See [CI/CD Documentation](.github/CI_CD_DOCUMENTATION.md) for more details.

## 🚀 Getting Started

### Using Docker (Recommended)

The easiest way to run the application is using Docker:

```bash
# Copy environment file and configure
cp .env.example .env
# Edit .env with your Discord credentials

# Start development environment
docker-compose -f docker-compose.dev.yml up
```

Access the application:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- PostgreSQL: localhost:5432

See [DOCKER.md](./DOCKER.md) for detailed Docker setup and usage.

### Manual Setup

#### Backend

```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run dev          # Start Discord bot
npm run dev:api      # Start API server
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 🧪 Testing

The project includes comprehensive unit, integration, and end-to-end tests.

### Backend Tests

```bash
cd backend
npm test                  # Run all tests
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Run tests with coverage report
npm run test:unit         # Run only unit tests
npm run test:integration  # Run only integration tests
```

### Frontend Tests

```bash
cd frontend
npm test                  # Run unit/integration tests
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Run tests with coverage report
npm run test:e2e          # Run E2E tests with Playwright
npm run test:e2e:ui       # Run E2E tests with Playwright UI
```

**Test Coverage:**

- Backend: >80% code coverage (55 tests)
- Frontend: >70% code coverage (19 tests)

For detailed testing documentation, see [TESTING.md](./TESTING.md).

## 🔐 Environment Variables

Spywatcher uses environment variables for configuration with strict validation to ensure security and proper setup.

### Backend Configuration

Copy `backend/.env.example` to `backend/.env` and configure the following variables:

#### Required Variables

| Variable | Description | Example | Validation |
|----------|-------------|---------|------------|
| `DISCORD_BOT_TOKEN` | Discord bot token from Developer Portal | `MTk...` | Min 50 characters |
| `DISCORD_CLIENT_ID` | OAuth2 client ID | `123456789` | Min 10 characters |
| `DISCORD_CLIENT_SECRET` | OAuth2 client secret | `abc123...` | Min 20 characters |
| `DISCORD_REDIRECT_URI` | OAuth2 redirect URI | `http://localhost:5173/auth/callback` | Valid URL |
| `JWT_SECRET` | Secret for signing access tokens | `random-32-char-string` | Min 32 characters |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens | `another-32-char-string` | Min 32 characters |

#### Optional Variables

| Variable | Description | Default | Validation |
|----------|-------------|---------|------------|
| `NODE_ENV` | Environment mode | `development` | `development`, `staging`, `production`, `test` |
| `PORT` | Server port | `3001` | Positive integer |
| `DATABASE_URL` | PostgreSQL connection string | - | Valid URL |
| `DISCORD_GUILD_ID` | Optional specific guild ID | - | String |
| `BOT_GUILD_IDS` | Comma-separated guild IDs to monitor | - | Comma-separated list |
| `ADMIN_DISCORD_IDS` | Comma-separated admin user IDs | - | Comma-separated list |
| `CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:5173` | Comma-separated URLs |
| `JWT_ACCESS_EXPIRES_IN` | Access token expiration | `15m` | Time string |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration | `7d` | Time string |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` | Valid URL |
| `ENABLE_RATE_LIMITING` | Enable rate limiting | `true` | `true` or `false` |
| `ENABLE_REDIS_RATE_LIMITING` | Enable Redis-backed rate limiting | `true` | `true` or `false` |
| `ENABLE_IP_BLOCKING` | Enable IP blocking | `true` | `true` or `false` |
| `ENABLE_LOAD_SHEDDING` | Enable load shedding under high load | `true` | `true` or `false` |
| `LOG_LEVEL` | Logging level | `info` | `error`, `warn`, `info`, `debug` |
| `FRONTEND_URL` | Frontend URL for redirects | - | Valid URL |

**Generate secure secrets:**
```bash
# Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Frontend Configuration

Copy `frontend/.env.example` to `frontend/.env` and configure:

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:3001/api` | Yes |
| `VITE_DISCORD_CLIENT_ID` | Discord OAuth2 client ID | `123456789` | Yes |
| `VITE_ENVIRONMENT` | Environment mode | `development` | No (default: `development`) |
| `VITE_ENABLE_ANALYTICS` | Enable analytics tracking | `false` | No (default: `false`) |
| `VITE_ANALYTICS_TRACKING_ID` | Analytics tracking ID | - | No |

**Important Notes:**
- All frontend variables must be prefixed with `VITE_` to be exposed to the browser
- Never include secrets in frontend environment variables
- Frontend variables are embedded in the build and publicly accessible
- The application will fail to start if required variables are missing or invalid

### Environment Validation

The backend uses [Zod](https://zod.dev/) for runtime environment validation:
- All required variables are validated on startup
- Type safety is enforced (strings, numbers, URLs, enums)
- Clear error messages for missing or invalid configuration
- Application exits with code 1 if validation fails

Example validation error:
```
❌ Invalid environment configuration:

  - DISCORD_BOT_TOKEN: Discord bot token must be at least 50 characters
  - JWT_SECRET: JWT secret must be at least 32 characters
  - DISCORD_REDIRECT_URI: Discord redirect URI must be a valid URL

💡 Check your .env file and ensure all required variables are set correctly.
```

## 🛡️ Security & Rate Limiting

Spywatcher implements comprehensive security measures to protect against abuse and ensure service availability:

- **Multi-layer rate limiting** with Redis-backed distributed storage
- **DDoS protection** including request validation, parameter limits, and header validation
- **IP blocking** with automatic abuse detection
- **Load management** with circuit breakers and load shedding under high load

See [RATE_LIMITING.md](./RATE_LIMITING.md) for detailed documentation on:
- Rate limiting configuration
- Endpoint-specific limits
- DDoS protection mechanisms
- Load shedding behavior
- Admin APIs for IP management

## 🗄️ Database & Connection Pooling

Spywatcher uses PostgreSQL with PgBouncer for efficient connection pooling and resource management:

- **PgBouncer** - Transaction-mode connection pooling for optimal performance
- **Prisma** - Type-safe database access with connection pool monitoring
- **Redis** - Distributed caching and rate limiting with connection management
- **Graceful shutdown** - Proper connection cleanup on application shutdown

See [CONNECTION_POOLING.md](./CONNECTION_POOLING.md) for detailed documentation on:
- PgBouncer setup and configuration
- Connection pool monitoring and metrics
- Database health checks and alerting
- Performance optimization strategies
- Troubleshooting connection issues

Additional database documentation:
- [POSTGRESQL.md](./POSTGRESQL.md) - PostgreSQL setup and management
- [DATABASE_OPTIMIZATION.md](./DATABASE_OPTIMIZATION.md) - Query optimization and indexing
- [docs/PGBOUNCER_SETUP.md](./docs/PGBOUNCER_SETUP.md) - Quick reference guide

## 🔄 Backup & Disaster Recovery

Spywatcher implements comprehensive backup and disaster recovery procedures to ensure data safety and business continuity:

- **Automated Backups** - Daily full backups and 6-hour incremental backups
- **WAL Archiving** - Point-in-time recovery (PITR) capability
- **Encrypted Backups** - GPG encryption for backup security
- **Multi-Region Storage** - Primary and secondary S3 buckets for redundancy
- **Backup Monitoring** - Automated health checks and alerting
- **Recovery Procedures** - Documented runbooks for various disaster scenarios

**Recovery Objectives:**
- **RTO** (Recovery Time Objective): < 4 hours
- **RPO** (Recovery Point Objective): < 1 hour

See [DISASTER_RECOVERY.md](./DISASTER_RECOVERY.md) for detailed documentation on:
- Backup strategy and configuration
- Automated backup scripts and schedules
- WAL archiving setup for PITR
- Recovery procedures for different scenarios
- Testing and drill schedules
- Monitoring and alerting setup

**Quick Commands:**
```bash
# Manual database backup
cd backend && npm run db:backup

# Restore from backup
cd backend && npm run db:restore

# Setup WAL archiving
cd scripts && ./setup-wal-archiving.sh

# Check backup health
cd backend && npm run backup:health-check
```

## 📊 Monitoring & Observability

Spywatcher includes comprehensive monitoring and observability features:

- **Sentry** - Error tracking and Application Performance Monitoring (APM)
- **Prometheus** - Metrics collection for system and application metrics
- **Winston** - Structured JSON logging with request correlation
- **Health checks** - Liveness and readiness probes for orchestrators
- **Grafana Loki** - Centralized log aggregation and analysis
- **Promtail** - Log collection and shipping from all services
- **Grafana** - Unified dashboards for logs and metrics

See [MONITORING.md](./MONITORING.md) for detailed documentation on:
- Sentry configuration and error tracking
- Prometheus metrics and custom instrumentation
- Health check endpoints
- Structured logging best practices
- Alert configuration examples
- Grafana dashboard creation

See [LOGGING.md](./LOGGING.md) for centralized logging documentation:
- Log aggregation with Grafana Loki
- Log search and filtering with LogQL
- Log retention policies (30-day default)
- Security event tracking
- Performance tuning and troubleshooting

## 🌐 Endpoints

Available at `http://localhost:3001`

### Analytics Routes

- `GET` `/ghosts`
- `GET` `/heatmap`
- `GET` `/lurkers`
- `GET` `/roles`
- `GET` `/clients`
- `GET` `/shifts`

#### Auth Routes

- `GET` `/discord`
- `POST` `/refresh`
- `POST` `/logout`
- `GET` `/me`
- `GET` `/settings`
- `GET` `/admin/users`
- `GET` `/debug/user/:discordId`

#### Bans Routes

- `GET` `/banned`
- `POST` `/ban`
- `POST` `/unban`
- `GET` `/userbans`
- `POST` `/userban`
- `POST` `/userunban`

#### Suspicion Routes

- `GET` `/suspicion`

## 🌐 Public API & SDK

Spywatcher provides a comprehensive public API for third-party integrations with an official TypeScript/JavaScript SDK.

### Quick Start with SDK

```bash
npm install @spywatcher/sdk
```

```typescript
import { Spywatcher } from '@spywatcher/sdk';

const client = new Spywatcher({
  baseUrl: 'https://api.spywatcher.com/api',
  apiKey: 'spy_live_your_api_key_here'
});

// Get ghost users
const ghosts = await client.analytics.getGhosts();

// Get suspicion data
const suspicions = await client.getSuspicionData();
```

### API Documentation

- **[Interactive API Documentation](./docs/API_DOCUMENTATION.md)** - OpenAPI/Swagger docs with screenshots
  - **Swagger UI**: `/api/docs` - Interactive testing interface
  - **ReDoc**: `/api/redoc` - Clean, professional documentation view
  - **OpenAPI Spec**: `/api/openapi.json` - Raw OpenAPI 3.0 specification
- **[Public API Reference](./docs/PUBLIC_API.md)** - Complete API documentation with examples
- **[Developer Guide](./docs/DEVELOPER_GUIDE.md)** - Step-by-step guide for building integrations
- **[SDK Documentation](./sdk/README.md)** - TypeScript/JavaScript SDK usage guide
- **[SDK Examples](./sdk/examples/)** - Complete example applications

### Features

- ✅ RESTful API with comprehensive endpoints
- ✅ API key authentication with OAuth2
- ✅ TypeScript SDK with full type definitions
- ✅ **Tier-based quota system** (FREE, PRO, ENTERPRISE)
- ✅ **Usage tracking** with daily quotas per endpoint category
- ✅ Rate limiting and security protection
- ✅ Complete API documentation (JSON & OpenAPI 3.0)
- ✅ Code examples in multiple languages
- ✅ Developer guides and best practices

### API Endpoints

Access API documentation at `/api/public/docs` or see the [Public API Reference](./docs/PUBLIC_API.md).

## 📊 Frontend Dashboard

- Visualize active/inactive users
- Detect suspicious logins
- Access admin-only controls and settings

## 🛠️ Build for Production

```bash
cd frontend
npm run build
```

Then serve using any static file host (e.g. Netlify, GitHub Pages)

## 🎨 Code Quality

This project uses comprehensive code quality tooling:

- **ESLint**: TypeScript linting with security and accessibility rules
- **Prettier**: Consistent code formatting
- **Husky**: Git hooks for pre-commit and pre-push validation
- **lint-staged**: Run linters on staged files only
- **Commitlint**: Enforce conventional commit messages
- **TypeScript**: Strict mode enabled with additional checks

### Running Linters

```bash
# Lint backend
cd backend && npm run lint

# Lint frontend
cd frontend && npm run lint

# Lint both (from root)
npm run lint

# Auto-fix issues
npm run lint:fix

# Format code
npm run format

# Type check
npm run type-check
```

### Git Hooks

Git hooks are automatically installed when you run `npm install` in the root directory:

- **Pre-commit**: Runs ESLint and Prettier on staged files
- **Pre-push**: Runs TypeScript type checking
- **Commit-msg**: Validates commit message format

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

## 👥 Contributions

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on contributing to this project.

---

Made with presence paranoia and healthy curiosity.
