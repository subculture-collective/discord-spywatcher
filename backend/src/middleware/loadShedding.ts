/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */
import os from 'os';

import { Request, Response, NextFunction } from 'express';

import { env } from '../utils/env';

/**
 * Load shedding middleware
 * Rejects non-critical requests when system is under heavy load
 */
export const loadSheddingMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // Skip if load shedding is disabled
    if (!env.ENABLE_LOAD_SHEDDING) {
        next();
        return;
    }

    // Calculate system load metrics
    const cpuUsage = os.loadavg()[0] / os.cpus().length;
    const memUsage = 1 - os.freemem() / os.totalmem();

    // Thresholds for load shedding
    const cpuThreshold = 0.8; // 80% CPU usage
    const memThreshold = 0.9; // 90% memory usage

    // If system is under heavy load
    if (cpuUsage > cpuThreshold || memUsage > memThreshold) {
        // Always allow health checks
        if (req.path === '/api/health' || req.path === '/health') {
            next();
            return;
        }

        // Always allow admin users
        const user = (req as any).user;
        if (user && user.role === 'ADMIN') {
            next();
            return;
        }

        // Reject other requests with 503 Service Unavailable
        res.status(503).json({
            error: 'Service temporarily unavailable',
            message: 'Server under high load, please try again later',
            retryAfter: 60, // Suggest retry after 60 seconds
            systemLoad: {
                cpu: `${(cpuUsage * 100).toFixed(1)}%`,
                memory: `${(memUsage * 100).toFixed(1)}%`,
            },
        });
        return;
    }

    next();
};

/**
 * Health check with system metrics
 * Provides detailed health information including load
 */
export const healthCheckWithMetrics = (_req: Request, res: Response): void => {
    const cpuUsage = os.loadavg()[0] / os.cpus().length;
    const memUsage = 1 - os.freemem() / os.totalmem();
    const uptime = process.uptime();

    const status = cpuUsage > 0.8 || memUsage > 0.9 ? 'degraded' : 'healthy';

    res.status(status === 'healthy' ? 200 : 503).json({
        status,
        timestamp: new Date().toISOString(),
        uptime: `${Math.floor(uptime)}s`,
        system: {
            cpu: {
                usage: `${(cpuUsage * 100).toFixed(1)}%`,
                cores: os.cpus().length,
                load: os.loadavg(),
            },
            memory: {
                usage: `${(memUsage * 100).toFixed(1)}%`,
                free: `${(os.freemem() / 1024 / 1024).toFixed(0)}MB`,
                total: `${(os.totalmem() / 1024 / 1024).toFixed(0)}MB`,
            },
        },
    });
};

/**
 * Priority queue middleware
 * Adds request priority based on authentication status and user role
 */
export const priorityQueueMiddleware = (
    req: Request,
    _res: Response,
    next: NextFunction
): void => {
    const user = (req as any).user;

    // Assign priority based on user role
    if (user) {
        if (user.role === 'ADMIN') {
            (req as any).priority = 1; // Highest priority
        } else if (user.role === 'MODERATOR') {
            (req as any).priority = 2;
        } else {
            (req as any).priority = 3;
        }
    } else {
        (req as any).priority = 4; // Lowest priority for unauthenticated
    }

    next();
};

/**
 * Circuit breaker pattern implementation
 * Prevents cascading failures by failing fast when errors are detected
 */
class CircuitBreaker {
    private failures: number = 0;
    private lastFailureTime: number = 0;
    private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
    private readonly threshold: number = 5;
    private readonly timeout: number = 60000; // 1 minute

    isOpen(): boolean {
        if (this.state === 'OPEN') {
            // Check if we should transition to half-open
            if (Date.now() - this.lastFailureTime > this.timeout) {
                this.state = 'HALF_OPEN';
                return false;
            }
            return true;
        }
        return false;
    }

    recordSuccess(): void {
        if (this.state === 'HALF_OPEN') {
            this.state = 'CLOSED';
            this.failures = 0;
        }
    }

    recordFailure(): void {
        this.failures++;
        this.lastFailureTime = Date.now();

        if (this.failures >= this.threshold) {
            this.state = 'OPEN';
        }
    }

    getState(): string {
        return this.state;
    }
}

// Global circuit breaker instance
const circuitBreaker = new CircuitBreaker();

/**
 * Circuit breaker middleware
 * Fails fast when system is experiencing errors
 */
export const circuitBreakerMiddleware = (
    _req: Request,
    res: Response,
    next: NextFunction
): void => {
    if (circuitBreaker.isOpen()) {
        res.status(503).json({
            error: 'Circuit breaker open',
            message: 'Service temporarily unavailable due to system errors',
            state: circuitBreaker.getState(),
        });
        return;
    }

    // Track response status to update circuit breaker
    res.on('finish', () => {
        if (res.statusCode >= 500) {
            circuitBreaker.recordFailure();
        } else {
            circuitBreaker.recordSuccess();
        }
    });

    next();
};
