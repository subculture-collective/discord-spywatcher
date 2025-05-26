# Project Documentation: Discord Spywatcher

This project is composed of two main parts:

1. **Discord Bot** – A surveillance bot that passively monitors Discord presence and activity data
2. **API Server** – A backend interface for accessing processed analytics, user data, and admin functions

---

## Discord Bot Overview 🤖

**Location:** `src/index.ts`

The bot connects to Discord using the `discord.js` library and listens for presence updates. Its primary job is to detect and log suspicious behavior such as multi-client logins (e.g., a user appearing online from both web and mobile simultaneously).

**Features:**

- Detects multi-client login activity
- Feeds data into the database for analysis
- Triggers analytics based on presence and role updates

**Dependencies:**

- `discord.js`
- Custom analytics modules (see `src/analytics/`)

---

## API Server Overview 🌐

**Location:** `src/server.ts`

The Express server provides endpoints to access user analytics, session data, and authentication utilities. It uses middleware for logging, auth, rate-limiting, and request IDs.

### Endpoints by Module

#### Analytics Routes

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

---

## Analytics Modules 📊

Located in `src/analytics/`, these modules analyze Discord presence and activity data. They are used by both the bot and the API to compute insights.

**Modules:**

- `ghosts.ts`: Detects ghost users who are technically present but never engage.
- `lurkers.ts`: Tracks users who read but don’t participate.
- `heatmap.ts`: Time-based activity heatmaps.
- `clients.ts`: Multi-client login detection.
- `roles.ts`: Analyzes role dynamics in activity.
- `shifts.ts`: Identifies behavior changes over time.
- `suspicion.ts`: Computes a suspicion score based on behavior heuristics.

---

## Authentication & Authorization 🔐

Auth routes use Discord OAuth and refresh tokens to manage sessions.

**Endpoints:**

- `GET /discord`: Begins Discord OAuth login
- `POST /refresh`: Refreshes session tokens
- `POST /logout`: Ends a session
- `GET /me`: Retrieves current session user
- `GET /admin/users`: Admin-only access to user list

---

## Middleware Stack 🧱

Custom middleware includes:

- `auth.ts`: Validates JWT tokens
- `rateLimiter.ts`: Basic rate-limiting
- `logger.ts` + `winstonLogger.ts`: Logging infrastructure
- `requestId.ts`: Assigns unique ID to each request
- `ipBlock.ts`: Blocks banned IPs
- `filterBannedUsers.ts`: Filters out banned users from analytics endpoints

---

## Data Flow Overview 🔄

1. The **Discord bot** observes user activity and sends updates to the database.
2. The **API** exposes analytical results from the database.
3. Middleware enforces security and logging.

This setup enables real-time and historical surveillance of Discord guilds for behavioral insights.
