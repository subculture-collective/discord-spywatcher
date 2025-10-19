// src/types/express.d.ts
import 'express';
import type { AuthPayload } from '../utils/auth';

declare module 'express-serve-static-core' {
    interface Request {
        id?: string;
        user?: AuthPayload;
        guildId?: string;
    }
}
