# Changelog

All notable changes to Spywatcher will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive VitePress documentation site
- User guide with installation, quick start, and feature guides
- Admin guide for configuration and operations
- Developer guide with architecture and contribution guidelines
- API reference with code examples in multiple languages
- Interactive Swagger/OpenAPI documentation
- Search functionality across all documentation
- Dark mode support
- Mobile-responsive documentation layout

### Documentation
- Getting Started Guide
- Ghost Detection documentation
- Lurker Detection documentation
- Suspicion Scores explanation
- Heatmap visualization guide
- Dashboard overview
- Analytics guide
- Filters and search guide
- Troubleshooting guide
- FAQ section
- Environment configuration reference
- API endpoint documentation with examples

## [1.0.0] - 2024-11-01

### Added
- Discord bot for presence and message tracking
- React-based web dashboard
- REST API with authentication
- Ghost detection algorithm
- Lurker detection
- Suspicion scoring system
- Real-time WebSocket updates
- PostgreSQL database with Prisma ORM
- Redis caching
- Docker support for development and production
- CI/CD pipelines with GitHub Actions
- Prometheus and Grafana monitoring
- Comprehensive test suite

### Features
- Multi-client login detection
- Role drift tracking
- Channel activity analytics
- User presence analytics
- Behavioral pattern analysis
- Export capabilities (CSV, JSON, PDF)
- Filter and search functionality
- Plugin system
- Public API with SDK

### Security
- Discord OAuth2 authentication
- JWT session management
- Role-based access control
- Rate limiting
- Audit logging
- Privacy controls

## [0.9.0] - 2024-10-15

### Added
- Beta release for testing
- Core analytics engine
- Basic web interface
- Discord bot foundation

### Changed
- Migrated from SQLite to PostgreSQL
- Improved presence tracking accuracy
- Enhanced security measures

### Fixed
- WebSocket connection stability
- Memory leak in presence tracker
- Race conditions in analytics calculations

## [0.1.0] - 2024-09-01

### Added
- Initial project setup
- Basic Discord bot
- Proof of concept analytics
- SQLite database

---

## Version History

- **1.0.0** - First stable release (November 2024)
- **0.9.0** - Beta release (October 2024)
- **0.1.0** - Initial proof of concept (September 2024)

## Upgrade Guide

### Upgrading to 1.0.0 from 0.9.0

1. **Backup your database**
   ```bash
   npm run db:backup
   ```

2. **Update dependencies**
   ```bash
   npm install
   ```

3. **Run database migrations**
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

4. **Update environment variables**
   - Check `.env.example` for new variables
   - Update your `.env` file accordingly

5. **Restart services**
   ```bash
   docker-compose restart
   ```

## Breaking Changes

### Version 1.0.0

- **Database Migration Required**: Upgraded from SQLite to PostgreSQL
- **API Changes**: Some endpoint paths have changed
- **Configuration**: New environment variables required
- **Authentication**: Updated JWT implementation

## Deprecations

### Version 1.0.0

- SQLite support has been removed
- Legacy API v0 endpoints are no longer supported
- Old webhook format is deprecated (migrate to new format)

## Support

For issues or questions about releases:
- [GitHub Issues](https://github.com/subculture-collective/discord-spywatcher/issues)
- [Documentation](/guide/)
- [Developer Guide](/developer/)

---

[Unreleased]: https://github.com/subculture-collective/discord-spywatcher/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/subculture-collective/discord-spywatcher/compare/v0.9.0...v1.0.0
[0.9.0]: https://github.com/subculture-collective/discord-spywatcher/compare/v0.1.0...v0.9.0
[0.1.0]: https://github.com/subculture-collective/discord-spywatcher/releases/tag/v0.1.0
