# Docker Setup Guide

This guide explains how to run the Discord Spywatcher application using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10+ (with BuildKit support)
- Docker Compose V2 (2.0+)
- Git

## Quick Start (Development)

1. **Clone the repository**
   ```bash
   git clone https://github.com/subculture-collective/discord-spywatcher.git
   cd discord-spywatcher
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and fill in your Discord credentials and other required values.

3. **Start the development environment**
   ```bash
   docker-compose -f docker-compose.dev.yml up
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - PostgreSQL: localhost:5432

## Environment Setup

### Development Environment

The development environment includes:
- **PostgreSQL 15**: Database with persistent volumes
- **Backend**: Node.js API with hot reload
- **Frontend**: Vite dev server with hot module replacement

**Start development environment:**
```bash
docker-compose -f docker-compose.dev.yml up
```

**Stop development environment:**
```bash
docker-compose -f docker-compose.dev.yml down
```

**Stop and remove volumes (clean start):**
```bash
docker-compose -f docker-compose.dev.yml down -v
```

### Production Environment

The production environment includes:
- **PostgreSQL 15**: Production database
- **Backend**: Optimized Node.js API
- **Frontend**: Nginx serving static files
- **Nginx**: Reverse proxy with SSL support

**Build and start production environment:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

**View logs:**
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

**Stop production environment:**
```bash
docker-compose -f docker-compose.prod.yml down
```

### Testing Environment

The testing environment runs all tests in isolated containers:

**Run all tests:**
```bash
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## Docker Commands

### Building Images

**Build all images:**
```bash
docker-compose -f docker-compose.dev.yml build
```

**Build specific service:**
```bash
docker-compose -f docker-compose.dev.yml build backend
```

**Build without cache:**
```bash
docker-compose -f docker-compose.dev.yml build --no-cache
```

### Managing Containers

**Start services in background:**
```bash
docker-compose -f docker-compose.dev.yml up -d
```

**View running containers:**
```bash
docker-compose -f docker-compose.dev.yml ps
```

**View logs:**
```bash
docker-compose -f docker-compose.dev.yml logs -f [service_name]
```

**Restart a service:**
```bash
docker-compose -f docker-compose.dev.yml restart backend
```

**Execute commands in a container:**
```bash
docker-compose -f docker-compose.dev.yml exec backend sh
```

### Database Management

**Run Prisma migrations:**
```bash
docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate dev
```

**Generate Prisma Client:**
```bash
docker-compose -f docker-compose.dev.yml exec backend npx prisma generate
```

**Open Prisma Studio:**
```bash
docker-compose -f docker-compose.dev.yml exec backend npx prisma studio
```

**Access PostgreSQL CLI:**
```bash
docker-compose -f docker-compose.dev.yml exec postgres psql -U spywatcher -d spywatcher
```

**Backup database:**
```bash
docker-compose -f docker-compose.dev.yml exec postgres pg_dump -U spywatcher spywatcher > backup.sql
```

**Restore database:**
```bash
docker-compose -f docker-compose.dev.yml exec -T postgres psql -U spywatcher -d spywatcher < backup.sql
```

## Development Workflow

### Hot Reload

Both frontend and backend support hot reload in development mode:
- **Backend**: Changes to `.ts` files automatically restart the server
- **Frontend**: Changes are reflected instantly via Vite HMR

### Installing New Dependencies

**Backend:**
```bash
# Stop containers
docker-compose -f docker-compose.dev.yml down

# Add dependency to backend/package.json
cd backend && npm install <package-name>

# Rebuild backend image
docker-compose -f docker-compose.dev.yml build backend

# Start containers
docker-compose -f docker-compose.dev.yml up
```

**Frontend:**
```bash
# Stop containers
docker-compose -f docker-compose.dev.yml down

# Add dependency to frontend/package.json
cd frontend && npm install <package-name>

# Rebuild frontend image
docker-compose -f docker-compose.dev.yml build frontend

