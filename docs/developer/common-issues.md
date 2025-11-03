# Common Issues and Solutions

This guide covers common problems developers encounter and how to solve them.

## Installation Issues

### Node Version Mismatch

**Problem:**
```bash
Error: The engine "node" is incompatible with this module.
Expected version ">=18.0.0". Got "16.14.0"
```

**Solution:**
```bash
# Check current version
node --version

# Install Node 18+ using nvm (recommended)
nvm install 18
nvm use 18
nvm alias default 18

# Or update via package manager
# macOS
brew upgrade node

# Windows
choco upgrade nodejs

# Verify
node --version  # Should show 18.x.x or higher
```

### npm Install Fails

**Problem:**
```bash
npm ERR! code EACCES
npm ERR! syscall access
npm ERR! path /usr/local/lib/node_modules
```

**Solution:**

**Option 1: Fix permissions (Linux/macOS)**
```bash
# Create npm directory in home
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'

# Add to PATH in ~/.bashrc or ~/.zshrc
export PATH=~/.npm-global/bin:$PATH

# Reload shell
source ~/.bashrc  # or source ~/.zshrc
```

**Option 2: Use nvm (recommended)**
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node via nvm (installs without sudo)
nvm install 18
nvm use 18
```

**Option 3: Use sudo (not recommended)**
```bash
sudo npm install
```

### Package Lock Conflicts

**Problem:**
```bash
npm ERR! peer dep missing: react@^18.0.0
```

**Solution:**
```bash
# Remove lock files and node_modules
rm -rf node_modules package-lock.json

# Clear npm cache
npm cache clean --force

# Reinstall
npm install

# If still fails, try legacy peer deps
npm install --legacy-peer-deps
```

## Database Issues

### PostgreSQL Connection Refused

**Problem:**
```bash
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**

**Check if PostgreSQL is running:**
```bash
# macOS
brew services list
# If not running:
brew services start postgresql@15

# Linux
sudo systemctl status postgresql
# If not running:
sudo systemctl start postgresql

# Windows
# Check Services app or:
pg_ctl status
```

**Check connection settings:**
```bash
# Test connection
psql -h localhost -U spywatcher -d spywatcher

# If fails, check DATABASE_URL in .env
DATABASE_URL=postgresql://spywatcher:spywatcher@localhost:5432/spywatcher
```

**Check PostgreSQL logs:**
```bash
# macOS (Homebrew)
tail -f /usr/local/var/log/postgresql@15.log

# Linux
sudo tail -f /var/log/postgresql/postgresql-15-main.log

# Windows
# Check: C:\Program Files\PostgreSQL\15\data\log\
```

### Database Does Not Exist

**Problem:**
```bash
Error: database "spywatcher" does not exist
```

**Solution:**
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE spywatcher;

# Create user if needed
CREATE USER spywatcher WITH PASSWORD 'spywatcher';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE spywatcher TO spywatcher;

# Exit
\q

# Run migrations
cd backend
npx prisma migrate dev
```

### Prisma Client Not Generated

**Problem:**
```bash
Error: Cannot find module '@prisma/client'
```

**Solution:**
```bash
cd backend

# Generate Prisma Client
npx prisma generate

# If schema changed, also run migrations
npx prisma migrate dev

# Verify
npx prisma validate
```

### Migration Conflicts

**Problem:**
```bash
Error: Migration file conflict
```

**Solution:**

**During development:**
```bash
cd backend

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or resolve manually
npx prisma migrate resolve --applied "20240101000000_migration_name"
```

**In production:**
```bash
# Never reset in production!
# Contact maintainers for migration help
```

## Redis Issues

### Redis Connection Failed

**Problem:**
```bash
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solution:**

**Check if Redis is running:**
```bash
# Test connection
redis-cli ping
# Should return: PONG

# If not running, start Redis
# macOS
brew services start redis

# Linux
sudo systemctl start redis

# Windows
# Start redis-server.exe or use WSL2
```

**Check Redis configuration:**
```bash
# Check REDIS_URL in .env
REDIS_URL=redis://localhost:6379

# Test with Redis CLI
redis-cli -h localhost -p 6379 ping
```

### Redis Out of Memory

**Problem:**
```bash
Error: OOM command not allowed when used memory > 'maxmemory'
```

**Solution:**

**Increase maxmemory:**
```bash
# Edit redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru

# Or configure via CLI
redis-cli CONFIG SET maxmemory 256mb
redis-cli CONFIG SET maxmemory-policy allkeys-lru

# Restart Redis
brew services restart redis  # macOS
sudo systemctl restart redis # Linux
```

**Clear cache:**
```bash
# Clear all keys (development only!)
redis-cli FLUSHALL

# Clear specific pattern
redis-cli --scan --pattern "cache:*" | xargs redis-cli DEL
```

