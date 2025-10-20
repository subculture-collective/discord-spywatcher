import { Request, Response, NextFunction } from 'express';

import {
    securityHeaders,
    requestSizeLimiter,
    additionalSecurityHeaders,
} from '../../../src/middleware/security';

describe('Security Middleware', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        mockReq = {
            headers: {},
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            setHeader: jest.fn(),
            removeHeader: jest.fn(),
        };
        mockNext = jest.fn();
    });

    describe('requestSizeLimiter', () => {
        it('should allow requests within size limit', () => {
            mockReq.headers = { 'content-length': '1000' };

            requestSizeLimiter(
                mockReq as Request,
                mockRes as Response,
                mockNext
            );

            expect(mockNext).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should reject requests exceeding size limit', () => {
            mockReq.headers = { 'content-length': '20000000' }; // 20MB

            requestSizeLimiter(
                mockReq as Request,
                mockRes as Response,
                mockNext
            );

            expect(mockRes.status).toHaveBeenCalledWith(413);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Request entity too large',
                maxSize: '10MB',
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should allow requests with no content-length header', () => {
            mockReq.headers = {};

            requestSizeLimiter(
                mockReq as Request,
                mockRes as Response,
                mockNext
            );

            expect(mockNext).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
        });
    });

    describe('additionalSecurityHeaders', () => {
        it('should set security headers', () => {
            additionalSecurityHeaders(
                mockReq as Request,
                mockRes as Response,
                mockNext
            );

            expect(mockRes.removeHeader).toHaveBeenCalledWith('X-Powered-By');
            expect(mockRes.setHeader).toHaveBeenCalledWith(
                'X-Content-Type-Options',
                'nosniff'
            );
            expect(mockRes.setHeader).toHaveBeenCalledWith(
                'X-Frame-Options',
                'DENY'
            );
            expect(mockRes.setHeader).toHaveBeenCalledWith(
                'X-XSS-Protection',
                '1; mode=block'
            );
            expect(mockRes.setHeader).toHaveBeenCalledWith(
                'Strict-Transport-Security',
                'max-age=31536000; includeSubDomains; preload'
            );
            expect(mockRes.setHeader).toHaveBeenCalledWith(
                'Referrer-Policy',
                'strict-origin-when-cross-origin'
            );
            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('securityHeaders (helmet)', () => {
        it('should be a function', () => {
            expect(typeof securityHeaders).toBe('function');
        });
    });
});
