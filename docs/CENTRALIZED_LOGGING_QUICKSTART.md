# Centralized Logging Quick Start Guide

This guide will help you get started with the centralized logging system in Discord SpyWatcher.

## Prerequisites

- Docker and Docker Compose installed
- Discord SpyWatcher repository cloned
- Environment variables configured (see `.env.example`)

## Step 1: Start the Logging Stack

### Development Environment

```bash
# Start all services including logging stack
docker compose -f docker-compose.dev.yml up -d

# Or start only the logging stack
docker compose -f docker-compose.dev.yml up -d loki promtail grafana
```

### Production Environment

```bash
docker compose -f docker-compose.prod.yml up -d
```

## Step 2: Verify Services are Running

```bash
# Check all containers are running
docker ps | grep -E 'loki|promtail|grafana'

# Expected output (3 containers):
# spywatcher-loki-dev      grafana/loki:2.9.3
# spywatcher-promtail-dev  grafana/promtail:2.9.3
# spywatcher-grafana-dev   grafana/grafana:10.2.3
```

## Step 3: Access Grafana

1. Open your browser to: **http://localhost:3000**
2. Login with default credentials:
   - **Username:** `admin`
   - **Password:** `admin`
3. You'll be prompted to change the password on first login

## Step 4: View Logs

### Option 1: Using the Pre-configured Dashboard

1. Navigate to **Dashboards** (left sidebar, four squares icon)
2. Click on **Spywatcher - Log Aggregation**
3. You should see:
   - Log volume chart
   - Log level statistics
   - Application logs
   - Security logs
   - Error logs

### Option 2: Using Explore

1. Click **Explore** (compass icon in the left sidebar)
2. Select **Loki** as the datasource (should be selected by default)
3. Enter a LogQL query, for example:
   ```logql
   {job="backend"}
   ```
4. Click **Run query** or press `Shift + Enter`

## Step 5: Filter and Search Logs

### Using Dashboard Variables

In the **Spywatcher - Log Aggregation** dashboard:

1. **Job** dropdown - Select which service to view (backend, security, postgres, etc.)
2. **Level** dropdown - Filter by log level (error, warn, info, debug)
3. **Search** box - Enter text to search within log messages

### Using LogQL Queries

In **Explore**, try these queries:

**All errors:**
```logql
{job="backend"} | json | level="error"
```

**Failed login attempts:**
```logql
{job="security"} | json | action="LOGIN_ATTEMPT" | result="FAILURE"
```

**Logs from the last hour:**
Use the time picker in the top-right corner

**Search for specific text:**
```logql
{job="backend"} |= "database connection"
```

## Step 6: Monitor Log Collection

### Check Promtail is Collecting Logs

```bash
# View Promtail logs
docker logs spywatcher-promtail-dev

# Check Promtail metrics
curl http://localhost:9080/metrics | grep promtail_sent_entries_total
```

### Check Loki is Receiving Logs

```bash
# Check Loki health
curl http://localhost:3100/ready

# Check Loki metrics
curl http://localhost:3100/metrics | grep loki_ingester_bytes_received_total
```

## Common Issues and Solutions

### Issue: No logs appearing in Grafana

**Solution 1: Check backend logs directory exists**
```bash
docker exec spywatcher-backend-dev ls -la /app/logs
```

**Solution 2: Verify Promtail is running and configured correctly**
```bash
docker logs spywatcher-promtail-dev
docker exec spywatcher-promtail-dev cat /etc/promtail/config.yml
```

**Solution 3: Restart services**
```bash
docker compose -f docker-compose.dev.yml restart promtail loki
```

### Issue: Grafana shows "Cannot connect to Loki"

**Solution: Check Loki is running and accessible**
```bash
# Check Loki status
docker ps | grep loki

# Test Loki endpoint from Grafana container
docker exec spywatcher-grafana-dev wget -qO- http://loki:3100/ready
```

### Issue: Permission denied accessing Docker socket

**Solution: Add user to docker group (Linux)**
```bash
sudo usermod -aG docker $USER
# Log out and back in for changes to take effect
```

## Next Steps

1. **Customize Log Retention** - See [LOGGING.md](../LOGGING.md#retention-policies)
2. **Create Custom Dashboards** - See [Grafana README](../grafana/README.md)
3. **Set Up Alerts** - See [LOGGING.md](../LOGGING.md#alerting)
4. **Integrate with Sentry** - See [LOGGING.md](../LOGGING.md#integration-with-other-tools)

## Useful Commands

### View Live Logs

In Grafana Explore, click the **Live** button to stream logs in real-time.

### Export Logs

From Grafana dashboard:
1. Select time range
2. Click panel menu (three dots)
3. Choose **Inspect** > **Data** > **Download CSV/JSON**

### Clear Log Data

```bash
# Stop services
docker compose -f docker-compose.dev.yml down

# Remove Loki volume
docker volume rm discord-spywatcher_loki-data

# Start services again
docker compose -f docker-compose.dev.yml up -d
```

## Resources

- **Full Documentation:** [LOGGING.md](../LOGGING.md)
- **LogQL Documentation:** https://grafana.com/docs/loki/latest/logql/
- **Grafana Documentation:** https://grafana.com/docs/grafana/latest/
- **Loki Documentation:** https://grafana.com/docs/loki/latest/

## Support

For issues or questions:
1. Check the [Troubleshooting section](../LOGGING.md#troubleshooting) in LOGGING.md
2. Review container logs: `docker logs <container-name>`
3. Open an issue on GitHub with relevant logs and error messages

---

**Happy Log Hunting! 🔍📊**