## Discord Bot Issues

### Invalid Token

**Problem:**
```bash
Error: An invalid token was provided.
```

**Solution:**

**Verify token:**
```bash
# Check .env file has correct token
DISCORD_BOT_TOKEN=your_actual_bot_token_here

# Token should be ~70 characters long
# Format: xxxxx.yyyyy.zzzzz

# Get new token if needed:
# 1. Go to Discord Developer Portal
# 2. Select your application
# 3. Bot tab → Reset Token
# 4. Update .env file
```

**Restart application:**
```bash
# Stop and start to reload .env
npm run dev
```

### Missing Intents

**Problem:**
```bash
Error: Used disallowed intents
```

**Solution:**

**Enable intents in Discord Developer Portal:**
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Go to "Bot" tab
4. Enable these intents:
   - ✅ Server Members Intent
   - ✅ Presence Intent
   - ✅ Message Content Intent
5. Save changes

**Update bot code if needed:**
```typescript
// backend/src/index.ts
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});
```

### Rate Limited

**Problem:**
```bash
Error: You are being rate limited.
```

**Solution:**

**Implement backoff:**
```typescript
// Already implemented in bot
// If still seeing errors, increase delays

const RETRY_AFTER = 5000; // 5 seconds
const MAX_RETRIES = 3;
```

**Check rate limits:**
```typescript
// Monitor rate limit headers
client.on('rateLimit', (info) => {
    console.log(`Rate limited: ${info.timeout}ms on ${info.route}`);
});
```

## Frontend Issues

### Port Already in Use

**Problem:**
```bash
Error: Port 5173 is already in use
```

**Solution:**

**Find and kill process:**
```bash
# macOS/Linux
lsof -i :5173
kill -9 <PID>

# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Or use different port
# Edit package.json:
"dev": "vite --port 5174"
```

### Module Not Found

**Problem:**
```bash
Error: Cannot find module './components/UserCard'
```

**Solution:**

**Check import path:**
```typescript
// ❌ Wrong
import { UserCard } from './components/UserCard';

// ✅ Correct (from component file)
import { UserCard } from '../components/UserCard';

// ✅ Correct (with alias)
import { UserCard } from '@/components/UserCard';
```

**Verify file exists:**
```bash
# Check file path
ls -la frontend/src/components/UserCard.tsx
```

**Clear cache and rebuild:**
```bash
cd frontend
rm -rf node_modules/.vite
npm run dev
```

### Type Errors

**Problem:**
```bash
Error: Property 'username' does not exist on type 'User'
```

**Solution:**

**Update types:**
```typescript
// frontend/src/types/user.ts
export interface User {
    id: string;
    username: string;  // Add missing property
    // ... other fields
}
```

**Regenerate Prisma types:**
```bash
cd backend
npx prisma generate
```

**Check tsconfig:**
```json
{
  "compilerOptions": {
    "strict": true,
    "skipLibCheck": true  // Skip checking node_modules
  }
}
```

## Authentication Issues

### JWT Verification Failed

**Problem:**
```bash
Error: invalid signature
```

**Solution:**

**Check JWT secrets match:**
```bash
# Ensure backend/.env has consistent secrets
JWT_SECRET=your_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# Secrets must be at least 32 characters
```

**Clear old tokens:**
```bash
# Frontend - clear localStorage
localStorage.clear();

# Backend - clear Redis sessions
redis-cli FLUSHDB
```

**Regenerate token:**
```bash
# Login again through OAuth flow
```

### OAuth Redirect URI Mismatch

**Problem:**
```bash
Error: redirect_uri_mismatch
```

**Solution:**

**Update Discord application:**
1. Go to Discord Developer Portal
2. OAuth2 tab
3. Add redirect URI: `http://localhost:5173/auth/callback`
4. Save changes

**Update .env:**
```bash
DISCORD_REDIRECT_URI=http://localhost:5173/auth/callback
```

**Restart backend:**
```bash
cd backend
npm run dev:api
```

## Build Issues

### TypeScript Compilation Error

**Problem:**
```bash
Error: TS2345: Argument of type 'string' is not assignable to type 'number'
```

**Solution:**

**Fix type errors:**
```typescript
// ❌ Wrong
const id: number = "123";

// ✅ Correct
const id: number = parseInt("123");

// Or use proper type
const id: string = "123";
```

**Skip strict checks temporarily:**
```json
// tsconfig.json (not recommended for production)
{
  "compilerOptions": {
    "strict": false
  }
}
```

### Build Out of Memory

**Problem:**
```bash
FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed
```

**Solution:**

**Increase Node memory:**
```bash
# Set environment variable
export NODE_OPTIONS="--max-old-space-size=4096"

# Or in package.json
"build": "NODE_OPTIONS=--max-old-space-size=4096 vite build"
```

