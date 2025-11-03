# Prerequisites

Before you start developing with Spywatcher, ensure you have the necessary tools, accounts, and knowledge.

## Required Software

### Node.js and npm

**Version Requirements:**
- Node.js: v18.0.0 or higher (v18.20.0+ recommended)
- npm: v8.0.0 or higher (v9.0.0+ recommended)

**Installation:**

```bash
# Check current versions
node --version
npm --version

# macOS (using Homebrew)
brew install node@18

# Windows (using Chocolatey)
choco install nodejs-lts

# Linux (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Or use nvm (recommended for managing multiple versions)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

**Why Node.js 18+?**
- Native support for ES modules
- Fetch API available globally
- Performance improvements
- Long-term support (LTS)

### Git

**Version Requirements:**
- Git: v2.30.0 or higher

**Installation:**

```bash
# Check current version
git --version

# macOS
brew install git

# Windows
choco install git

# Linux
sudo apt-get install git
```

**Configuration:**

```bash
# Set your identity
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Set default branch name
git config --global init.defaultBranch main

# Enable helpful options
git config --global pull.rebase false
git config --global core.autocrlf input  # macOS/Linux
git config --global core.autocrlf true   # Windows
```

### PostgreSQL

**Version Requirements:**
- PostgreSQL: v14.0 or higher (v15.0+ recommended)

**Installation:**

```bash
# macOS
brew install postgresql@15
brew services start postgresql@15

# Windows
# Download installer from https://www.postgresql.org/download/windows/

# Linux (Ubuntu/Debian)
sudo apt-get install postgresql-15 postgresql-contrib

# Verify installation
psql --version
```

**Initial Setup:**

```bash
# Start PostgreSQL service
sudo systemctl start postgresql  # Linux
brew services start postgresql@15  # macOS

# Access PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE spywatcher;
CREATE USER spywatcher WITH PASSWORD 'spywatcher';
GRANT ALL PRIVILEGES ON DATABASE spywatcher TO spywatcher;
\q
```

### Redis

**Version Requirements:**
- Redis: v6.0 or higher (v7.0+ recommended)

**Installation:**

```bash
# macOS
brew install redis
brew services start redis

# Windows
# Download from https://github.com/microsoftarchive/redis/releases
# Or use WSL2

# Linux (Ubuntu/Debian)
sudo apt-get install redis-server

# Verify installation
redis-cli --version
```

**Configuration:**

```bash
# Test Redis connection
redis-cli ping
# Should return: PONG

# Check Redis info
redis-cli info server
```

### Docker (Optional but Recommended)

**Installation:**

```bash
# macOS/Windows
# Download Docker Desktop from https://www.docker.com/products/docker-desktop

# Linux
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker-compose --version
```

## Required Accounts

### GitHub Account

1. Create a GitHub account at [github.com](https://github.com)
2. Set up SSH keys:

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your.email@example.com"

# Start ssh-agent
eval "$(ssh-agent -s)"

# Add key to agent
ssh-add ~/.ssh/id_ed25519

# Copy public key
cat ~/.ssh/id_ed25519.pub
# Add to GitHub: Settings → SSH and GPG keys → New SSH key
```

3. Configure Git authentication:

```bash
# Test connection
ssh -T git@github.com

# Configure GitHub CLI (optional)
gh auth login
```

### Discord Developer Account

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Log in with your Discord account
3. Click "New Application"
4. Name your application (e.g., "Spywatcher Dev")

#### Create a Bot

1. Navigate to "Bot" tab
2. Click "Add Bot"
3. Enable these intents:
   - ✅ Server Members Intent
   - ✅ Presence Intent
   - ✅ Message Content Intent
4. Copy the bot token (keep it secret!)

#### Set Up OAuth2

1. Navigate to "OAuth2" tab
2. Add redirect URLs:
   ```
   http://localhost:5173/auth/callback
   http://localhost:3001/auth/callback
   ```
3. Note your Client ID and Client Secret
4. Set OAuth2 scopes:
   - `identify`
   - `email`
   - `guilds`

#### Invite Bot to Test Server

1. Go to OAuth2 → URL Generator
2. Select scopes:
   - `bot`
   - `applications.commands`
3. Select bot permissions:
   - Read Messages/View Channels
   - Send Messages
   - Manage Roles
   - View Server Insights
4. Copy generated URL and open in browser
5. Invite to your test Discord server

## Development Tools

### VS Code (Recommended)

**Installation:**

```bash
# macOS
brew install --cask visual-studio-code

# Windows
choco install vscode

# Linux
sudo snap install --classic code
```

**Essential Extensions:**

Install these extensions for the best development experience:

```bash
# Install via command line
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension prisma.prisma
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension bradlc.vscode-tailwindcss
code --install-extension eamodio.gitlens
```

Or install from VS Code Extensions marketplace:
- **ESLint** - JavaScript/TypeScript linting
- **Prettier** - Code formatting
- **Prisma** - Database schema support
- **TypeScript and JavaScript Language Features** - Enhanced TS support
- **Tailwind CSS IntelliSense** - Tailwind autocomplete
- **GitLens** - Enhanced Git integration
- **Docker** - Docker file support

### Alternative IDEs

