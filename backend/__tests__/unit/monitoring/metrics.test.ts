import express, { Application } from 'express';
import request from 'supertest';

import { metricsHandler, metricsMiddleware, metrics } from '../../../src/monitoring/metrics';

describe('Prometheus Metrics', () => {
    let app: Application;

    beforeAll(() => {
        app = express();
        app.use(metricsMiddleware);
        app.get('/test', (req, res) => {
            res.status(200).json({ message: 'test' });
        });
        app.get('/metrics', metricsHandler);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('metricsMiddleware', () => {
        it('should track request duration', async () => {
            const response = await request(app).get('/test');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'test' });
        });

        it('should track multiple requests', async () => {
            await request(app).get('/test');
            await request(app).get('/test');
            await request(app).get('/test');

            const metricsResponse = await request(app).get('/metrics');
            expect(metricsResponse.status).toBe(200);
            expect(metricsResponse.text).toContain('http_request_duration_seconds');
            expect(metricsResponse.text).toContain('http_requests_total');
        });

        it('should track error requests', async () => {
            app.get('/error', (req, res) => {
                res.status(500).json({ error: 'Internal Server Error' });
            });

            await request(app).get('/error');

            const metricsResponse = await request(app).get('/metrics');
            expect(metricsResponse.status).toBe(200);
            expect(metricsResponse.text).toContain('http_requests_errors');
        });
    });

    describe('metricsHandler', () => {
        it('should return metrics in Prometheus format', async () => {
            const response = await request(app).get('/metrics');

            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toContain('text/plain');
            expect(response.text).toContain('# HELP');
            expect(response.text).toContain('# TYPE');
        });

        it('should include default metrics', async () => {
            const response = await request(app).get('/metrics');

            expect(response.status).toBe(200);
            expect(response.text).toContain('process_cpu_');
            expect(response.text).toContain('process_resident_memory_');
            expect(response.text).toContain('nodejs_');
        });

        it('should include custom HTTP metrics', async () => {
            await request(app).get('/test');

            const response = await request(app).get('/metrics');

            expect(response.status).toBe(200);
            expect(response.text).toContain('http_request_duration_seconds');
            expect(response.text).toContain('http_requests_total');
        });
    });

    describe('metrics objects', () => {
        it('should expose metrics for manual recording', () => {
            expect(metrics.httpRequestDuration).toBeDefined();
            expect(metrics.activeConnections).toBeDefined();
            expect(metrics.dbQueryDuration).toBeDefined();
            expect(metrics.httpRequestTotal).toBeDefined();
            expect(metrics.httpRequestErrors).toBeDefined();
        });

        it('should allow manual recording of database metrics', () => {
            expect(() => {
                metrics.dbQueryDuration.observe(
                    { model: 'User', operation: 'findMany' },
                    0.5
                );
            }).not.toThrow();
        });

        it('should allow manual recording of WebSocket connections', () => {
            expect(() => {
                metrics.activeConnections.set(10);
            }).not.toThrow();
        });
    });
});
