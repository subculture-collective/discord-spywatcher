# Glossary

A comprehensive guide to terminology used in Spywatcher and Discord server management.

::: tip Quick Search
Use `Ctrl+F` or `Cmd+F` to quickly find terms in this glossary.
:::

## A

### Active User
A user who has shown presence or activity within a specified time period (typically 24 hours). Measured by online status, messages sent, or voice channel participation.

### Analytics
Statistical analysis of user behavior, presence patterns, and server activity. Spywatcher provides various analytics views including time-series charts, heatmaps, and comparative analysis.

### API (Application Programming Interface)
A set of endpoints that allows external applications to interact with Spywatcher programmatically. See [API Documentation](/api/) for details.

### API Key
A unique authentication token used to access the Spywatcher API. Generated in the settings panel and must be kept secure.

### Audit Log
A record of all administrative actions taken in Spywatcher, including user bans, setting changes, and data exports. Used for accountability and security monitoring.

## B

### Ban
The action of prohibiting a user from accessing certain features or the entire server. Spywatcher tracks bans and can provide ban analytics.

### Baseline Behavior
The normal activity pattern established for a user over time. Used as a reference point for detecting anomalies and calculating suspicion scores.

### Bot
An automated Discord account that performs tasks. Spywatcher includes a bot component for monitoring presence and collecting data.

### Burst Limit
The maximum number of API requests allowed in a short time period, typically used to prevent abuse while allowing legitimate traffic spikes.

## C

### Cache
Temporary storage of frequently accessed data to improve performance. Spywatcher uses Redis for caching analytics results and session data.

### Client Type
The platform or application a user is connecting from (e.g., Desktop, Mobile, Web). Multi-client detection can identify users connected from multiple devices simultaneously.

### CORS (Cross-Origin Resource Sharing)
A security mechanism that controls which domains can access the Spywatcher API. Configured to allow the frontend to communicate with the backend.

### CSV (Comma-Separated Values)
A file format for exporting tabular data. Spywatcher can export analytics data in CSV format for use in spreadsheet applications.

## D

### Dashboard
The main web interface for Spywatcher, displaying key metrics, visualizations, and navigation to all features.

### Data Retention
Policies defining how long different types of data are stored. Configurable in Spywatcher settings to balance storage costs with analytical value.

### Deafen
A Discord state where a user has disabled their audio input and output in voice channels. Tracked by Spywatcher's presence monitoring.

### Deployment
The process of installing and configuring Spywatcher on a server or cloud platform. Can be done via Docker, Kubernetes, or manual installation.

## E

### Endpoint
A specific API URL that performs a particular function, such as `/api/ghosts` for retrieving ghost detection data.

### Export
The process of downloading Spywatcher data in various formats (CSV, JSON, PDF) for external analysis or record-keeping.

## F

### False Positive
An incorrect detection of suspicious behavior. For example, a legitimate user incorrectly flagged as a ghost or high suspicion score. Spywatcher allows clearing false positives.

### Filter
Criteria used to narrow down data displayed in analytics views. Can filter by user, role, date range, activity level, and more.

## G

### Ghost Account
A user account that maintains presence on the server (appears online) but rarely or never participates in conversations. Often indicates bot accounts or surveillance.

### Guild
Discord's term for a server. A guild is a community with channels, roles, and members.

### Guild ID
A unique numerical identifier for a Discord server. Used in configuration to specify which servers to monitor.

## H

### Heatmap
A data visualization showing activity intensity across time dimensions (time of day and day of week). Darker colors typically indicate higher activity levels.

### Health Check
An API endpoint (`/api/health`) that verifies the application is running correctly. Used for monitoring and load balancer configuration.

## I

### Intent
A Discord Gateway feature that must be enabled for bots to receive certain events. Privileged intents (Presence, Server Members, Message Content) require explicit enabling in the Developer Portal.

### Integration
A connection between Spywatcher and external services, such as webhooks for notifications or external analytics platforms.

## J

### JSON (JavaScript Object Notation)
A data format used for API responses and configuration. Structured as key-value pairs and arrays.

### JWT (JSON Web Token)
An authentication token format used by Spywatcher for secure API access. Contains encoded user information and an expiration time.

## K

### Kubernetes (K8s)
A container orchestration platform. Spywatcher provides Kubernetes manifests for scalable production deployments.

## L

### Latency
The time delay between a request and response. Lower latency means faster, more responsive application performance.

### Load Balancer
A system that distributes incoming requests across multiple servers to ensure high availability and performance.

### Lurker
A user who is present in the server but rarely participates actively. Similar to ghosts but may occasionally send messages.

### Loki
A log aggregation system used by Spywatcher for centralized logging. Integrates with Grafana for log visualization.

## M

### Metric
A measurable value tracked by Spywatcher, such as total users, active users, message count, or presence duration.

### Migration
A database schema change. Spywatcher uses Prisma migrations to update the database structure when the application is updated.

### Moderator
A user with elevated permissions to manage server members and content. Typically has view-only or view-and-export access to Spywatcher.

### Multi-Client Detection
The ability to identify when a single user is connected from multiple devices or platforms simultaneously. Can indicate account sharing or suspicious behavior.

## O

