# PgBouncer Setup Guide

Quick reference guide for setting up and managing PgBouncer connection pooling.

## 🚀 Quick Start

See [CONNECTION_POOLING.md](../CONNECTION_POOLING.md) for full documentation.

### Development

```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Production

```bash
export DB_PASSWORD="your_secure_password"
docker-compose -f docker-compose.prod.yml up -d
```

## 📊 Monitoring

```bash
# System health
curl http://localhost:3001/api/admin/monitoring/connections/health

# Pool statistics  
curl http://localhost:3001/api/admin/monitoring/connections/pool
```

## 🔗 Resources

- [Full Documentation](../CONNECTION_POOLING.md)
- [PgBouncer Official Docs](https://www.pgbouncer.org/)
