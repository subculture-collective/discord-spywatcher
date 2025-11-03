# Installation

This guide will walk you through installing Spywatcher on your system.

## Prerequisites

Before installing Spywatcher, ensure you have:

- **Node.js**: Version 18 or higher ([Download](https://nodejs.org/))
- **npm**: Version 8 or higher (comes with Node.js)
- **Discord Bot**: A Discord bot application ([Create one](https://discord.com/developers/applications))
- **PostgreSQL**: Version 14 or higher (for production)
- **Redis**: Version 6 or higher (for caching)

::: tip Docker Alternative
If you prefer Docker, skip to [Docker Installation](#docker-installation-recommended) for a simpler setup.
:::

## Installation Methods

### Docker Installation (Recommended)

The easiest way to run Spywatcher is using Docker Compose:

#### Step 1: Clone the Repository

```bash
git clone https://github.com/subculture-collective/discord-spywatcher.git
cd discord-spywatcher
```

#### Step 2: Configure Environment

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```bash
# Discord Configuration
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here
DISCORD_REDIRECT_URI=http://localhost:5173/auth/callback

# Database
DATABASE_URL=postgresql://spywatcher:password@postgres:5432/spywatcher

# Redis
REDIS_URL=redis://redis:6379

# JWT Secret (generate a secure random string)
JWT_SECRET=your_secure_jwt_secret_here

# Application
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3001
```

::: warning Security Note
Never commit your `.env` file to version control! Always generate secure random strings for `JWT_SECRET`.
:::

#### Step 3: Start the Application

For development:

```bash
docker-compose -f docker-compose.dev.yml up
```

For production:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

#### Step 4: Access the Application

Once the containers are running:

- **Frontend Dashboard**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3001](http://localhost:3001)
- **API Documentation**: [http://localhost:3001/api/docs](http://localhost:3001/api/docs)

### Manual Installation

For more control over the installation:

#### Step 1: Clone the Repository

```bash
git clone https://github.com/subculture-collective/discord-spywatcher.git
cd discord-spywatcher
```

#### Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

#### Step 3: Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

#### Step 4: Set Up Database

Install PostgreSQL and create a database:

```sql
CREATE DATABASE spywatcher;
CREATE USER spywatcher WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE spywatcher TO spywatcher;
```

#### Step 5: Configure Environment

Create `.env` files for backend and frontend:

**Backend** (`backend/.env`):
```bash
DATABASE_URL=postgresql://spywatcher:your_password@localhost:5432/spywatcher
REDIS_URL=redis://localhost:6379
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
JWT_SECRET=your_secure_jwt_secret
PORT=3001
```

**Frontend** (`frontend/.env`):
```bash
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

#### Step 6: Run Database Migrations

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

#### Step 7: Start the Services

In separate terminals:

**Start the Discord Bot:**
```bash
cd backend
npm run dev
```

**Start the API Server:**
```bash
cd backend
npm run dev:api
```

**Start the Frontend:**
```bash
cd frontend
npm run dev
```

## Discord Bot Setup

### Step 1: Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application**
3. Name your application (e.g., "Spywatcher")
4. Click **Create**

### Step 2: Create Bot User

1. Navigate to the **Bot** section
2. Click **Add Bot**
3. Confirm by clicking **Yes, do it!**
4. Copy the **Bot Token** (you'll need this for `DISCORD_BOT_TOKEN`)

### Step 3: Configure Bot Permissions

Enable these **Privileged Gateway Intents**:
- ✅ Presence Intent
- ✅ Server Members Intent
- ✅ Message Content Intent

### Step 4: Configure OAuth2

1. Navigate to **OAuth2** > **General**
2. Add redirect URL: `http://localhost:5173/auth/callback`
3. For production, also add: `https://yourdomain.com/auth/callback`

### Step 5: Invite Bot to Server

1. Go to **OAuth2** > **URL Generator**
2. Select these **Scopes**:
   - `bot`
   - `applications.commands`
3. Select these **Bot Permissions**:
   - Read Messages/View Channels
   - Read Message History
   - View Server Insights
4. Copy the generated URL and open it in your browser
5. Select your server and authorize

## Verification

After installation, verify everything is working:

### 1. Check Backend Health

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-11-03T16:00:00.000Z",
  "uptime": 123.456,
  "database": "connected",
  "redis": "connected"
}
```

### 2. Check Frontend

Open [http://localhost:5173](http://localhost:5173) in your browser. You should see the Spywatcher login page.

### 3. Check Discord Bot

In your Discord server, verify the bot appears online and has the correct permissions.

## Next Steps

Now that Spywatcher is installed:

1. **[Quick Start Guide](./quick-start)** - Complete your first-time setup
2. **[Discord OAuth Setup](./oauth-setup)** - Connect your Discord account
3. **[Guild Selection](./guild-selection)** - Choose servers to monitor

## Troubleshooting

### Bot Not Connecting

- Verify `DISCORD_BOT_TOKEN` is correct
- Check that Privileged Gateway Intents are enabled
- Ensure the bot has been invited to your server

### Database Connection Failed

- Verify PostgreSQL is running: `pg_isready`
- Check `DATABASE_URL` is correct
- Ensure the database exists and user has permissions

### Frontend Can't Connect to Backend

- Verify backend is running on port 3001
- Check `VITE_API_URL` in frontend `.env`
- Ensure no firewall is blocking the connection

For more issues, see the [Troubleshooting Guide](./troubleshooting).