**WebStorm:**
- Full-featured JavaScript IDE
- Built-in TypeScript support
- Download from [jetbrains.com/webstorm](https://www.jetbrains.com/webstorm/)

**Cursor:**
- AI-powered code editor
- Fork of VS Code
- Download from [cursor.sh](https://cursor.sh/)

### Browser Developer Tools

**Recommended Browsers:**
- Chrome/Chromium (best DevTools)
- Firefox Developer Edition
- Safari (for macOS testing)

**Essential Browser Extensions:**
- React Developer Tools
- Redux DevTools
- Apollo Client Devtools (if using GraphQL)

### API Testing Tools

**Postman:**
```bash
# macOS
brew install --cask postman

# Windows
choco install postman

# Or download from https://www.postman.com/downloads/
```

**Alternative: Thunder Client**
- VS Code extension
- Lightweight API client
- Install: `code --install-extension rangav.vscode-thunder-client`

### Database Tools

**pgAdmin (GUI for PostgreSQL):**
```bash
# macOS
brew install --cask pgadmin4

# Windows
choco install pgadmin4

# Or download from https://www.pgadmin.org/
```

**Alternative: DBeaver**
- Universal database tool
- Supports PostgreSQL, MySQL, SQLite, etc.
- Download from [dbeaver.io](https://dbeaver.io/)

**Prisma Studio:**
Built into Prisma, no installation needed:
```bash
cd backend
npx prisma studio
```

## Knowledge Prerequisites

### Required Skills

#### JavaScript/TypeScript
- **ES6+ features**: Arrow functions, destructuring, async/await
- **TypeScript basics**: Types, interfaces, generics
- **Node.js fundamentals**: Modules, async patterns, streams

**Learning Resources:**
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [JavaScript.info](https://javascript.info/)
- [Node.js Documentation](https://nodejs.org/en/docs/)

#### React
- **Functional components**: Hooks (useState, useEffect, useContext)
- **React Router**: Client-side routing
- **State management**: Context API or Zustand

**Learning Resources:**
- [React Documentation](https://react.dev/)
- [React Hooks](https://react.dev/reference/react)

#### Backend Development
- **Express.js**: Routing, middleware, error handling
- **REST APIs**: HTTP methods, status codes, API design
- **Authentication**: OAuth2, JWT, sessions

**Learning Resources:**
- [Express Documentation](https://expressjs.com/)
- [REST API Tutorial](https://restfulapi.net/)

#### Database
- **SQL basics**: SELECT, JOIN, WHERE, indexes
- **Prisma ORM**: Schema, migrations, queries
- **PostgreSQL**: Data types, functions, performance

**Learning Resources:**
- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)

#### Git & GitHub
- **Basic commands**: clone, commit, push, pull, branch
- **Branching**: Feature branches, merge strategies
- **Pull requests**: Creating, reviewing, merging

**Learning Resources:**
- [Git Documentation](https://git-scm.com/doc)
- [GitHub Skills](https://skills.github.com/)

### Helpful but Optional

- **Docker**: Containerization basics
- **CI/CD**: GitHub Actions workflows
- **Testing**: Jest, React Testing Library
- **DevOps**: Basic Linux commands, cloud platforms

## System Requirements

### Minimum Hardware

- **CPU**: Dual-core processor
- **RAM**: 8 GB
- **Storage**: 10 GB free space
- **Network**: Stable internet connection

### Recommended Hardware

- **CPU**: Quad-core processor or better
- **RAM**: 16 GB or more
- **Storage**: 20 GB+ free space (SSD recommended)
- **Network**: High-speed internet

### Operating System

**Supported:**
- macOS 11+ (Big Sur or later)
- Windows 10/11 (with WSL2 recommended)
- Linux (Ubuntu 20.04+, Debian 11+, or equivalent)

**Best for Development:**
- macOS or Linux (native Unix tools)
- Windows with WSL2 (Windows Subsystem for Linux)

## Environment Setup

### Environment Variables

You'll need to set up environment variables for:

**Backend:**
- `DISCORD_BOT_TOKEN`
- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `JWT_SECRET`
- `DATABASE_URL`
- `REDIS_URL`

**Frontend:**
- `VITE_API_URL`
- `VITE_DISCORD_CLIENT_ID`

See [Local Environment Setup](./local-environment) for details.

### Network Configuration

Ensure these ports are available:

| Service | Port | Protocol |
|---------|------|----------|
| Frontend Dev Server | 5173 | HTTP |
| Backend API | 3001 | HTTP |
| PostgreSQL | 5432 | TCP |
| Redis | 6379 | TCP |
| Prisma Studio | 5555 | HTTP |

### Firewall Rules

If using a firewall, allow:
- Outbound HTTPS (443) for API calls
- Outbound Discord Gateway (443)
- Localhost connections on development ports

## Verification Checklist

Before proceeding, verify:

- [ ] Node.js v18+ installed (`node --version`)
- [ ] npm v8+ installed (`npm --version`)
- [ ] Git v2.30+ installed (`git --version`)
- [ ] PostgreSQL v14+ installed (`psql --version`)
- [ ] Redis v6+ installed (`redis-cli --version`)
- [ ] GitHub account created and SSH key added
- [ ] Discord Developer account created
- [ ] Discord bot created with required intents
- [ ] Test Discord server available
- [ ] VS Code (or preferred IDE) installed
- [ ] Required VS Code extensions installed
- [ ] Basic knowledge of JavaScript/TypeScript
- [ ] Basic knowledge of React
- [ ] Basic knowledge of Git

## Next Steps

Once you have all prerequisites:

1. **[Set Up Local Environment](./local-environment)** - Clone and configure the project
2. **[Understand the Architecture](./architecture)** - Learn how the system works
3. **[Run Tests](./testing)** - Verify your setup
4. **[Start Contributing](./contributing)** - Make your first contribution

## Getting Help

If you're stuck on prerequisites:

- **Discord Community**: Join our [Discord server](https://discord.gg/spywatcher)
- **GitHub Discussions**: Ask questions in [Discussions](https://github.com/subculture-collective/discord-spywatcher/discussions)
- **Documentation**: Check [troubleshooting guide](./common-issues)
- **Issues**: Report bugs in [GitHub Issues](https://github.com/subculture-collective/discord-spywatcher/issues)
