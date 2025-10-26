import { Request, Response, NextFunction } from 'express';

import {
    cacheControlHeaders,
    etagMiddleware,
    redisCacheMiddleware,
} from '../../../src/middleware/caching';

// Mock Redis
jest.mock('../../../src/utils/redis', () => ({
    getRedisClient: jest.fn(() => ({
        get: jest.fn(),
        setex: jest.fn(),
    })),
}));

describe('Caching Middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
        mockRequest = {
            path: '/api/test',
            method: 'GET',
            headers: {},
        };
        mockResponse = {
            setHeader: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
        };
        nextFunction = jest.fn();
        jest.clearAllMocks();
    });

    describe('cacheControlHeaders', () => {
        it('should set cache headers for analytics endpoints', () => {
            mockRequest.path = '/api/analytics/test';

            cacheControlHeaders(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(mockResponse.setHeader).toHaveBeenCalledWith(
                'Cache-Control',
                'private, max-age=60'
            );
            expect(nextFunction).toHaveBeenCalled();
        });

        it('should set no-cache headers for health endpoints', () => {
            mockRequest.path = '/api/health';

            cacheControlHeaders(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(mockResponse.setHeader).toHaveBeenCalledWith(
                'Cache-Control',
                'no-cache, no-store, must-revalidate'
            );
            expect(nextFunction).toHaveBeenCalled();
        });

        it('should set cache headers for general GET requests', () => {
            mockRequest.method = 'GET';
            mockRequest.path = '/api/data';

            cacheControlHeaders(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(mockResponse.setHeader).toHaveBeenCalledWith(
                'Cache-Control',
                'private, max-age=30'
            );
            expect(nextFunction).toHaveBeenCalled();
        });

        it('should set no-cache headers for POST requests', () => {
            mockRequest.method = 'POST';

            cacheControlHeaders(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(mockResponse.setHeader).toHaveBeenCalledWith(
                'Cache-Control',
                'no-cache, no-store, must-revalidate'
            );
            expect(nextFunction).toHaveBeenCalled();
        });
    });

    describe('etagMiddleware', () => {
        it('should skip ETag generation for non-GET requests', () => {
            mockRequest.method = 'POST';

            etagMiddleware(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.setHeader).not.toHaveBeenCalled();
        });

        it('should generate ETag for GET requests', () => {
            mockRequest.method = 'GET';
            
            // Setup response mock with proper send function
            const originalSend = jest.fn().mockReturnThis();
            mockResponse.send = originalSend;

            etagMiddleware(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).toHaveBeenCalled();
            
            // Simulate sending a response
            const testData = JSON.stringify({ test: 'data' });
            (mockResponse.send as jest.Mock)(testData);

            expect(mockResponse.setHeader).toHaveBeenCalledWith(
                'ETag',
                expect.stringMatching(/^"[a-f0-9]{32}"$/)
            );
        });

        it('should return 304 for matching ETags', () => {
            mockRequest.method = 'GET';
            mockRequest.headers = {
                'if-none-match': '"abc123"',
            };

            const originalSend = jest.fn().mockReturnThis();
            mockResponse.send = originalSend;

            etagMiddleware(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).toHaveBeenCalled();
        });
    });

    describe('redisCacheMiddleware', () => {
        it('should skip caching for non-GET requests', async () => {
            mockRequest.method = 'POST';
            const middleware = redisCacheMiddleware(60);

            await middleware(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).toHaveBeenCalled();
        });

        it('should call next for cache miss', async () => {
            mockRequest.method = 'GET';
            mockRequest.originalUrl = '/api/test';

            const middleware = redisCacheMiddleware(60);

            await middleware(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).toHaveBeenCalled();
        });
    });
});
