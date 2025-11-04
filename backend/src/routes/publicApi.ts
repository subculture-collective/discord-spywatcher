/**
 * Public API Routes
 * RESTful API endpoints for third-party integrations
 */

import express from 'express';

import { requireApiKey } from '../middleware/apiKey';
import { publicApiLimiter } from '../middleware/rateLimiter';

const router = express.Router();

/**
 * @openapi
 * /public/docs:
 *   get:
 *     tags:
 *       - Public API
 *     summary: Get public API documentation
 *     description: Returns comprehensive API documentation in JSON format including endpoints, rate limits, and authentication info
 *     responses:
 *       200:
 *         description: API documentation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 version:
 *                   type: string
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 authentication:
 *                   type: object
 *                 rateLimits:
 *                   type: object
 *                 endpoints:
 *                   type: object
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.get('/docs', publicApiLimiter, (_req, res) => {
    const apiDocs = {
        version: '1.0.0',
        title: 'Spywatcher Public API',
        description:
            'RESTful API for Discord Spywatcher - Analytics and Monitoring',
        baseUrl: '/api',
        authentication: {
            type: 'API Key',
            format: 'Bearer spy_live_...',
            header: 'Authorization',
            description:
                'Include your API key in the Authorization header as: Bearer spy_live_your_api_key',
        },
        rateLimits: {
            global: '100 requests per 15 minutes',
            analytics: '30 requests per minute',
            admin: '100 requests per 15 minutes',
            public: '60 requests per minute',
        },
        endpoints: {
            health: {
                path: '/health',
                method: 'GET',
                description: 'Health check endpoint',
                authentication: false,
                response: {
                    status: 'string',
                    timestamp: 'string',
                },
            },
            analytics: {
                ghosts: {
                    path: '/ghosts',
                    method: 'GET',
                    description: 'Get ghost users (inactive users)',
                    authentication: true,
                    queryParams: {
                        guildId: 'string (optional)',
                        startDate: 'ISO 8601 date string (optional)',
                        endDate: 'ISO 8601 date string (optional)',
                        page: 'number (optional)',
                        perPage: 'number (optional)',
                    },
                    response: 'Array<GhostUser>',
                },
                lurkers: {
                    path: '/lurkers',
                    method: 'GET',
                    description: 'Get lurkers (low activity users)',
                    authentication: true,
                    queryParams: {
                        guildId: 'string (optional)',
                        page: 'number (optional)',
                        perPage: 'number (optional)',
                    },
                    response: 'Array<LurkerUser>',
                },
                heatmap: {
                    path: '/heatmap',
                    method: 'GET',
                    description: 'Get activity heatmap data',
                    authentication: true,
                    queryParams: {
                        guildId: 'string (optional)',
                        startDate: 'ISO 8601 date string (optional)',
                        endDate: 'ISO 8601 date string (optional)',
                    },
                    response: 'Array<HeatmapData>',
                },
                roles: {
                    path: '/roles',
                    method: 'GET',
                    description: 'Get role changes',
                    authentication: true,
                    queryParams: {
                        page: 'number (optional)',
                        perPage: 'number (optional)',
                    },
                    response: 'PaginatedResponse<RoleChange>',
                },
                clients: {
                    path: '/clients',
                    method: 'GET',
                    description: 'Get client data (web, mobile, desktop)',
                    authentication: true,
                    queryParams: {
                        guildId: 'string (optional)',
                    },
                    response: 'Array<ClientData>',
                },
                shifts: {
                    path: '/shifts',
                    method: 'GET',
                    description: 'Get status shifts',
                    authentication: true,
                    queryParams: {
                        guildId: 'string (optional)',
                    },
                    response: 'Array<ShiftData>',
                },
            },
            suspicion: {
                path: '/suspicion',
                method: 'GET',
                description: 'Get suspicion data',
                authentication: true,
                queryParams: {
                    guildId: 'string (optional)',
                },
                response: 'Array<SuspicionData>',
            },
            timeline: {
                list: {
                    path: '/timeline',
                    method: 'GET',
                    description: 'Get timeline events',
                    authentication: true,
                    queryParams: {
                        page: 'number (optional)',
                        perPage: 'number (optional)',
                    },
                    response: 'Array<TimelineEvent>',
                },
                user: {
                    path: '/timeline/:userId',
                    method: 'GET',
                    description: 'Get timeline events for a specific user',
                    authentication: true,
                    pathParams: {
                        userId: 'string',
                    },
                    queryParams: {
                        page: 'number (optional)',
                        perPage: 'number (optional)',
                    },
                    response: 'Array<TimelineEvent>',
                },
            },
            bans: {
                guilds: {
                    list: {
                        path: '/banned',
                        method: 'GET',
                        description: 'Get banned guilds',
                        authentication: true,
                        response: 'Array<BannedGuild>',
                    },
                    ban: {
                        path: '/ban',
                        method: 'POST',
                        description: 'Ban a guild',
                        authentication: true,
                        requiredRole: 'ADMIN',
                        body: {
                            guildId: 'string',
                            reason: 'string',
                        },
                        response: '{ success: boolean }',
                    },
                    unban: {
                        path: '/unban',
                        method: 'POST',
                        description: 'Unban a guild',
                        authentication: true,
                        requiredRole: 'ADMIN',
                        body: {
                            guildId: 'string',
                        },
                        response: '{ success: boolean }',
                    },
                },
                users: {
                    list: {
                        path: '/userbans',
                        method: 'GET',
                        description: 'Get banned users',
                        authentication: true,
                        response: 'Array<BannedUser>',
                    },
                    ban: {
                        path: '/userban',
                        method: 'POST',
                        description: 'Ban a user',
                        authentication: true,
                        requiredRole: 'ADMIN',
                        body: {
                            userId: 'string',
                            reason: 'string',
                        },
                        response: '{ success: boolean }',
                    },
                    unban: {
                        path: '/userunban',
                        method: 'POST',
                        description: 'Unban a user',
                        authentication: true,
                        requiredRole: 'ADMIN',
                        body: {
                            userId: 'string',
                        },
                        response: '{ success: boolean }',
                    },
                },
            },
            auth: {
                me: {
                    path: '/auth/me',
                    method: 'GET',
                    description: 'Get current authenticated user',
                    authentication: true,
                    response: 'User',
                },
                apiKeys: {
                    list: {
                        path: '/auth/api-keys',
                        method: 'GET',
                        description: 'Get user API keys',
                        authentication: true,
                        response: 'Array<ApiKeyInfo>',
                    },
                    create: {
                        path: '/auth/api-keys',
                        method: 'POST',
                        description: 'Create a new API key',
                        authentication: true,
                        body: {
                            name: 'string',
                            scopes: 'Array<string> (optional)',
                        },
                        response: '{ id: string, key: string }',
                    },
                    revoke: {
                        path: '/auth/api-keys/:keyId',
                        method: 'DELETE',
                        description: 'Revoke an API key',
                        authentication: true,
                        pathParams: {
                            keyId: 'string',
                        },
                        response: '{ success: boolean }',
                    },
                },
            },
        },
        types: {
            User: {
                id: 'string',
                discordId: 'string',
                username: 'string',
                discriminator: 'string',
                avatar: 'string (optional)',
                role: 'USER | MODERATOR | ADMIN | BANNED',
                createdAt: 'string',
                updatedAt: 'string',
            },
            GhostUser: {
                userId: 'string',
                username: 'string',
                lastSeen: 'string',
                daysSinceLastSeen: 'number',
            },
            LurkerUser: {
                userId: 'string',
                username: 'string',
                messageCount: 'number',
                presenceCount: 'number',
                joinedAt: 'string',
            },
            HeatmapData: {
                hour: 'number (0-23)',
                dayOfWeek: 'number (0-6)',
                count: 'number',
            },
            RoleChange: {
                userId: 'string',
                username: 'string',
                rolesBefore: 'Array<string>',
                rolesAfter: 'Array<string>',
                changedAt: 'string',
            },
            ClientData: {
                userId: 'string',
                username: 'string',
                clients: 'Array<string>',
                timestamp: 'string',
            },
            ShiftData: {
                userId: 'string',
                username: 'string',
                previousStatus: 'string',
                currentStatus: 'string',
                timestamp: 'string',
            },
            SuspicionData: {
                userId: 'string',
                username: 'string',
                suspicionScore: 'number',
                reasons: 'Array<string>',
                timestamp: 'string',
            },
            TimelineEvent: {
                id: 'string',
                userId: 'string',
                username: 'string',
                eventType: 'string',
                data: 'object',
                timestamp: 'string',
            },
            BannedGuild: {
                guildId: 'string',
                guildName: 'string',
                reason: 'string',
                bannedAt: 'string',
            },
            BannedUser: {
                userId: 'string',
                username: 'string',
                reason: 'string',
                bannedAt: 'string',
            },
            ApiKeyInfo: {
                id: 'string',
                name: 'string',
                scopes: 'string',
                lastUsedAt: 'string (optional)',
                expiresAt: 'string (optional)',
                createdAt: 'string',
            },
        },
        examples: {
            curl: {
                description: 'Example cURL request',
                command:
                    'curl -H "Authorization: Bearer spy_live_your_api_key" https://api.spywatcher.com/api/ghosts',
            },
            javascript: {
                description: 'Example JavaScript/TypeScript request',
                code: `
import { Spywatcher } from '@spywatcher/sdk';

const client = new Spywatcher({
  baseUrl: 'https://api.spywatcher.com/api',
  apiKey: 'spy_live_your_api_key'
});

const ghosts = await client.analytics.getGhosts();
console.log(ghosts);
        `.trim(),
            },
            python: {
                description: 'Example Python request',
                code: `
import requests

headers = {
    'Authorization': 'Bearer spy_live_your_api_key'
}

response = requests.get(
    'https://api.spywatcher.com/api/ghosts',
    headers=headers
)

data = response.json()
print(data)
        `.trim(),
            },
        },
        sdk: {
            name: '@spywatcher/sdk',
            version: '1.0.0',
            repository:
                'https://github.com/subculture-collective/discord-spywatcher',
            documentation:
                'https://github.com/subculture-collective/discord-spywatcher/tree/main/sdk',
            installation: 'npm install @spywatcher/sdk',
        },
    };

    res.json(apiDocs);
});

/**
 * API OpenAPI/Swagger specification
 */
