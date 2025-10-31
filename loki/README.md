# Loki Configuration

This directory contains the configuration for Grafana Loki, the log aggregation system.

## Files

- `loki-config.yml` - Main Loki configuration file

## Key Configuration

### Retention Policy
- **Period:** 30 days (720 hours)
- **Delete Delay:** 2 hours after retention period
- **Compaction:** Every 10 minutes

### Storage
- **Type:** Filesystem (TSDB)
- **Location:** `/loki` (inside container)
- **Chunks:** `/loki/chunks`
- **Rules:** `/loki/rules`

### Limits
- **Ingestion Rate:** 15 MB/s
- **Burst Size:** 20 MB
- **Max Entries per Query:** 5000
- **Max Streams per User:** 10000

## Customization

To adjust retention period, edit `loki-config.yml`:

```yaml
limits_config:
  retention_period: 720h  # Change this (e.g., 1440h for 60 days)

table_manager:
  retention_period: 720h  # Keep same as above
```

## Ports

- `3100` - HTTP API
- `9096` - gRPC

## Resources

- [Loki Documentation](https://grafana.com/docs/loki/latest/)
- [Configuration Reference](https://grafana.com/docs/loki/latest/configuration/)
