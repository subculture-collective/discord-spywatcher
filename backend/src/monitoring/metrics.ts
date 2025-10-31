import { Request, Response, NextFunction } from 'express';
import promClient from 'prom-client';

// Create metrics registry
const register = new promClient.Registry();

// Default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.5, 1, 2, 5],
});

const activeConnections = new promClient.Gauge({
    name: 'websocket_active_connections',
    help: 'Number of active WebSocket connections',
});

const dbQueryDuration = new promClient.Histogram({
    name: 'db_query_duration_seconds',
    help: 'Duration of database queries',
    labelNames: ['model', 'operation'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1],
});

const httpRequestTotal = new promClient.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
});

const httpRequestErrors = new promClient.Counter({
    name: 'http_requests_errors',
    help: 'Total number of HTTP request errors',
    labelNames: ['method', 'route', 'status_code'],
});

// Register metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(activeConnections);
register.registerMetric(dbQueryDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(httpRequestErrors);

// Metrics middleware
export function metricsMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const start = Date.now();

    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const route = req.route?.path || req.path;
        const labels = {
            method: req.method,
            route,
            status_code: res.statusCode.toString(),
        };

        httpRequestDuration.observe(labels, duration);
        httpRequestTotal.inc(labels);

        // Track errors
        if (res.statusCode >= 400) {
            httpRequestErrors.inc(labels);
        }
    });

    next();
}

// Metrics endpoint handler
export async function metricsHandler(
    req: Request,
    res: Response
): Promise<void> {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
}

// Export metrics objects for use in other modules
export const metrics = {
    httpRequestDuration,
    activeConnections,
    dbQueryDuration,
    httpRequestTotal,
    httpRequestErrors,
};

export { register };
