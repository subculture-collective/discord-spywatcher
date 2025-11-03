/* eslint-disable @typescript-eslint/no-floating-promises */
import { createServer } from 'http';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

import { env } from './utils/env';
import { sanitizeForLog } from './utils/security';

dotenv.config();
console.log('🌱 Starting boot');

console.log('✅ dotenv loaded');
console.log('✅ env loaded');
console.log('✅ express loaded');
console.log('✅ cors loaded');

const app = express();
const PORT = env.PORT || 3001;
const allowedOrigins =
    env.CORS_ORIGINS && env.CORS_ORIGINS.length > 0
        ? env.CORS_ORIGINS
        : ['http://localhost:5173', 'http://127.0.0.1:5173'];

(async () => {
    // Initialize monitoring before any other middleware
    const {
        initSentry,
        getSentryErrorHandler,
        setupDatabaseMonitoring,
        metricsMiddleware,
    } = await import('./monitoring');
    initSentry(app);
    setupDatabaseMonitoring();
    try {
        const {
            attachRequestId,
            requestLogger,
            securityHeaders,
            additionalSecurityHeaders,
            requestSizeLimiter,
            blockKnownBadIPs,
            parameterLimitMiddleware,
            headerValidationMiddleware,
            requestValidationMiddleware,
            slowDownMiddleware,
            abuseDetectionMiddleware,
            loadSheddingMiddleware,
            circuitBreakerMiddleware,
            globalRateLimiter,
            cacheControlHeaders,
            etagMiddleware,
            securityLoggingMiddleware,
            trackApiRequest,
        } = await import('./middleware');
        console.log('✅ middleware loaded');

        // Initialize Redis connection
        const { getRedisClient } = await import('./utils/redis');
        const redis = getRedisClient();
        if (redis) {
            console.log('✅ Redis rate limiting enabled');
        } else {
            console.log('⚠️  Redis not available, using in-memory rate limiting');
        }

        // Security middleware - apply first (after monitoring initialization)
        app.use(securityHeaders);
        app.use(additionalSecurityHeaders);
        // DDoS Protection Layer 1: Request validation
        app.use(headerValidationMiddleware);
        app.use(requestValidationMiddleware);
        app.use(requestSizeLimiter);
        app.use(parameterLimitMiddleware);

        // IP Blocking - check for blocked IPs
        if (env.ENABLE_IP_BLOCKING) {
            app.use(blockKnownBadIPs);
            console.log('✅ IP blocking enabled');
        }

        // Request tracking
        app.use(attachRequestId);

        // CORS configuration
        app.use(
            cors({
                origin: (origin, callback) => {
                    // Allow requests with no origin (mobile apps, Postman, etc.)
                    if (!origin) {
                        callback(null, true);
                        return;
                    }

                    if (allowedOrigins.includes(origin)) {
                        callback(null, true);
                    } else {
                        console.warn(`🚫 CORS blocked origin: ${sanitizeForLog(origin)}`);
                        callback(new Error('Not allowed by CORS'));
                    }
                },
                credentials: true,
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
                allowedHeaders: [
                    'Content-Type',
                    'Authorization',
                    'X-Request-ID',
                ],
                exposedHeaders: ['X-Request-ID'],
                maxAge: 86400, // 24 hours
            })
        );

        app.options(/.*/, cors());

        // Body parsing with size limits
        app.use(express.json({ limit: '10mb' }));
        app.use(express.urlencoded({ extended: true, limit: '10mb' }));
        app.use(cookieParser());

        // Logging
        app.use(requestLogger);

        // Security event logging middleware
        app.use(securityLoggingMiddleware);
        console.log('✅ Security logging enabled');

        // Metrics middleware
        app.use(metricsMiddleware);

        // Analytics tracking middleware
        app.use(trackApiRequest);
        console.log('✅ Analytics tracking enabled');

        // Caching headers for better performance
        app.use(cacheControlHeaders);
        app.use(etagMiddleware);

        // Load management middleware
        if (env.ENABLE_LOAD_SHEDDING) {
            app.use(circuitBreakerMiddleware);
            app.use(loadSheddingMiddleware);
            console.log('✅ Load shedding enabled');
        }

        // DDoS Protection Layer 2: Slowdown and abuse detection
        app.use(slowDownMiddleware);
        app.use(abuseDetectionMiddleware);

        // Apply general API rate limiting
        if (env.ENABLE_RATE_LIMITING) {
            app.use('/api', globalRateLimiter);
            console.log('✅ Global rate limiting enabled');
        }
    } catch (err) {
        console.error('🔥 Failed to import or use middleware:', err);
        return;
    }

    // Health and metrics routes (before rate limiting)
    try {
        const healthRoutes = (await import('./routes/health')).default;
        app.use('/health', healthRoutes);
        console.log('✅ health routes loaded');
    } catch (err) {
        console.error('🔥 Failed to load health routes:', err);
    }

    try {
        const { metricsHandler } = await import('./monitoring');
        app.get('/metrics', metricsHandler);
        console.log('✅ metrics endpoint loaded');
    } catch (err) {
        console.error('🔥 Failed to load metrics endpoint:', err);
    }

    try {
        const apiRoutes = (await import('./routes/api')).default;
        app.use('/api', apiRoutes);
        console.log('✅ routes loaded');
    } catch (err) {
        console.error('🔥 Failed to load routes:', err);
        return;
    }

    // Initialize plugin system
    try {
        const path = await import('path');
        const { pluginManager } = await import('./plugins');
        const pluginDir = path.join(__dirname, '../plugins');
        const dataDir = path.join(__dirname, '../plugin-data');
        
        await pluginManager.initialize(
            {
                pluginDir,
                dataDir,
                autoStart: true,
            },
            undefined, // Discord client will be set from bot
            app
        );
        console.log('✅ Plugin system initialized');
    } catch (err) {
        console.error('⚠️  Failed to initialize plugin system:', err);
        // Don't exit - continue without plugins
    }

    // Sentry error handler - must be after all routes and before other error handlers
    if (env.SENTRY_DSN) {
        app.use(getSentryErrorHandler());
    }

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize WebSocket server
    try {
        const { websocketService } = await import('./services/websocket');
        websocketService.setupWebSocket(httpServer);
        console.log('✅ WebSocket server initialized');
    } catch (err) {
        console.error('🔥 Failed to initialize WebSocket server:', err);
    }

    httpServer.listen(PORT, () => {
        console.log(
            `🔐 Starting server with bot in guild(s):`,
            env.BOT_GUILD_IDS
        );
        console.log(`🔐 Spywatcher API running at http://localhost:${PORT}`);
        console.log(`🌐 WebSocket server available`);
        console.log(`🛡️  Security headers enabled`);
        console.log(
            `🛡️  Rate limiting: ${env.ENABLE_RATE_LIMITING ? 'enabled' : 'disabled'}`
        );
        
        // Initialize GDPR compliance features
        import('./utils/dataRetention')
            .then(({ initializeRetentionPolicies }) => {
                return initializeRetentionPolicies();
            })
            .then(() => {
                console.log('✅ Data retention policies initialized');
            })
            .catch((err) => {
                console.error('Failed to initialize retention policies:', err);
            });
        
        // Start scheduled privacy tasks
        import('./utils/scheduledTasks')
            .then(({ startScheduledPrivacyTasks, startBackupHealthChecks }) => {
                startScheduledPrivacyTasks();
                console.log('✅ Scheduled privacy tasks started');
                
                startBackupHealthChecks();
                console.log('✅ Backup health checks started');
            })
            .catch((err) => {
                console.error('Failed to start scheduled tasks:', err);
            });
        
        // Start status check job
        import('./services/statusCheck')
            .then(({ startStatusCheckJob }) => {
                startStatusCheckJob(5); // Check every 5 minutes
                console.log('✅ Status check job started');
            })
            .catch((err) => {
                console.error('Failed to start status check job:', err);
            });
    });
})();
