import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';

import { env } from '../utils/env';

/**
 * Helmet.js security headers middleware
 * Implements OWASP security best practices
 */
export const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for some UI frameworks
            imgSrc: ["'self'", 'data:', 'https:', 'https://cdn.discordapp.com'],
            connectSrc: [
                "'self'",
                env.FRONTEND_URL || 'http://localhost:5173',
                'https://discord.com',
            ],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
    },
    frameguard: {
        action: 'deny', // Prevent clickjacking
    },
    noSniff: true, // Prevent MIME type sniffing
    xssFilter: true, // Enable XSS filter
    referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
    },
});

/**
 * Request size limit middleware
 * Prevents DoS attacks via large payloads
 */
export const requestSizeLimiter = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);

    if (contentLength > maxSize) {
        res.status(413).json({
            error: 'Request entity too large',
            maxSize: '10MB',
        });
        return;
    }

    next();
};

/**
 * Security headers for API responses
 */
export const additionalSecurityHeaders = (
    _req: Request,
    res: Response,
    next: NextFunction
): void => {
    // Remove server information disclosure
    res.removeHeader('X-Powered-By');

    // Add additional security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
    );
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    next();
};