# Start containers
docker-compose -f docker-compose.dev.yml up
```

### Running Backend Tests

**Run all backend tests:**
```bash
docker-compose -f docker-compose.dev.yml exec backend npm test
```

**Run specific test suite:**
```bash
docker-compose -f docker-compose.dev.yml exec backend npm run test:unit
docker-compose -f docker-compose.dev.yml exec backend npm run test:integration
```

**Run tests with coverage:**
```bash
docker-compose -f docker-compose.dev.yml exec backend npm run test:coverage
```

### Running Frontend Tests

**Run all frontend tests:**
```bash
docker-compose -f docker-compose.dev.yml exec frontend npm test
```

**Run E2E tests:**
```bash
docker-compose -f docker-compose.dev.yml exec frontend npm run test:e2e
```

## Production Deployment

### Image Optimization

Production images are optimized using:
- Multi-stage builds
- Layer caching
- Minimal base images (Alpine Linux)
- Non-root user execution

**Check image sizes:**
```bash
docker images | grep spywatcher
```

### Health Checks

All services include health checks:
- **Backend**: `GET /api/health`
- **Frontend**: `GET /health`
- **PostgreSQL**: `pg_isready`

**Check service health:**
```bash
docker-compose -f docker-compose.prod.yml ps
```

### Resource Limits

Production compose file includes resource limits:
- **Backend**: 1 CPU, 512MB RAM
- **Frontend**: 0.5 CPU, 256MB RAM
- **PostgreSQL**: 1 CPU, 512MB RAM
- **Nginx**: 0.5 CPU, 256MB RAM

### Environment Variables

Production requires all environment variables to be set. Create `.env` file:

```env
DB_PASSWORD=your_secure_password
ADMIN_DISCORD_IDS=123456789
BOT_GUILD_IDS=987654321
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
DISCORD_GUILD_ID=your_guild_id
DISCORD_REDIRECT_URI=https://yourdomain.com/auth/callback
JWT_REFRESH_SECRET=your_secure_refresh_secret
JWT_SECRET=your_secure_jwt_secret
VITE_API_URL=https://api.yourdomain.com
VITE_DISCORD_CLIENT_ID=your_client_id
```

### SSL/TLS Configuration

For production with SSL:

1. Create SSL certificates directory:
   ```bash
   mkdir -p nginx/ssl
   ```

2. Place your SSL certificates in `nginx/ssl/`:
   - `nginx/ssl/cert.pem`
   - `nginx/ssl/key.pem`

3. Update `nginx/nginx.conf` for SSL configuration

## Troubleshooting

### Port Already in Use

If ports are already in use, modify the port mappings in `docker-compose.*.yml`:

```yaml
ports:
  - "3002:3001"  # Map host port 3002 to container port 3001
```

### Container Won't Start

1. Check logs:
   ```bash
   docker-compose -f docker-compose.dev.yml logs [service_name]
   ```

2. Check container status:
   ```bash
   docker-compose -f docker-compose.dev.yml ps
   ```

3. Rebuild without cache:
   ```bash
   docker-compose -f docker-compose.dev.yml build --no-cache
   ```

### Database Connection Issues

1. Ensure PostgreSQL is healthy:
   ```bash
   docker-compose -f docker-compose.dev.yml exec postgres pg_isready -U spywatcher
   ```

2. Check DATABASE_URL environment variable
3. Verify network connectivity between services

### Permission Issues

If you encounter permission issues with volumes:

```bash
# Fix ownership
docker-compose -f docker-compose.dev.yml exec backend chown -R nodejs:nodejs /app
```

### Clean Everything

To completely reset:

```bash
# Stop all containers
docker-compose -f docker-compose.dev.yml down -v

# Remove all images
docker images | grep spywatcher | awk '{print $3}' | xargs docker rmi -f

# Remove volumes
docker volume prune -f

# Rebuild from scratch
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up
```

## Performance Optimization

### Enable BuildKit

For faster builds, enable Docker BuildKit:

```bash
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
```

Add to `~/.bashrc` or `~/.zshrc` for persistence.

### Layer Caching

The Dockerfiles are optimized for layer caching:
1. Package files are copied first
2. Dependencies are installed
3. Source code is copied last

This ensures dependencies are only reinstalled when `package.json` changes.

### Multi-Architecture Builds

To build for multiple architectures (e.g., amd64, arm64):

```bash
docker buildx create --use
docker buildx build --platform linux/amd64,linux/arm64 -t your-registry/spywatcher-backend:latest ./backend
```

## CI/CD Integration

### GitHub Actions

The repository includes a comprehensive Docker build workflow (`.github/workflows/docker-build.yml`) that:

1. **Builds Docker images** for backend and frontend
2. **Pushes to GitHub Container Registry** (ghcr.io) on main/develop branches
3. **Validates compose files** to ensure configuration correctness
4. **Scans for vulnerabilities** using Trivy security scanner
5. **Reports image sizes** as PR comments

The workflow runs on:
- Pushes to main/develop branches
- Pull requests targeting main/develop
- Changes to Docker-related files

#### Manual Workflow Trigger

You can also manually trigger the workflow from the Actions tab in GitHub.

#### Local Testing Before CI

Before pushing, test your Docker changes locally:

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Validate compose files
docker-compose -f docker-compose.dev.yml config
docker-compose -f docker-compose.prod.yml config
docker-compose -f docker-compose.test.yml config

# Run tests
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

### Image Registry

**Tag and push to Docker Hub:**
```bash
docker tag spywatcher-backend:latest your-username/spywatcher-backend:latest
docker push your-username/spywatcher-backend:latest
```

**Tag and push to GitHub Container Registry:**
```bash
docker tag spywatcher-backend:latest ghcr.io/your-org/spywatcher-backend:latest
docker push ghcr.io/your-org/spywatcher-backend:latest
```

## Security Best Practices

1. **Never commit `.env` files** - Use `.env.example` as template
2. **Use strong passwords** for database and secrets
3. **Keep base images updated** - Regularly rebuild with latest Alpine/Node images
4. **Scan for vulnerabilities**:
   ```bash
   docker scan spywatcher-backend:latest
   ```
5. **Run as non-root user** - All production images use non-root users
6. **Use secret management** - For production, consider Docker secrets or external secret managers

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Prisma with Docker](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)

## Support

For issues or questions:
- Open an issue on GitHub
- Check existing issues and discussions
- Review the main README.md for general setup
