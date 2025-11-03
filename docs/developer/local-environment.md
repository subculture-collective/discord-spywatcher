# Local Development Environment Setup

This guide walks you through setting up Spywatcher for local development.

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

| Software | Minimum Version | Recommended | Download |
|----------|----------------|-------------|----------|
| **Node.js** | 18.0.0 | 18.20.0+ | [nodejs.org](https://nodejs.org/) |
| **npm** | 8.0.0 | 9.0.0+ | (included with Node.js) |
| **Git** | 2.30.0 | Latest | [git-scm.com](https://git-scm.com/) |
| **PostgreSQL** | 14.0 | 15.0+ | [postgresql.org](https://www.postgresql.org/) |
| **Redis** | 6.0 | 7.0+ | [redis.io](https://redis.io/) |

### Optional but Recommended

- **Docker Desktop**: For containerized development
- **VS Code**: Recommended editor with extensions
- **Postman**: For API testing
- **pgAdmin**: PostgreSQL GUI (optional)

### Discord Developer Account

You'll need a Discord bot and OAuth2 application:

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Note down the Client ID and Client Secret
4. Create a bot and get the bot token
5. Enable required intents:
   - Server Members Intent
   - Presence Intent
   - Message Content Intent

## Setup Methods

Choose one of these methods:

- **[Method 1: Docker (Recommended)](#method-1-docker-recommended)** - Fastest, most reliable
- **[Method 2: Manual Setup](#method-2-manual-setup)** - Full control, better for debugging

---

## Method 1: Docker (Recommended)

Docker provides the easiest and most consistent development environment.

### Step 1: Install Docker

**macOS/Windows:**
- Download [Docker Desktop](https://www.docker.com/products/docker-desktop)
- Install and start Docker Desktop

**Linux:**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get install docker-compose-plugin

# Add your user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### Step 2: Clone Repository

```bash
# Clone the repository
git clone https://github.com/subculture-collective/discord-spywatcher.git
cd discord-spywatcher

# Or if you've forked it
git clone https://github.com/YOUR_USERNAME/discord-spywatcher.git
cd discord-spywatcher
```

### Step 3: Configure Environment

```bash
# Copy environment file
cp .env.example .env

# Edit .env with your Discord credentials
nano .env  # or use your preferred editor
```

**Required environment variables:**

```bash
# Discord Bot Configuration
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
DISCORD_REDIRECT_URI=http://localhost:5173/auth/callback

# JWT Secrets (generate secure random strings)
JWT_SECRET=your_secret_key_minimum_32_characters_long
JWT_REFRESH_SECRET=your_refresh_secret_minimum_32_characters

# Database
DATABASE_URL=postgresql://spywatcher:spywatcher@postgres:5432/spywatcher

# Redis
REDIS_URL=redis://redis:6379

# Environment
NODE_ENV=development
```

**Generate secure secrets:**

```bash
# On Linux/macOS
openssl rand -hex 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Start Development Environment

```bash
# Start all services
docker-compose -f docker-compose.dev.yml up

# Or run in background
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

### Step 5: Access the Application

Once started, access:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### Step 6: Run Database Migrations

```bash
# Enter backend container
docker-compose -f docker-compose.dev.yml exec backend sh

# Run migrations
npx prisma migrate dev

# Optionally seed database
npx prisma db seed

# Exit container
exit
```

### Docker Commands

```bash
# Stop all services
docker-compose -f docker-compose.dev.yml down

# Stop and remove volumes (clean slate)
docker-compose -f docker-compose.dev.yml down -v

# Rebuild containers
docker-compose -f docker-compose.dev.yml up --build

# View logs for specific service
docker-compose -f docker-compose.dev.yml logs -f backend

# Execute command in container
docker-compose -f docker-compose.dev.yml exec backend npm run test

# List running containers
docker-compose -f docker-compose.dev.yml ps
```

---

## Method 2: Manual Setup

For developers who prefer direct control or need to debug services individually.

### Step 1: Install Dependencies

#### PostgreSQL

**macOS (Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Windows:**
- Download installer from [postgresql.org](https://www.postgresql.org/download/windows/)
- Run installer and follow prompts

#### Redis

**macOS (Homebrew):**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

**Windows:**
- Download from [Redis Windows](https://github.com/microsoftarchive/redis/releases)
- Or use WSL2 and follow Linux instructions

### Step 2: Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE spywatcher;
CREATE USER spywatcher WITH PASSWORD 'spywatcher';
GRANT ALL PRIVILEGES ON DATABASE spywatcher TO spywatcher;

# Exit psql
\q
```

### Step 3: Clone and Install

```bash
# Clone repository
git clone https://github.com/subculture-collective/discord-spywatcher.git
cd discord-spywatcher

# Install root dependencies (git hooks, etc.)
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 4: Configure Environment

```bash
# Backend environment
cd backend
cp .env.example .env
nano .env

# Frontend environment
cd ../frontend
cp .env.example .env
nano .env
```

**Backend `.env`:**
```bash
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
DISCORD_REDIRECT_URI=http://localhost:5173/auth/callback

JWT_SECRET=generate_32_character_secret
JWT_REFRESH_SECRET=generate_32_character_secret

DATABASE_URL=postgresql://spywatcher:spywatcher@localhost:5432/spywatcher
REDIS_URL=redis://localhost:6379

NODE_ENV=development
PORT=3001

CORS_ORIGINS=http://localhost:5173
```

**Frontend `.env`:**
```bash
VITE_API_URL=http://localhost:3001/api
VITE_DISCORD_CLIENT_ID=your_client_id
VITE_ENVIRONMENT=development
```

### Step 5: Database Setup

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Seed database
npx prisma db seed
```

### Step 6: Start Services

Open **4 terminal windows**:

**Terminal 1 - Discord Bot:**
```bash
cd backend
npm run dev
```

**Terminal 2 - API Server:**
```bash
cd backend
npm run dev:api
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 4 - Redis (if not running as service):**
```bash
redis-server
```

### Alternative: Use PM2 for Process Management

```bash
# Install PM2 globally
npm install -g pm2

# Start all services
pm2 start ecosystem.config.js

# View logs
pm2 logs

# Stop all
pm2 stop all

# Restart all
pm2 restart all
```

Create `ecosystem.config.js` in project root:

```javascript
module.exports = {
  apps: [
    {
      name: 'bot',
      cwd: './backend',
      script: 'npm',
      args: 'run dev',
      env: { NODE_ENV: 'development' }
    },
    {
      name: 'api',
      cwd: './backend',
      script: 'npm',
      args: 'run dev:api',
      env: { NODE_ENV: 'development' }
    },
    {
      name: 'frontend',
      cwd: './frontend',
      script: 'npm',
      args: 'run dev',
      env: { NODE_ENV: 'development' }
    }
  ]
};
```

---

## Verification

### 1. Check Backend Health

```bash
curl http://localhost:3001/health
# Should return: {"status":"ok","timestamp":"..."}
```

### 2. Check Database Connection

```bash
cd backend
npx prisma studio
# Opens database GUI at http://localhost:5555
```

### 3. Check Redis Connection

```bash
redis-cli ping
# Should return: PONG
```

### 4. Check Frontend

Open http://localhost:5173 in your browser

### 5. Run Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## IDE Setup

### VS Code (Recommended)

#### Install Extensions

The project includes recommended extensions in `.vscode/extensions.json`:

- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Prisma
- Docker
- GitLens

**Install all recommended extensions:**
1. Open VS Code
2. Press `Cmd/Ctrl + Shift + P`
3. Type "Show Recommended Extensions"
4. Click "Install All"

#### VS Code Settings

The project includes workspace settings in `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

#### Debug Configuration

Use the included debug configurations:

1. Press `F5` or go to Run & Debug
2. Select configuration:
   - "Debug Backend API"
   - "Debug Frontend"
   - "Debug Backend Tests"

### JetBrains IDEs (WebStorm, IntelliJ)

1. Open project folder
2. Enable TypeScript language service
3. Configure Prettier as default formatter
4. Enable ESLint

## Common Issues

### Port Already in Use

```bash
# Find process using port
lsof -i :3001  # macOS/Linux
netstat -ano | findstr :3001  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### Database Connection Error

```bash
# Check if PostgreSQL is running
pg_isready

# Restart PostgreSQL
brew services restart postgresql@15  # macOS
sudo systemctl restart postgresql  # Linux
```

### Redis Connection Error

```bash
# Check if Redis is running
redis-cli ping

# Restart Redis
brew services restart redis  # macOS
sudo systemctl restart redis  # Linux
```

### Prisma Client Generation Error

```bash
cd backend
rm -rf node_modules/.prisma
npx prisma generate
```

### Module Not Found Errors

```bash
# Clear npm cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Permission Denied on Unix Socket

```bash
# Fix PostgreSQL socket permissions
sudo chmod 777 /var/run/postgresql
```

## Next Steps

Now that your environment is set up:

1. **[Run Tests](./testing)** - Verify everything works
2. **[Understand Architecture](./architecture)** - Learn the codebase
3. **[Follow Code Style](./code-style)** - Write consistent code
4. **[Start Contributing](./contributing)** - Make your first contribution

## Getting Help

- **[Common Issues](./common-issues)** - Troubleshooting guide
- **[Discord](https://discord.gg/spywatcher)** - Ask the community
- **[GitHub Issues](https://github.com/subculture-collective/discord-spywatcher/issues)** - Report bugs
- **[Discussions](https://github.com/subculture-collective/discord-spywatcher/discussions)** - Ask questions
