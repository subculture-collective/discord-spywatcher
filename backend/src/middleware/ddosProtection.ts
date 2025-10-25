/* eslint-disable @typescript-eslint/no-misused-promises */
import { Request, Response, NextFunction } from 'express';
import slowDown from 'express-slow-down';

import { getRedisClient } from '../utils/redis';
import { sanitizeForLog } from '../utils/security';

const redis = getRedisClient();

/**
 * Slow down middleware - adds progressive delays for requests exceeding limits
 * Helps defend against slowloris attacks
 */
export const slowDownMiddleware = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 50, // Start delaying after 50 requests
    delayMs: (hits) => hits * 500, // Add 500ms delay per request after limit
    maxDelayMs: 20000, // Max 20 second delay
});

/**
 * Query parameter limit middleware
 * Prevents parameter pollution attacks
 */
export const parameterLimitMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const maxParams = 30;
    const queryParamCount = Object.keys(req.query).length;

    if (queryParamCount > maxParams) {
        res.status(400).json({
            error: 'Too many query parameters',
            max: maxParams,
            received: queryParamCount,
        });
        return;
    }

    next();
};

/**
 * Request validation middleware
 * Validates basic request structure to prevent malformed requests
 */
export const requestValidationMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // Check for excessively long URLs
    const maxUrlLength = 2048;
    if (req.url.length > maxUrlLength) {
        res.status(414).json({
            error: 'Request URL too long',
            max: maxUrlLength,
        });
        return;
    }

    // Check for suspicious header patterns
    const userAgent = req.headers['user-agent'];
    if (userAgent && userAgent.length > 500) {
        res.status(400).json({
            error: 'Invalid user agent header',
        });
        return;
    }

    // Validate Content-Type for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const contentType = req.headers['content-type'];
        if (contentType && !contentType.includes('application/json') && 
            !contentType.includes('application/x-www-form-urlencoded') &&
            !contentType.includes('multipart/form-data')) {
            res.status(415).json({
                error: 'Unsupported Media Type',
                acceptedTypes: [
                    'application/json',
                    'application/x-www-form-urlencoded',
                    'multipart/form-data',
                ],
            });
            return;
        }
    }

    next();
};

/**
 * Payload size validation middleware
 * Additional check beyond express.json() limit
 */
export const payloadSizeMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);

    if (contentLength > maxSize) {
        res.status(413).json({
            error: 'Payload too large',
            maxSize: '10MB',
            received: `${(contentLength / 1024 / 1024).toFixed(2)}MB`,
        });
        return;
    }

    next();
};

/**
 * Slow request detection middleware
 * Detects and rejects requests that take too long (slowloris defense)
 */
export const slowRequestDetectionMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const timeout = 30000; // 30 seconds

    const timer = setTimeout(() => {
        if (!res.headersSent) {
            res.status(408).json({
                error: 'Request timeout',
                message: 'Request took too long to complete',
            });
        }
    }, timeout);

    // Clear timeout when response is finished
    res.on('finish', () => {
        clearTimeout(timer);
    });

    next();
};

/**
 * Header validation middleware
 * Validates HTTP headers to prevent header injection attacks
 */
export const headerValidationMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // Check for null bytes in headers (header injection attempt)
    for (const [key, value] of Object.entries(req.headers)) {
        if (typeof value === 'string' && value.includes('\0')) {
            res.status(400).json({
                error: 'Invalid header',
                header: key,
            });
            return;
        }
    }

    // Check for excessive header count
    const maxHeaders = 50;
    if (Object.keys(req.headers).length > maxHeaders) {
        res.status(400).json({
            error: 'Too many headers',
            max: maxHeaders,
        });
        return;
    }

    next();
};

/**
 * Rate limit tracking for abuse detection
 * Tracks rate limit violations and can trigger automatic blocking
 */
export const abuseDetectionMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    if (!redis) {
        next();
        return;
    }

    const ip = req.ip;
    if (!ip) {
        next();
        return;
    }

    // Track rate limit violations
    res.on('finish', async () => {
        if (res.statusCode === 429) {
            try {
                const violationKey = `violations:${ip}`;
                const violations = await redis.incr(violationKey);
                await redis.expire(violationKey, 3600); // 1 hour window

                // If too many violations, auto-block
                if (violations >= 10) {
                    await redis.set(`blocked:${ip}`, '1', 'EX', 3600);
                    console.warn(`IP ${sanitizeForLog(ip)} auto-blocked after ${violations} rate limit violations`);

                    // Reset violation counter
                    await redis.del(violationKey);
                }
            } catch (err) {
                console.error('Abuse detection error:', err);
            }
        }
    });

    next();
};