## Testing Issues

### Tests Fail with Database Connection

**Problem:**
```bash
Error: Cannot connect to test database
```

**Solution:**

**Use test database:**
```bash
# Create test database
createdb spywatcher_test

# Set TEST_DATABASE_URL in .env
TEST_DATABASE_URL=postgresql://spywatcher:spywatcher@localhost:5432/spywatcher_test
```

**Mock database in tests:**
```typescript
// __tests__/setup.ts
jest.mock('../src/db', () => ({
    prisma: {
        user: {
            findMany: jest.fn(),
            // ... other mocks
        },
    },
}));
```

### Tests Timeout

**Problem:**
```bash
Timeout - Async callback was not invoked within the 5000 ms timeout
```

**Solution:**

**Increase timeout:**
```typescript
// Individual test
it('should fetch data', async () => {
    // ...
}, 10000); // 10 second timeout

// All tests
jest.setTimeout(10000);
```

**Ensure async completion:**
```typescript
// ❌ Wrong - missing await
it('should fetch data', () => {
    fetchData(); // Not awaited
});

// ✅ Correct
it('should fetch data', async () => {
    await fetchData();
});
```

## Performance Issues

### Slow API Responses

**Problem:**
API requests taking >1 second

**Solution:**

**Add indexes:**
```sql
CREATE INDEX idx_presence_user_time ON "Presence" (userId, timestamp);
```

**Enable query logging:**
```typescript
// backend/src/db.ts
const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});
```

**Use caching:**
```typescript
// Check Redis first
const cached = await redis.get(key);
if (cached) return JSON.parse(cached);

// Query database
const data = await prisma.user.findMany();

// Cache result
await redis.set(key, JSON.stringify(data), 'EX', 300);
```

### High Memory Usage

**Problem:**
Application using excessive memory

**Solution:**

**Check for memory leaks:**
```bash
# Run with inspector
node --inspect backend/src/server.ts

# Connect Chrome DevTools
# Navigate to: chrome://inspect
# Take heap snapshots
```

**Optimize queries:**
```typescript
// ❌ Bad - loads everything
const users = await prisma.user.findMany({
    include: {
        presences: true,
        messages: true,
    },
});

// ✅ Good - limit data
const users = await prisma.user.findMany({
    select: {
        id: true,
        username: true,
    },
    take: 100,
});
```

**Use pagination:**
```typescript
// Always paginate large datasets
const users = await prisma.user.findMany({
    skip: offset,
    take: limit,
});
```

## Docker Issues

### Container Won't Start

**Problem:**
```bash
Error: Container exited with code 1
```

**Solution:**

**Check logs:**
```bash
docker-compose -f docker-compose.dev.yml logs backend

# Follow logs
docker-compose -f docker-compose.dev.yml logs -f backend
```

**Rebuild containers:**
```bash
# Stop and remove
docker-compose -f docker-compose.dev.yml down

# Rebuild
docker-compose -f docker-compose.dev.yml build --no-cache

# Start
docker-compose -f docker-compose.dev.yml up
```

**Check environment:**
```bash
# Verify .env file exists
cat .env

# Check environment in container
docker-compose -f docker-compose.dev.yml exec backend env
```

### Port Binding Failed

**Problem:**
```bash
Error: Bind for 0.0.0.0:3001 failed: port is already allocated
```

**Solution:**

**Stop conflicting containers:**
```bash
docker ps
docker stop <container_id>
```

**Change port mapping:**
```yaml
# docker-compose.dev.yml
services:
  backend:
    ports:
      - "3002:3001"  # Use different external port
```

## Getting More Help

If you're still stuck:

1. **Search existing issues**: [GitHub Issues](https://github.com/subculture-collective/discord-spywatcher/issues)
2. **Ask in discussions**: [GitHub Discussions](https://github.com/subculture-collective/discord-spywatcher/discussions)
3. **Join Discord**: Community support (link in README)
4. **Check logs**: Always include relevant logs when asking for help

## Reporting Issues

When reporting a new issue, include:

```markdown
## Environment
- OS: macOS 14.0
- Node: 18.20.0
- npm: 9.8.1
- PostgreSQL: 15.3
- Redis: 7.0.11

## Steps to Reproduce
1. Run `npm install`
2. Start backend: `npm run dev:api`
3. Error occurs

## Expected Behavior
Backend should start successfully

## Actual Behavior
Error: Cannot connect to database

## Logs
```
[Include relevant logs]
```

## Additional Context
Using Docker Compose setup
```

## Related Documentation

- [Local Environment Setup](./local-environment)
- [Debugging Guide](./debugging)
- [Testing Guide](./testing)
- [Architecture Overview](./architecture)
