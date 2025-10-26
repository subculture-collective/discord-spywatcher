import { Request, Response, NextFunction } from 'express';

import {
    blockKnownBadIPs,
    banIP,
    unbanIP,
    temporarilyBlockIP,
    removeTemporaryBlock,
    whitelistIP,
    removeIPFromWhitelist,
    isIPBlocked,
    isIPWhitelisted,
} from '../../../src/middleware/ipBlock';
import { db } from '../../../src/db';

// Mock database
jest.mock('../../../src/db', () => ({
    db: {
        whitelistedIP: {
            findUnique: jest.fn(),
            upsert: jest.fn(),
            delete: jest.fn(),
            findMany: jest.fn(),
        },
        blockedIP: {
            findUnique: jest.fn(),
            upsert: jest.fn(),
            delete: jest.fn(),
            findMany: jest.fn(),
        },
        auditLog: {
            create: jest.fn(),
        },
    },
}));

// Mock Redis
jest.mock('../../../src/utils/redis', () => ({
    getRedisClient: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        setex: jest.fn(),
        del: jest.fn(),
        ttl: jest.fn(),
        incr: jest.fn(),
        expire: jest.fn(),
    })),
}));

describe('IP Block Middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
        mockRequest = {
            ip: '192.168.1.1',
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        nextFunction = jest.fn();
        jest.clearAllMocks();
    });

    describe('blockKnownBadIPs', () => {
        it('should allow requests from non-blocked IPs', async () => {
            (db.whitelistedIP.findUnique as jest.Mock).mockResolvedValue(null);
            (db.blockedIP.findUnique as jest.Mock).mockResolvedValue(null);

            await blockKnownBadIPs(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        it('should allow requests from whitelisted IPs', async () => {
            (db.whitelistedIP.findUnique as jest.Mock).mockResolvedValue({
                ip: '192.168.1.1',
                reason: 'Admin IP',
            });

            await blockKnownBadIPs(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        it('should block requests from permanently blocked IPs', async () => {
            (db.whitelistedIP.findUnique as jest.Mock).mockResolvedValue(null);
            (db.blockedIP.findUnique as jest.Mock).mockResolvedValue({
                ip: '192.168.1.1',
                reason: 'Malicious activity',
            });

            await blockKnownBadIPs(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Access denied from this IP',
                })
            );
            expect(nextFunction).not.toHaveBeenCalled();
        });

        it('should continue if IP is not provided', async () => {
            mockRequest.ip = undefined;

            await blockKnownBadIPs(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
    });

    describe('banIP', () => {
        it('should permanently ban an IP address', async () => {
            (db.blockedIP.upsert as jest.Mock).mockResolvedValue({
                ip: '192.168.1.1',
                reason: 'Test ban',
            });

            await banIP('192.168.1.1', 'Test ban');

            expect(db.blockedIP.upsert).toHaveBeenCalledWith({
                where: { ip: '192.168.1.1' },
                update: { reason: 'Test ban' },
                create: { ip: '192.168.1.1', reason: 'Test ban' },
            });
        });

        it('should handle database errors gracefully', async () => {
            (db.blockedIP.upsert as jest.Mock).mockRejectedValue(
                new Error('Database error')
            );

            await expect(banIP('192.168.1.1', 'Test')).rejects.toThrow();
        });
    });

    describe('unbanIP', () => {
        it('should remove a permanent IP ban', async () => {
            (db.blockedIP.delete as jest.Mock).mockResolvedValue({
                ip: '192.168.1.1',
            });

            await unbanIP('192.168.1.1');

            expect(db.blockedIP.delete).toHaveBeenCalledWith({
                where: { ip: '192.168.1.1' },
            });
        });

        it('should not throw if IP is not found', async () => {
            (db.blockedIP.delete as jest.Mock).mockRejectedValue(
                new Error('Not found')
            );

            await expect(unbanIP('192.168.1.1')).resolves.not.toThrow();
        });
    });

    describe('whitelistIP', () => {
        it('should add an IP to the whitelist', async () => {
            (db.whitelistedIP.upsert as jest.Mock).mockResolvedValue({
                ip: '192.168.1.1',
                reason: 'Admin',
            });
            (db.auditLog.create as jest.Mock).mockResolvedValue({});

            await whitelistIP('192.168.1.1', 'Admin');

            expect(db.whitelistedIP.upsert).toHaveBeenCalledWith({
                where: { ip: '192.168.1.1' },
                update: { reason: 'Admin' },
                create: { ip: '192.168.1.1', reason: 'Admin' },
            });
            expect(db.auditLog.create).toHaveBeenCalled();
        });
    });

    describe('removeIPFromWhitelist', () => {
        it('should remove an IP from the whitelist', async () => {
            (db.whitelistedIP.delete as jest.Mock).mockResolvedValue({
                ip: '192.168.1.1',
            });
            (db.auditLog.create as jest.Mock).mockResolvedValue({});

            await removeIPFromWhitelist('192.168.1.1');

            expect(db.whitelistedIP.delete).toHaveBeenCalledWith({
                where: { ip: '192.168.1.1' },
            });
            expect(db.auditLog.create).toHaveBeenCalled();
        });
    });

    describe('isIPBlocked', () => {
        it('should return true for blocked IPs', async () => {
            (db.blockedIP.findUnique as jest.Mock).mockResolvedValue({
                ip: '192.168.1.1',
            });

            const result = await isIPBlocked('192.168.1.1');

            expect(result).toBe(true);
        });

        it('should return false for non-blocked IPs', async () => {
            (db.blockedIP.findUnique as jest.Mock).mockResolvedValue(null);

            const result = await isIPBlocked('192.168.1.1');

            expect(result).toBe(false);
        });
    });

    describe('isIPWhitelisted', () => {
        it('should return true for whitelisted IPs', async () => {
            (db.whitelistedIP.findUnique as jest.Mock).mockResolvedValue({
                ip: '192.168.1.1',
            });

            const result = await isIPWhitelisted('192.168.1.1');

            expect(result).toBe(true);
        });

        it('should return false for non-whitelisted IPs', async () => {
            (db.whitelistedIP.findUnique as jest.Mock).mockResolvedValue(null);

            const result = await isIPWhitelisted('192.168.1.1');

            expect(result).toBe(false);
        });
    });
});
