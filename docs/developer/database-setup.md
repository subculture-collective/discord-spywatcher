# Database Setup

Detailed guide for setting up and configuring PostgreSQL for Spywatcher development.

## Quick Start

For most developers, the setup instructions in the [Local Environment Guide](./local-environment#database-setup) are sufficient.

## Detailed Setup

### PostgreSQL Installation

See [Prerequisites - PostgreSQL](./prerequisites#postgresql) for installation instructions.

### Creating the Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE spywatcher;

# Create user
CREATE USER spywatcher WITH PASSWORD 'spywatcher';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE spywatcher TO spywatcher;

# For PostgreSQL 15+, also grant schema privileges
\c spywatcher
GRANT ALL ON SCHEMA public TO spywatcher;

# Exit
\q
```

### Database Configuration

Configure PostgreSQL for development:

```bash
# Edit postgresql.conf (location varies by system)
# macOS (Homebrew): /usr/local/var/postgresql@15/postgresql.conf
# Linux: /etc/postgresql/15/main/postgresql.conf

# Recommended settings for development:
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
work_mem = 16MB
```

### Running Migrations

```bash
cd backend

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Verify schema
npx prisma validate

# View database in GUI
npx prisma studio
```

### Seeding Data

```bash
# Run seed script
cd backend
npm run prisma:seed
```

## Troubleshooting

See [Common Issues - Database](./common-issues#database-issues) for solutions to common problems.

## Next Steps

- [Database Schema Documentation](./database-schema)
- [Local Environment Setup](./local-environment)
- [Common Issues](./common-issues)
