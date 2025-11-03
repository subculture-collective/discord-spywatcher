import swaggerJsdoc from 'swagger-jsdoc';

import { env } from '../utils/env';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Spywatcher API',
            version: '1.0.0',
            description: 'Discord surveillance and analytics API',
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
                description: 'User privacy and data management',
            },
            {
                name: 'Admin',
                description: 'Administrative functions',
            },
            {
                name: 'Monitoring',
                description: 'System monitoring and metrics',
            },
        ],
    },
    apis: ['./src/routes/*.ts', './src/routes/**/*.ts'], // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options);
