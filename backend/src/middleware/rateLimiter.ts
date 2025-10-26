/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call */
import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

import { getRedisClient } from '../utils/redis';

const redis = getRedisClient();

/**
 * Create rate limiter with optional Redis store
 */
function createRateLimiter(options: {
    windowMs: number;
    max: number | ((req: Request) => number | Promise<number>);
    message: string;
    prefix: string;
    skipSuccessfulRequests?: boolean;
    skip?: (req: Request) => boolean;
}) {
    const baseConfig = {
        windowMs: options.windowMs,
        max: options.max,
        message: options.message,
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: options.skipSuccessfulRequests || false,
        skip: options.skip,
        handler: (req: Request, res: Response) => {
            res.status(429).json({
                error: 'Too many requests',
                message: options.message,
                retryAfter: res.getHeader('Retry-After'),
            });
        },
    };

    // Use Redis store if available, otherwise fallback to memory store
    if (redis) {
        return rateLimit({
            ...baseConfig,
            store: new RedisStore({
                // @ts-expect-error - RedisStore types expect ioredis client
                sendCommand: (...args: string[]) => redis.call(...args),
                prefix: `rl:${options.prefix}:`,
            }),
        });
    }

    return rateLimit(baseConfig);
}

/**
 * Global rate limiter for all API endpoints
 * Default: 100 requests per 15 minutes per IP
 */
export const globalRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests. Please try again later.',
    prefix: 'global',
    skip: (req: Request) => {
        // Skip rate limiting for localhost
        const whitelist = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
        const ip = req.ip || '';
        
        // Only check localhost for now - database whitelist checking
        // is done in the IP block middleware, not in rate limiting
        return whitelist.includes(ip);
    },
});

/**
 * Rate limiter for authentication endpoints
 * Strict: 5 requests per 15 minutes
 * Prevents brute force attacks
 */
export const authRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: 'Too many authentication attempts. Please try again later.',
    prefix: 'auth',
    skipSuccessfulRequests: true, // Don't count successful logins
});

/**
 * Legacy aliases for backward compatibility
 */
export const authLimiter = authRateLimiter;
export const loginLimiter = authRateLimiter;

/**
 * Rate limiter for general API endpoints
 * Prevents API abuse and DoS
 */
export const apiLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests. Please try again later.',
    prefix: 'api',
});

/**
 * Rate limiter for analytics endpoints
 * Moderate: 30 requests per minute
 */
export const analyticsLimiter = createRateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30,
    message: 'Too many analytics requests. Please try again later.',
    prefix: 'analytics',
});

/**
 * Rate limiter for admin endpoints
 * Higher limit: 100 requests per 15 minutes
 */
export const adminLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many admin requests. Please try again later.',
    prefix: 'admin',
});

/**
 * Rate limiter for public endpoints
 * Standard: 60 requests per minute
 */
export const publicLimiter = createRateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60,
    message: 'Too many requests. Please try again later.',
    prefix: 'public',
});

/**
 * Rate limiter for webhook endpoints
 * High volume: 1000 requests per hour
 */
export const webhookLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 1000,
    message: 'Webhook rate limit exceeded. Please try again later.',
    prefix: 'webhook',
});

/**
 * Rate limiter for refresh token endpoint
 * Prevents token refresh abuse
 */
export const refreshLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: 'Too many refresh attempts. Please try again later.',
    prefix: 'refresh',
});

/**
 * User-based rate limiter with role-based limits
 * Dynamically adjusts based on user role
 */
export const userRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: (req: Request) => {
        // Dynamic limits based on user role
        const user = (req as any).user;
        if (!user) return 30; // Unauthenticated users
        
        // Role-based limits
        if (user.role === 'ADMIN') return 200;
        if (user.role === 'MODERATOR') return 100;
        return 60; // Regular users
    },
    message: 'Too many requests. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    // Use user ID as key if authenticated, otherwise IP
    keyGenerator: (req: Request) => {
        const user = (req as any).user;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return user?.id || req.ip || 'unknown';
    },
    ...(redis && {
        store: new RedisStore({
            // @ts-expect-error - RedisStore types expect ioredis client
            sendCommand: (...args: string[]) => redis.call(...args),
            prefix: 'rl:user:',
        }),
    }),
});

