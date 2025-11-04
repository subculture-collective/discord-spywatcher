import swaggerJsdoc from 'swagger-jsdoc';

import { env } from '../utils/env';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Spywatcher API',
            version: '1.0.0',
            description: `# Discord Spywatcher API

A comprehensive Discord surveillance and analytics API that provides insights into user behavior, activity patterns, and security monitoring.

## Features
- 🔐 **Discord OAuth2 Authentication** - Secure authentication using Discord
- 📊 **Analytics & Insights** - Ghost detection, lurker analysis, activity heatmaps
- 🛡️ **Security Monitoring** - Suspicious activity detection and IP management
- 🔌 **Plugin System** - Extensible plugin architecture
- 🔒 **GDPR Compliant** - Full data export, deletion, and audit logging
- ⚡ **Rate Limited** - Built-in rate limiting for API stability

## Authentication

Most endpoints require authentication using JWT Bearer tokens obtained through Discord OAuth2:

\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

To authenticate:
1. Direct users to Discord OAuth2 authorization URL
2. Handle the callback at \`GET /api/auth/discord\`
3. Use the returned \`accessToken\` for subsequent API calls
4. Refresh tokens when needed using \`POST /api/auth/refresh\`

## Rate Limiting

The API implements multiple rate limiting tiers:
- **Global API**: 100 requests per 15 minutes
- **Analytics**: 30 requests per minute
- **Authentication**: Separate limits for login attempts
- **Public API**: 60 requests per minute

Rate limit information is returned in response headers:
- \`X-RateLimit-Limit\`: Maximum requests allowed
- \`X-RateLimit-Remaining\`: Requests remaining in window
- \`X-RateLimit-Reset\`: Time when the limit resets

When rate limited, you'll receive a \`429 Too Many Requests\` response with a \`Retry-After\` header.`,
            contact: {
                name: 'API Support',
                email: 'support@spywatcher.dev',
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT',
            },
        },
        servers: [
            {
                url: `http://localhost:${env.PORT || 3001}/api`,
                description: 'Development server',
            },
            {
                url: 'https://api.spywatcher.dev/api',
                description: 'Production server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'JWT authentication token',
                },
                oauth2: {
                    type: 'oauth2',
                    flows: {
                        authorizationCode: {
                            authorizationUrl:
                                'https://discord.com/oauth2/authorize',
                            tokenUrl: 'https://discord.com/api/oauth2/token',
                            scopes: {
                                identify: 'Read user profile',
                                guilds: 'Read user guilds',
                            },
                        },
                    },
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    required: ['id', 'discordId', 'username'],
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                            description: 'Internal user ID',
                        },
                        discordId: {
                            type: 'string',
                            description: 'Discord user ID',
                        },
                        username: {
                            type: 'string',
                            description: 'Discord username',
                        },
                        avatar: {
                            type: 'string',
                            nullable: true,
                            description: 'Discord avatar hash',
                        },
                        role: {
                            type: 'string',
                            enum: ['USER', 'ADMIN', 'MODERATOR', 'BANNED'],
                            description: 'User role',
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Account creation timestamp',
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Last update timestamp',
                        },
                    },
                },
                GhostScore: {
                    type: 'object',
                    properties: {
                        userId: {
                            type: 'string',
                            description: 'User ID',
                        },
                        username: {
                            type: 'string',
                            description: 'Username',
                        },
                        presenceCount: {
                            type: 'integer',
                            description: 'Number of presence events',
                        },
                        messageCount: {
                            type: 'integer',
                            description: 'Number of messages sent',
                        },
                        ghostScore: {
                            type: 'number',
                            format: 'float',
                            description:
                                'Ratio of presence to messages (higher = more ghosting)',
                        },
                    },
                },
                ChannelHeatmap: {
                    type: 'object',
                    properties: {
                        channelId: {
                            type: 'string',
                            description: 'Channel ID',
                        },
                        channelName: {
                            type: 'string',
                            description: 'Channel name',
                        },
                        messageCount: {
                            type: 'integer',
                            description: 'Number of messages',
                        },
                        uniqueUsers: {
                            type: 'integer',
                            description: 'Number of unique users',
                        },
                    },
                },
                BannedIP: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Ban record ID',
                        },
                        ip: {
                            type: 'string',
                            description: 'Banned IP address',
                        },
                        reason: {
                            type: 'string',
                            nullable: true,
                            description: 'Reason for ban',
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Ban creation timestamp',
                        },
                    },
                },
                Plugin: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Plugin unique identifier',
                        },
                        name: {
                            type: 'string',
                            description: 'Plugin display name',
                        },
                        version: {
                            type: 'string',
                            description: 'Plugin version',
                        },
                        author: {
                            type: 'string',
                            description: 'Plugin author',
                        },
                        description: {
                            type: 'string',
                            description: 'Plugin description',
                        },
                        state: {
                            type: 'string',
                            enum: ['LOADED', 'UNLOADED', 'ERROR'],
                            description: 'Current plugin state',
                        },
                    },
                },
                Session: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Session ID',
                        },
                        userAgent: {
                            type: 'string',
                            nullable: true,
                            description: 'Browser user agent',
                        },
                        ipAddress: {
                            type: 'string',
                            nullable: true,
                            description: 'IP address',
                        },
                        lastActivity: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Last activity timestamp',
                        },
                        expiresAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Session expiration time',
                        },
                    },
                },
                AnalyticsRule: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Rule ID',
                        },
                        name: {
                            type: 'string',
                            description: 'Rule name',
                        },
                        description: {
                            type: 'string',
                            nullable: true,
                            description: 'Rule description',
                        },
                        status: {
                            type: 'string',
                            enum: ['DRAFT', 'ACTIVE', 'PAUSED'],
                            description: 'Rule status',
                        },
                        triggerType: {
                            type: 'string',
                            enum: ['SCHEDULED', 'EVENT', 'MANUAL'],
                            description: 'How the rule is triggered',
                        },
                    },
                },
                Error: {
                    type: 'object',
                    required: ['error', 'message'],
                    properties: {
                        error: {
                            type: 'string',
                            description: 'Error type',
                            example: 'Unauthorized',
                        },
                        message: {
                            type: 'string',
                            description: 'Error message',
                            example: 'Invalid authentication token',
                        },
                        details: {
                            type: 'object',
                            nullable: true,
                            description: 'Additional error details',
                        },
                    },
                },
            },
            responses: {
                Unauthorized: {
                    description:
                        'Unauthorized - Invalid or missing authentication',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error',
                            },
                            example: {
                                error: 'Unauthorized',
                                message: 'Missing authorization header',
                            },
                        },
                    },
                },
                Forbidden: {
                    description: 'Forbidden - Insufficient permissions',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error',
                            },
                            example: {
                                error: 'Forbidden',
                                message: 'Insufficient permissions',
                            },
                        },
                    },
                },
                NotFound: {
                    description: 'Not Found - Resource does not exist',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error',
                            },
                            example: {
                                error: 'Not Found',
                                message: 'Resource not found',
                            },
                        },
                    },
                },
                TooManyRequests: {
                    description: 'Too many requests - Rate limit exceeded',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error',
                            },
                            example: {
                                error: 'Too Many Requests',
                                message: 'Rate limit exceeded',
                            },
                        },
                    },
                    headers: {
                        'Retry-After': {
                            description: 'Seconds to wait before retry',
                            schema: {
                                type: 'integer',
                            },
                        },
                    },
                },
                BadRequest: {
                    description: 'Bad Request - Invalid input',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error',
                            },
                            example: {
                                error: 'Bad Request',
                                message: 'Invalid input parameters',
                            },
                        },
                    },
                },
            },
            parameters: {
                GuildIdQuery: {
                    in: 'query',
                    name: 'guildId',
                    required: false,
                    schema: {
                        type: 'string',
                    },
                    description: 'Filter by Discord guild ID',
                },
                SinceQuery: {
                    in: 'query',
                    name: 'since',
                    required: false,
                    schema: {
                        type: 'string',
                        format: 'date-time',
                    },
                    description: 'Filter results since this timestamp',
                },
                FilterBannedQuery: {
                    in: 'query',
                    name: 'filterBanned',
                    required: false,
                    schema: {
                        type: 'boolean',
                        default: false,
                    },
                    description: 'Exclude banned users from results',
                },
                LimitQuery: {
                    in: 'query',
                    name: 'limit',
                    schema: {
                        type: 'integer',
                        minimum: 1,
                        maximum: 100,
                        default: 50,
                    },
                    description: 'Maximum number of results to return',
                },
                PageQuery: {
                    in: 'query',
                    name: 'page',
                    schema: {
                        type: 'integer',
                        minimum: 1,
                        default: 1,
                    },
                    description: 'Page number for pagination',
                },
            },
        },
        tags: [
            {
                name: 'Authentication',
                description:
                    'Discord OAuth2 authentication and session management',
            },
            {
                name: 'Analytics',
                description: 'User behavior analytics and insights',
            },
            {
                name: 'Analytics Rules',
                description:
                    'Create and manage automated analytics rules and alerts',
            },
            {
                name: 'Bans',
                description: 'IP ban and whitelist management',
            },
            {
                name: 'Timeline',
                description: 'User activity timelines',
            },
            {
                name: 'Suspicion',
                description: 'Suspicious activity detection',
            },
            {
                name: 'Status',
                description: 'System status and health',
            },
            {
                name: 'Privacy',
                description: 'User privacy and data management (GDPR)',
            },
            {
                name: 'Admin Privacy',
                description:
                    'Administrative privacy controls and audit logs',
            },
            {
                name: 'Admin',
                description: 'Administrative functions',
            },
            {
                name: 'Monitoring',
                description: 'System monitoring and metrics',
            },
            {
                name: 'Plugins',
                description: 'Plugin management and configuration',
            },
            {
                name: 'Public API',
                description: 'Public API documentation and information',
            },
        ],
        externalDocs: {
            description: 'Full API Documentation',
            url: 'https://github.com/subculture-collective/discord-spywatcher/blob/main/docs/API_DOCUMENTATION.md',
        },
    },
    apis: ['./src/routes/*.ts', './src/routes/**/*.ts'], // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options);