### OAuth2
An authorization framework used by Discord for secure authentication. Spywatcher uses Discord OAuth2 to log users in without handling passwords.

### Offline
A Discord presence status indicating a user is not connected to Discord.

### Online
A Discord presence status indicating a user is connected and active.

## P

### Pagination
The practice of dividing large datasets into smaller pages for better performance and usability.

### Permission
An authorization level that determines what actions a user can perform in Spywatcher. Includes view, export, modify, and admin levels.

### Plugin
An extension that adds custom functionality to Spywatcher. Plugins can hook into events, add API endpoints, and access core services.

### PostgreSQL
The recommended database system for Spywatcher. A powerful, open-source relational database.

### Presence
Information about a user's Discord status, including online/offline state, current activity, and client type.

### Presence Intent
A privileged Discord gateway intent required to receive presence update events. Must be enabled in the Developer Portal.

### Prisma
An ORM (Object-Relational Mapping) tool used by Spywatcher to interact with the database in a type-safe manner.

## Q

### Query
A request for data from the database or API. Can include filters, sorting, and pagination parameters.

### Queue
A list of tasks waiting to be processed. Spywatcher uses queues for background jobs like data archival and report generation.

### Quota
A limit on resource usage, such as the number of API calls allowed per day. Varies by subscription tier.

## R

### Rate Limit
A restriction on how many requests can be made to the API within a time period. Prevents abuse and ensures fair usage.

### Real-time
Data or updates that occur immediately as events happen. Spywatcher uses WebSockets for real-time dashboard updates.

### Redis
An in-memory data store used by Spywatcher for caching, session storage, and rate limiting.

### Refresh Token
A long-lived token used to obtain new access tokens without requiring re-authentication. Expires after a longer period (typically 7 days).

### Role
A Discord permission group assigned to users. Spywatcher tracks role distributions and changes over time.

### Rollback
The process of reverting to a previous version of the application or database state, typically after detecting an issue.

## S

### Schema
The structure of the database, defining tables, columns, and relationships. Managed by Prisma migrations.

### Scraping
The automated collection of data, sometimes in violation of terms of service. Spywatcher uses official Discord APIs and never scrapes.

### Session
A period of authenticated access to Spywatcher. Sessions expire after a period of inactivity for security.

### Shard
A portion of a bot's connection load, used to distribute Discord gateway connections across multiple processes for very large bots.

### Suspicion Score
A calculated metric (0-100) indicating how suspicious a user's behavior appears. Based on multiple factors including activity patterns, client types, and behavioral changes.

## T

### Tier
A subscription level determining feature access and usage limits. Includes FREE, PRO, and ENTERPRISE tiers.

### Timeline
A chronological view of a user's activity, including presence changes, messages, role updates, and other events.

### Token
An authentication credential. Includes bot tokens, access tokens, refresh tokens, and API keys.

### TTL (Time To Live)
The duration for which cached data remains valid before being refreshed.

## U

### Uptime
The percentage of time a service is operational and available. Monitored for the bot, API, and database.

### User Agent
A string identifying the client software making a request. Used to detect unusual client types.

## V

### Visualization
A graphical representation of data, such as charts, graphs, and heatmaps.

### VitePress
The documentation framework used for Spywatcher's documentation site.

### Voice Presence
Tracking of user presence in voice channels, including join/leave times and mute/deafen status.

## W

### WAL (Write-Ahead Logging)
A PostgreSQL feature that enables point-in-time recovery by logging all changes before applying them.

### Webhook
A URL endpoint that receives HTTP POST requests when specific events occur. Used for integrations and notifications.

### WebSocket
A protocol enabling two-way communication between client and server. Used by Spywatcher for real-time dashboard updates.

### Whitelist
A list of users or patterns exempted from certain detections. Useful for preventing false positives on known legitimate users.

## Z

### Zod
A TypeScript schema validation library used by Spywatcher to validate environment variables and API inputs.

## Common Acronyms

### API
Application Programming Interface

### CDN
Content Delivery Network

### CORS
Cross-Origin Resource Sharing

### CSV
Comma-Separated Values

### DDoS
Distributed Denial of Service

### GDPR
General Data Protection Regulation

### HTTPS
Hypertext Transfer Protocol Secure

### JSON
JavaScript Object Notation

### JWT
JSON Web Token

### OAuth
Open Authorization

### ORM
Object-Relational Mapping

### REST
Representational State Transfer

### SDK
Software Development Kit

### SQL
Structured Query Language

### SSL/TLS
Secure Sockets Layer / Transport Layer Security

### TTL
Time To Live

### UI
User Interface

### URL
Uniform Resource Locator

### VPC
Virtual Private Cloud

### WAF
Web Application Firewall

### WAL
Write-Ahead Logging

---

## See Also

- [FAQ](./faq) - Frequently asked questions
- [Troubleshooting](./troubleshooting) - Common issues and solutions
- [API Documentation](/api/) - Technical API reference
- [Developer Guide](/developer/) - Development documentation

::: tip Missing a Term?
If you encounter a term not listed here, please [open an issue](https://github.com/subculture-collective/discord-spywatcher/issues) to help us improve this glossary.
:::

*Last updated: November 2024*
