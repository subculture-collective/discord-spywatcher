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

## 🏗️ Tech Stack

- **Backend**: Node.js, Express, TypeScript, Prisma, SQLite
- **Bot**: discord.js (presence + message tracking)
- **Frontend**: React + Vite + Tailwind CSS
- **Authentication**: Discord OAuth2 with JWT sessions

## 📦 Monorepo Structure

```bash
backend/        # Discord bot + API server
frontend/       # React + Vite frontend client
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
| `ENABLE_RATE_LIMITING` | Enable rate limiting | `true` | `true` or `false` |
| `ENABLE_IP_BLOCKING` | Enable IP blocking | `true` | `true` or `false` |
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
