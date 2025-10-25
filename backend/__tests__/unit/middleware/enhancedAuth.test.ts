import { Role } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';

import {
    requireAuth,
    requireRole,
    requirePermission,
    requireGuildAccess,
} from '../../../src/middleware/auth';
import { generateAccessToken } from '../../../src/utils/auth';
import * as permissionsUtils from '../../../src/utils/permissions';

jest.mock('../../../src/utils/permissions');

describe('Middleware - Enhanced Auth', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        mockRequest = {
            headers: {},
            params: {},
            query: {},
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        mockNext = jest.fn();
        jest.clearAllMocks();
    });

    describe('requireAuth - with banned user check', () => {
        it('should reject banned users', () => {
            const token = generateAccessToken({
                userId: 'banned-user',
                discordId: '999',
                username: 'banned',
                role: 'BANNED',
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

            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Account is banned',
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should allow non-banned users', () => {
            const token = generateAccessToken({
                userId: 'user-1',
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
            expect(mockRequest.user?.role).toBe('USER');
        });
    });

    describe('requireRole', () => {
        it('should allow users with required role', () => {
            mockRequest.user = {
                userId: 'user-1',
                discordId: '123',
                username: 'moderator',
                role: 'MODERATOR',
                access: true,
            };

            const middleware = requireRole([Role.ADMIN, Role.MODERATOR]);
            middleware(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        it('should reject users without required role', () => {
            mockRequest.user = {
                userId: 'user-1',
                discordId: '123',
                username: 'user',
                role: 'USER',
                access: true,
            };

            const middleware = requireRole([Role.ADMIN, Role.MODERATOR]);
            middleware(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Forbidden — insufficient role',
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should reject unauthenticated requests', () => {
            mockRequest.user = undefined;

            const middleware = requireRole([Role.ADMIN]);
            middleware(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('requirePermission', () => {
        it('should allow users with required permission', async () => {
            mockRequest.user = {
                userId: 'user-1',
                discordId: '123',
                username: 'admin',
                role: 'ADMIN',
                access: true,
            };

            (
                permissionsUtils.checkUserPermission as jest.Mock
            ).mockResolvedValue(true);

            const middleware = requirePermission('analytics.view');
            await middleware(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(permissionsUtils.checkUserPermission).toHaveBeenCalledWith(
                'user-1',
                'analytics.view'
            );
            expect(mockNext).toHaveBeenCalled();
        });

        it('should reject users without required permission', async () => {
            mockRequest.user = {
                userId: 'user-1',
                discordId: '123',
                username: 'user',
                role: 'USER',
                access: true,
            };

            (
                permissionsUtils.checkUserPermission as jest.Mock
            ).mockResolvedValue(false);

            const middleware = requirePermission('users.ban');
            await middleware(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Forbidden — missing permission',
                required: 'users.ban',
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should reject unauthenticated requests', async () => {
            mockRequest.user = undefined;

            const middleware = requirePermission('analytics.view');
            await middleware(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('requireGuildAccess', () => {
        it('should allow users with guild access', async () => {
            mockRequest.user = {
                userId: 'user-1',
                discordId: '123',
                username: 'user',
                role: 'USER',
                access: true,
            };
            mockRequest.params = { guildId: 'guild-123' };

            (
                permissionsUtils.checkGuildAccess as jest.Mock
            ).mockResolvedValue(true);

            await new Promise<void>((resolve) => {
                mockNext = jest.fn(() => resolve());
                requireGuildAccess(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext
                );
            });

            expect(permissionsUtils.checkGuildAccess).toHaveBeenCalledWith(
                'user-1',
                'guild-123'
            );
            expect(mockNext).toHaveBeenCalled();
        });

        it('should reject users without guild access', async () => {
            mockRequest.user = {
                userId: 'user-1',
                discordId: '123',
                username: 'user',
                role: 'USER',
                access: true,
            };
            mockRequest.params = { guildId: 'guild-123' };

            (
                permissionsUtils.checkGuildAccess as jest.Mock
            ).mockResolvedValue(false);

            await new Promise<void>((resolve) => {
                mockResponse.json = jest.fn(() => {
                    resolve();
                    return mockResponse as Response;
                });
                requireGuildAccess(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext
                );
            });

            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Forbidden — no access to this guild',
            });
        });

        it('should handle guildId in query params', async () => {
            mockRequest.user = {
                userId: 'user-1',
                discordId: '123',
                username: 'user',
                role: 'USER',
                access: true,
            };
            mockRequest.query = { guildId: 'guild-456' };

            (
                permissionsUtils.checkGuildAccess as jest.Mock
            ).mockResolvedValue(true);

            await new Promise<void>((resolve) => {
                mockNext = jest.fn(() => resolve());
                requireGuildAccess(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext
                );
            });

            expect(permissionsUtils.checkGuildAccess).toHaveBeenCalledWith(
                'user-1',
                'guild-456'
            );
        });

        it('should reject requests without guildId', () => {
            mockRequest.user = {
                userId: 'user-1',
                discordId: '123',
                username: 'user',
                role: 'USER',
                access: true,
            };
            mockRequest.params = {};
            mockRequest.query = {};

            requireGuildAccess(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Missing guildId parameter',
            });
        });
    });
});
