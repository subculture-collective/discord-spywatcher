# Promtail Configuration

This directory contains the configuration for Promtail, the log collection agent.

## Files

- `promtail-config.yml` - Main Promtail configuration file

## Log Sources

Promtail collects logs from:

1. **Backend Application Logs** (`/logs/backend/*.log`)
   - JSON formatted logs
   - Labels: job, service, level

2. **Security Logs** (`/logs/backend/security.log`)
   - Security events
   - Labels: job, level, action, result

3. **PostgreSQL Logs** (`/var/log/postgresql/*.log`)
   - Database logs
   - Labels: job, service

4. **Docker Container Logs** (via Docker socket)
   - Redis, PgBouncer, Nginx, etc.
   - Labels: container, service, stream

## Pipeline Stages

For structured logs (JSON):
1. **JSON parsing** - Extract fields from JSON
2. **Label extraction** - Create Loki labels
3. **Timestamp parsing** - Parse timestamp field
4. **Output formatting** - Format log message

## Ports

- `9080` - HTTP API (metrics)

## Customization

To add a new log source:

```yaml
scrape_configs:
  - job_name: my_service
    static_configs:
      - targets:
          - localhost
        labels:
          job: my_service
          service: my-service-name
          __path__: /path/to/logs/*.log
```

## Resources

- [Promtail Documentation](https://grafana.com/docs/loki/latest/clients/promtail/)
- [Pipeline Stages](https://grafana.com/docs/loki/latest/clients/promtail/stages/)
