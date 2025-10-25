import { Request, Response, NextFunction } from 'express';

import {
    loadSheddingMiddleware,
    healthCheckWithMetrics,
    circuitBreakerMiddleware,
} from '../../../src/middleware/loadShedding';

// Mock os module
jest.mock('os', () => ({
    loadavg: jest.fn(() => [1.5, 1.2, 1.0]),
    cpus: jest.fn(() => new Array(4).fill({})),
    freemem: jest.fn(() => 2 * 1024 * 1024 * 1024), // 2GB
    totalmem: jest.fn(() => 8 * 1024 * 1024 * 1024), // 8GB
}));

// Mock env module
jest.mock('../../../src/utils/env', () => ({
    env: {
        ENABLE_LOAD_SHEDDING: true,
    },
}));

describe('Load Shedding Middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;
    let os: any;

    beforeEach(() => {
        os = require('os');
        mockRequest = {
            path: '/api/test',
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            on: jest.fn(),
        };
        nextFunction = jest.fn();

        // Reset mocks
        jest.clearAllMocks();
    });

    describe('loadSheddingMiddleware', () => {
        it('should allow requests when system load is normal', () => {
            // Normal load: 37.5% CPU (1.5/4), 75% memory (6GB used / 8GB total)
            os.loadavg.mockReturnValue([1.5, 1.2, 1.0]);
            os.cpus.mockReturnValue(new Array(4).fill({}));
            os.freemem.mockReturnValue(2 * 1024 * 1024 * 1024); // 2GB free
            os.totalmem.mockReturnValue(8 * 1024 * 1024 * 1024); // 8GB total

            loadSheddingMiddleware(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        it('should reject non-critical requests when CPU is high', () => {
            // High CPU: 85% (3.4/4)
            os.loadavg.mockReturnValue([3.4, 3.2, 3.0]);

            loadSheddingMiddleware(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(mockResponse.status).toHaveBeenCalledWith(503);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Service temporarily unavailable',
                })
            );
            expect(nextFunction).not.toHaveBeenCalled();
        });

        it('should reject non-critical requests when memory is high', () => {
            // High memory: 95% (0.4GB free / 8GB total)
            os.freemem.mockReturnValue(0.4 * 1024 * 1024 * 1024);

            loadSheddingMiddleware(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(mockResponse.status).toHaveBeenCalledWith(503);
            expect(nextFunction).not.toHaveBeenCalled();
        });

        it('should always allow health check requests', () => {
            (mockRequest as any).path = '/api/health';
            os.loadavg.mockReturnValue([3.4, 3.2, 3.0]); // High CPU

            loadSheddingMiddleware(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        it('should always allow admin users even under high load', () => {
            (mockRequest as any).user = { role: 'ADMIN' };
            os.loadavg.mockReturnValue([3.4, 3.2, 3.0]); // High CPU

            loadSheddingMiddleware(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
    });

    describe('healthCheckWithMetrics', () => {
        it('should return healthy status when system is normal', () => {
            // Low load: 25% CPU (1.0/4), 25% memory (6GB free / 8GB total)
            os.loadavg.mockReturnValue([1.0, 0.8, 0.6]);
            os.cpus.mockReturnValue(new Array(4).fill({}));
            os.freemem.mockReturnValue(6 * 1024 * 1024 * 1024); // 6GB free
            os.totalmem.mockReturnValue(8 * 1024 * 1024 * 1024); // 8GB total

            healthCheckWithMetrics(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'healthy',
                    system: expect.any(Object),
                })
            );
        });

        it('should return degraded status when system is under load', () => {
            os.loadavg.mockReturnValue([3.4, 3.2, 3.0]); // High CPU

            healthCheckWithMetrics(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockResponse.status).toHaveBeenCalledWith(503);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'degraded',
                })
            );
        });
    });

    describe('circuitBreakerMiddleware', () => {
        it('should allow requests when circuit is closed', () => {
            circuitBreakerMiddleware(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        it('should track response status', () => {
            (mockResponse.on as jest.Mock).mockImplementation((event) => {
                expect(event).toBe('finish');
            });

            circuitBreakerMiddleware(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(mockResponse.on).toHaveBeenCalledWith(
                'finish',
                expect.any(Function)
            );
        });
    });
});
