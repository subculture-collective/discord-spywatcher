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

### Backend

```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run dev          # Start Discord bot
npm run dev:api      # Start API server
```

### Frontend

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

Configure the `.env` file in `backend/`:

```env
ADMIN_DISCORD_IDS=your_admin_discord_ids
BOT_GUILD_IDS=your_bot_guild_ids
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_GUILD_ID=your_discord_guild_id
DISCORD_REDIRECT_URI=your_discord_redirect_uri
JWT_REFRESH_SECRET=your_jwt_refresh_secret
JWT_SECRET=your_jwt_secret
NODE_ENV=your_node_env
PORT=your_port
```

Configure the `.env` file in `frontend/`:

```env
VITE_DISCORD_CLIENT_ID=your_vite_discord_client_id
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
