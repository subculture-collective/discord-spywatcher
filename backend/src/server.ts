/* eslint-disable @typescript-eslint/no-floating-promises */
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

import { env } from './utils/env';

dotenv.config();
console.log('🌱 Starting boot');

console.log('✅ dotenv loaded');
console.log('✅ env loaded');
console.log('✅ express loaded');
console.log('✅ cors loaded');

const app = express();
const PORT = env.PORT || 3001;
const allowedOrigins = env.CORS_ORIGINS || [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
];

(async () => {
    try {
        const {
            attachRequestId,
            requestLogger,
            securityHeaders,
            additionalSecurityHeaders,
            requestSizeLimiter,
            apiLimiter,
        } = await import('./middleware');
        console.log('✅ middleware loaded');

        // Security middleware - apply first
        app.use(securityHeaders);
        app.use(additionalSecurityHeaders);
        app.use(requestSizeLimiter);

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
                        console.warn(`🚫 CORS blocked origin: ${origin}`);
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

        // Apply general API rate limiting
        if (env.ENABLE_RATE_LIMITING) {
            app.use('/api', apiLimiter);
            console.log('✅ API rate limiting enabled');
        }
    } catch (err) {
        console.error('🔥 Failed to import or use middleware:', err);
        return;
    }

    try {
        const apiRoutes = (await import('./routes/api')).default;
        app.use('/api', apiRoutes);
        console.log('✅ routes loaded');
    } catch (err) {
        console.error('🔥 Failed to load routes:', err);
        return;
    }

    app.listen(PORT, () => {
        console.log(
            `🔐 Starting server with bot in guild(s):`,
            env.BOT_GUILD_IDS
        );
        console.log(`🔐 Spywatcher API running at http://localhost:${PORT}`);
        console.log(`🛡️  Security headers enabled`);
        console.log(
            `🛡️  Rate limiting: ${env.ENABLE_RATE_LIMITING ? 'enabled' : 'disabled'}`
        );
    });
})();
