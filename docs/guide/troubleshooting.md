# Troubleshooting

Solutions to common issues with Spywatcher.

## Installation Issues

### Bot Won't Connect

**Symptoms:** Bot shows offline in Discord

**Solutions:**
1. Verify `DISCORD_BOT_TOKEN` is correct
2. Check Privileged Gateway Intents are enabled
3. Ensure bot is invited to server
4. Review backend logs for errors

### Database Connection Failed

**Symptoms:** Backend errors, can't start services

**Solutions:**
1. Verify PostgreSQL is running: `pg_isready`
2. Check `DATABASE_URL` format
3. Ensure database exists
4. Verify user has permissions
5. Check firewall rules

### Frontend Can't Connect

**Symptoms:** API errors in browser console

**Solutions:**
1. Verify backend is running on correct port
2. Check `VITE_API_URL` in frontend `.env`
3. Ensure no CORS issues
4. Check browser developer console for errors

## Authentication Issues

### OAuth Fails

**Symptoms:** Can't log in with Discord

**Solutions:**
1. Verify Discord OAuth2 credentials
2. Check redirect URI matches configuration
3. Clear browser cookies and cache
4. Try different browser
5. Check Discord OAuth2 settings

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
