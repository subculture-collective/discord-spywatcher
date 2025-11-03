# Troubleshooting Guide

Comprehensive solutions to common issues with Spywatcher. Use the search function (Ctrl/Cmd + F) to find specific error messages or symptoms.

::: tip Quick Navigation
[Installation](#installation-issues) | [Authentication](#authentication-issues) | [Bot](#bot-issues) | [Database](#database-issues) | [Performance](#performance-issues) | [Data](#data-issues) | [Network](#network-issues) | [Errors](#error-messages)
:::

## How to Use This Guide

1. **Identify your problem** - Note symptoms and error messages
2. **Find the relevant section** - Use table of contents or search
3. **Follow diagnostic steps** - Check each solution in order
4. **Check logs** - Most issues have diagnostic information in logs
5. **Get help** - If not resolved, see [Getting Help](#getting-help)

## Installation Issues

### Bot Won't Connect

**Symptoms:**
- Bot shows offline in Discord
- "Bot not ready" errors in logs
- Cannot see bot members in server

**Diagnostic Steps:**

1. **Verify Bot Token**
   ```bash
   # Check token length (should be 60+ characters)
   echo $DISCORD_BOT_TOKEN | wc -c
   
   # Test token validity
   curl -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
        https://discord.com/api/v10/users/@me
   ```

2. **Check Privileged Gateway Intents**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Select your application
   - Navigate to "Bot" section
   - Scroll to "Privileged Gateway Intents"
   - Enable:
     - ✅ Presence Intent
     - ✅ Server Members Intent
     - ✅ Message Content Intent (if tracking messages)

3. **Verify Bot Invitation**
   ```bash
   # Generate correct invite URL
   https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot
   
   # Replace YOUR_CLIENT_ID with your actual client ID
   ```

4. **Check Backend Logs**
   ```bash
   # Docker
   docker-compose logs backend | grep -i "bot\|error"
   
   # Manual setup
   cd backend && npm run dev 2>&1 | grep -i "bot\|error"
   ```

**Common Errors:**

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid token" | Wrong token in `.env` | Copy token from Developer Portal |
| "Disallowed intents" | Intents not enabled | Enable in Developer Portal |
| "Missing Access" | Bot not in server | Re-invite bot with correct permissions |

### Database Connection Failed

**Symptoms:**
- Backend won't start
- "Connection refused" errors
- "Role does not exist" errors
- Prisma connection errors

**Diagnostic Steps:**

1. **Verify PostgreSQL is Running**
   ```bash
   # Check if PostgreSQL is running
   pg_isready -h localhost -p 5432
   
   # Docker
   docker-compose ps postgres
   
   # Service status
   sudo systemctl status postgresql
   ```

2. **Check Database URL Format**
   ```bash
   # Correct format
   DATABASE_URL="postgresql://username:password@host:port/database?schema=public"
   
   # Examples
   # Local: postgresql://spywatcher:password@localhost:5432/spywatcher
   # Docker: postgresql://spywatcher:password@postgres:5432/spywatcher
   ```

3. **Test Database Connection**
   ```bash
   # Using psql
   psql "$DATABASE_URL"
   
   # Using curl (if PostgREST available)
   curl -I "$DATABASE_URL"
   ```

4. **Verify Database Exists**
   ```bash
   # List databases
   psql -U postgres -l
   
   # Create database if missing
   createdb -U postgres spywatcher
   ```

5. **Check User Permissions**
   ```sql
   -- Connect as postgres user
   psql -U postgres
   
   -- Grant permissions
   GRANT ALL PRIVILEGES ON DATABASE spywatcher TO spywatcher;
   GRANT ALL ON SCHEMA public TO spywatcher;
   ```

6. **Run Migrations**
   ```bash
   cd backend
   npx prisma migrate deploy
   npx prisma generate
   ```

**Common Errors:**

| Error | Cause | Solution |
|-------|-------|----------|
| "ECONNREFUSED" | PostgreSQL not running | Start PostgreSQL service |
| "database does not exist" | Database not created | Run `createdb spywatcher` |
| "password authentication failed" | Wrong credentials | Check DATABASE_URL |
| "relation does not exist" | Migrations not run | Run `prisma migrate deploy` |

### Frontend Can't Connect

**Symptoms:**
- Blank page or loading spinner
- API errors in browser console
- CORS errors
- 404 errors on API calls

**Diagnostic Steps:**

1. **Check Backend is Running**
   ```bash
   # Test backend health
   curl http://localhost:3001/api/health
   
   # Expected response: {"status":"ok"}
   ```

2. **Verify Frontend Configuration**
   ```bash
   # frontend/.env should have
   VITE_API_URL=http://localhost:3001/api
   VITE_DISCORD_CLIENT_ID=your_client_id
   ```

3. **Check Browser Console**
   - Open Developer Tools (F12)
   - Go to Console tab
   - Look for error messages
   - Common issues:
     - Network errors
     - CORS errors
     - 404 Not Found
     - Authentication errors

4. **Test CORS Configuration**
   ```bash
   # Check CORS headers
   curl -H "Origin: http://localhost:5173" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -X OPTIONS \
        http://localhost:3001/api/health -v
   ```

5. **Verify Ports**
   ```bash
   # Check if ports are in use
   lsof -i :3001  # Backend
   lsof -i :5173  # Frontend
   
   # Or
   netstat -tuln | grep -E '3001|5173'
   ```

**Solutions:**

1. **CORS Errors**
   ```bash
   # Add to backend/.env
   CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
   ```

2. **Wrong API URL**
   ```bash
   # frontend/.env
   VITE_API_URL=http://localhost:3001/api  # Include /api path
   ```

3. **Clear Cache**
   ```bash
   # Clear browser cache
   Ctrl+Shift+Delete (Chrome/Firefox)
   
   # Or clear Vite cache
   rm -rf frontend/node_modules/.vite
   ```

## Authentication Issues

### OAuth Authentication Fails

**Symptoms:**
- Can't log in with Discord
- Redirect loop after authorization
- "Invalid OAuth2 state" errors
- "Redirect URI mismatch" errors

**Diagnostic Steps:**

1. **Verify OAuth2 Configuration**
   - Discord Developer Portal → OAuth2
   - Check Redirect URIs match exactly:
     - `http://localhost:5173/auth/callback` (development)
     - `https://yourdomain.com/auth/callback` (production)

2. **Check Environment Variables**
   ```bash
   # Backend .env
   DISCORD_CLIENT_ID=your_client_id
   DISCORD_CLIENT_SECRET=your_client_secret
   DISCORD_REDIRECT_URI=http://localhost:5173/auth/callback
   
   # Frontend .env
   VITE_DISCORD_CLIENT_ID=your_client_id  # Must match backend
   ```

3. **Test OAuth Flow**
   ```bash
   # Generate OAuth URL
   https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:5173/auth/callback&response_type=code&scope=identify%20guilds
   ```

4. **Check Backend Logs**
   ```bash
   docker-compose logs backend | grep -i "oauth\|auth"
   ```

**Solutions:**

1. **Redirect URI Mismatch**
   - Ensure DISCORD_REDIRECT_URI in `.env` matches Discord Developer Portal exactly
   - Include protocol (http/https)
   - Check for trailing slashes
   - Port must match (5173 for dev)

2. **Invalid Client Secret**
   - Regenerate secret in Discord Developer Portal
   - Update in backend `.env`
   - Restart backend service

3. **Clear Session**
   ```bash
   # Clear browser cookies for localhost
   # Or use incognito/private mode
   ```

4. **Check JWT Configuration**
   ```bash
   # Backend .env - must be 32+ characters
   JWT_SECRET=$(openssl rand -hex 32)
   JWT_REFRESH_SECRET=$(openssl rand -hex 32)
   ```

### Session Expired

**Symptoms:**
- Logged out unexpectedly
- "Token expired" errors
- Need to re-authenticate frequently

**Solutions:**

1. **Extend Token Expiration**
   ```bash
   # Backend .env
   JWT_ACCESS_EXPIRES_IN=1h   # Default: 15m
   JWT_REFRESH_EXPIRES_IN=30d  # Default: 7d
   ```

2. **Enable Refresh Tokens**
   - Frontend automatically refreshes tokens
   - Check browser console for refresh errors
   - Verify refresh endpoint: `POST /api/auth/refresh`

3. **Check System Time**
   ```bash
   # Ensure system time is correct
   date
   timedatectl status
   
   # Sync time if needed
   sudo ntpdate pool.ntp.org
   ```

### Session Expired

**Symptoms:** Logged out unexpectedly

**Solutions:**
1. Re-authenticate with Discord
2. Check `JWT_SECRET` hasn't changed
3. Verify session timeout settings

## Data Issues

### No Data Showing

**Symptoms:** Empty dashboard, no analytics

**Solutions:**
1. Ensure bot has been running for some time
2. Check bot permissions in Discord
3. Verify Privileged Intents are enabled
4. Review database for data
5. Check time range filters

### Incorrect Ghost Scores

**Symptoms:** Unexpected or inaccurate scores

**Solutions:**
1. Verify detection thresholds
2. Check time range selection
3. Ensure sufficient data collected
4. Review bot tracking configuration

### Missing Users

**Symptoms:** Users not appearing in analytics

**Solutions:**
1. Check user privacy settings
2. Verify bot can see user
3. Check role visibility settings
4. Review bot permissions

## Performance Issues

### Slow Dashboard

**Symptoms:** Dashboard loads slowly

**Solutions:**
1. Check network connection
2. Reduce date range in filters
3. Limit number of results
4. Clear browser cache
5. Check backend resource usage

### WebSocket Disconnects

**Symptoms:** Real-time updates stop

**Solutions:**
1. Check network stability
2. Verify WebSocket URL
3. Check browser console for errors
4. Review backend WebSocket logs

## Error Messages

### 401 Unauthorized

**Cause:** Invalid or missing authentication

**Solution:** Log out and log back in

### 403 Forbidden

**Cause:** Insufficient permissions

**Solution:** Check Discord role permissions

### 404 Not Found

**Cause:** Resource doesn't exist

**Solution:** Verify guild ID, user ID, or endpoint

### 429 Too Many Requests

**Cause:** Rate limit exceeded

**Solution:** Wait and retry, or upgrade tier

### 500 Internal Server Error

**Cause:** Backend error

**Solution:** Check backend logs, report if persistent

## Getting Help

If issues persist:

1. **Check Logs:**
   - Backend: `docker-compose logs backend`
   - Frontend: Browser developer console
   - Bot: `docker-compose logs bot`

2. **GitHub Issues:**
   - Search existing issues
   - Create new issue with details
   - Include logs and error messages

3. **Documentation:**
   - Review relevant guides
   - Check API documentation
   - Read developer docs

## Common Questions

See the [FAQ](./faq) for answers to frequently asked questions.

::: tip Pro Tip
Enable debug logging for more detailed error information:
```bash
DEBUG=* npm run dev
```
:::
