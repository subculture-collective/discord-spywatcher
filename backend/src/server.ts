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
const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
(async () => {
    try {
        const { attachRequestId, requestLogger } = await import('./middleware');
        console.log('✅ middleware loaded');

        app.use(attachRequestId);
        app.use(
            cors({
                origin: (origin, callback) => {
                    if (!origin || allowedOrigins.includes(origin)) {
                        callback(null, true);
                    } else {
                        callback(new Error('Not allowed by CORS'));
                    }
                },
                credentials: true,
            })
        );
        app.options(/.*/, cors());
        app.use(express.json());
        app.use(cookieParser());
        app.use(requestLogger);
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
    });
})();
