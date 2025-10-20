import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for authentication endpoints
 * Prevents brute force attacks on login/auth
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: 'Too many authentication attempts. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false, // Count all requests
});

/**
 * Legacy alias for backward compatibility
 */
export const loginLimiter = authLimiter;

/**
 * Rate limiter for general API endpoints
 * Prevents API abuse and DoS
 */
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window per IP
    message: 'Too many requests. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Strict rate limiter for admin endpoints
 * More restrictive to protect sensitive operations
 */
export const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // 30 requests per window
    message: 'Too many admin requests. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Rate limiter for refresh token endpoint
 * Prevents token refresh abuse
 */
export const refreshLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 refresh attempts per window
    message: 'Too many refresh attempts. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