router.get('/openapi', publicApiLimiter, (_req, res) => {
    const openApiSpec = {
        openapi: '3.0.0',
        info: {
            title: 'Spywatcher Public API',
            version: '1.0.0',
            description:
                'RESTful API for Discord Spywatcher - Analytics and Monitoring',
            contact: {
                name: 'Subculture Collective',
                url: 'https://github.com/subculture-collective/discord-spywatcher',
            },
            license: {
                name: 'MIT',
            },
        },
        servers: [
            {
                url: '/api',
                description: 'API Server',
            },
        ],
        components: {
            securitySchemes: {
                ApiKeyAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'API Key',
                    description:
                        'API key authentication (format: spy_live_...)',
                },
            },
        },
        security: [
            {
                ApiKeyAuth: [],
            },
        ],
        paths: {
            '/health': {
                get: {
                    summary: 'Health check',
                    description: 'Check API health status',
                    security: [],
                    responses: {
                        '200': {
                            description: 'API is healthy',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            status: { type: 'string' },
                                            timestamp: { type: 'string' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            '/ghosts': {
                get: {
                    summary: 'Get ghost users',
                    description: 'Get users who have been inactive',
                    parameters: [
                        {
                            name: 'guildId',
                            in: 'query',
                            schema: { type: 'string' },
                        },
                        {
                            name: 'startDate',
                            in: 'query',
                            schema: { type: 'string', format: 'date-time' },
                        },
                        {
                            name: 'endDate',
                            in: 'query',
                            schema: { type: 'string', format: 'date-time' },
                        },
                    ],
                    responses: {
                        '200': {
                            description: 'List of ghost users',
                        },
                    },
                },
            },
            // Additional paths would be defined here...
        },
    };

    res.json(openApiSpec);
});

/**
 * Protected test endpoint
 * Used to verify API key authentication
 */
router.get('/test', requireApiKey, (req, res) => {
    res.json({
        success: true,
        message: 'API key authentication successful',
        user: {
            id: req.user?.userId,
            username: req.user?.username,
            role: req.user?.role,
        },
    });
});

export default router;
