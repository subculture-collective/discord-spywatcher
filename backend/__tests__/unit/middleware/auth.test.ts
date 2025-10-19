import { Request, Response, NextFunction } from 'express';

import { requireAuth, requireAdmin } from '../../../src/middleware/auth';
import { generateAccessToken } from '../../../src/utils/auth';

describe('Middleware - Auth', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        mockRequest = {
            headers: {},
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        mockNext = jest.fn();
    });

    describe('requireAuth', () => {
        it('should accept valid Bearer token', () => {
            const token = generateAccessToken({
                discordId: '123',
                username: 'test',
                role: 'USER',
                access: true,
            });

            mockRequest.headers = {
                authorization: `Bearer ${token}`,
            };

            requireAuth(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockNext).toHaveBeenCalled();
            expect(mockRequest.user).toBeDefined();
            expect(mockRequest.user?.discordId).toBe('123');
        });

        it('should reject missing Authorization header', () => {
            mockRequest.headers = {};

            requireAuth(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Missing authorization header',
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should reject malformed Authorization header', () => {
            mockRequest.headers = {
                authorization: 'InvalidFormat',
            };

            requireAuth(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should reject invalid token', () => {
            mockRequest.headers = {
                authorization: 'Bearer invalid-token',
            };

            requireAuth(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Forbidden — invalid token',
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should attach user to request object', () => {
            const token = generateAccessToken({
                userId: 'user-123',
                discordId: '456',
                username: 'testuser',
                role: 'ADMIN',
                access: true,
            });

            mockRequest.headers = {
                authorization: `Bearer ${token}`,
            };

            requireAuth(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockRequest.user).toBeDefined();
            expect(mockRequest.user?.discordId).toBe('456');
            expect(mockRequest.user?.username).toBe('testuser');
            expect(mockRequest.user?.role).toBe('ADMIN');
        });
    });

    describe('requireAdmin', () => {
        it('should allow admin users', () => {
            mockRequest.user = {
                userId: 'admin-123',
                discordId: '789',
                username: 'admin',
                role: 'ADMIN',
                access: true,
            };

            requireAdmin(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        it('should reject non-admin users', () => {
            mockRequest.user = {
                userId: 'user-123',
                discordId: '456',
                username: 'user',
                role: 'USER',
                access: true,
            };

            requireAdmin(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Forbidden — admin access required',
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should reject moderators', () => {
            mockRequest.user = {
                userId: 'mod-123',
                discordId: '321',
                username: 'moderator',
                role: 'MODERATOR',
                access: true,
            };

            requireAdmin(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should reject when user is not set', () => {
            mockRequest.user = undefined;

            requireAdmin(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should reject banned users', () => {
            mockRequest.user = {
                userId: 'banned-123',
                discordId: '999',
                username: 'banned',
                role: 'BANNED',
                access: true,
            };

            requireAdmin(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockNext).not.toHaveBeenCalled();
        });
    });
});
