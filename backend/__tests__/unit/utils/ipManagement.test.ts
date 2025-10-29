import { db } from '../../../src/db';
import {
    autoBlockOnAbuse,
    blockIP,
    unblockIP,
    isIPBlocked,
    isIPWhitelisted,
    cleanupExpiredBlocks,
} from '../../../src/utils/ipManagement';

// Mock the database
jest.mock('../../../src/db', () => ({
    db: {
        blockedIP: {
            findFirst: jest.fn(),
            create: jest.fn(),
            deleteMany: jest.fn(),
            findMany: jest.fn(),
        },
        whitelistedIP: {
            findFirst: jest.fn(),
            findMany: jest.fn(),
        },
    },
}));

describe('IP Management', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    describe('autoBlockOnAbuse', () => {
        it('should block an IP address', async () => {
            (db.blockedIP.findFirst as jest.Mock).mockResolvedValue(null);
            (db.whitelistedIP.findFirst as jest.Mock).mockResolvedValue(null);
            (db.blockedIP.create as jest.Mock).mockResolvedValue({});

            await autoBlockOnAbuse('192.168.1.1', 3600);

            expect(db.blockedIP.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    ip: '192.168.1.1',
                    reason: expect.stringContaining('Auto-blocked'),
                }),
            });
        });

        it('should not block if IP is already blocked', async () => {
            (db.blockedIP.findFirst as jest.Mock).mockResolvedValue({
                id: 1,
                ip: '192.168.1.1',
            });

            await autoBlockOnAbuse('192.168.1.1', 3600);

            expect(db.blockedIP.create).not.toHaveBeenCalled();
        });

        it('should not block if IP is whitelisted', async () => {
            (db.blockedIP.findFirst as jest.Mock).mockResolvedValue(null);
            (db.whitelistedIP.findFirst as jest.Mock).mockResolvedValue({
                id: 1,
                ip: '192.168.1.1',
            });

            await autoBlockOnAbuse('192.168.1.1', 3600);

            expect(db.blockedIP.create).not.toHaveBeenCalled();
        });

        it('should set expiration time for temporary blocks', async () => {
            (db.blockedIP.findFirst as jest.Mock).mockResolvedValue(null);
            (db.whitelistedIP.findFirst as jest.Mock).mockResolvedValue(null);
            (db.blockedIP.create as jest.Mock).mockResolvedValue({});

            await autoBlockOnAbuse('192.168.1.1', 3600);

            // Verify the IP was blocked with expiration time
            expect(db.blockedIP.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    ip: '192.168.1.1',
                    reason: expect.stringContaining('Auto-blocked'),
                    expiresAt: expect.any(Date),
                }),
            });

            // Verify expiresAt is approximately 1 hour from now
            const call = (db.blockedIP.create as jest.Mock).mock.calls[0][0];
            const expiresAt = call.data.expiresAt;
            const expectedTime = Date.now() + 3600 * 1000;
            expect(expiresAt.getTime()).toBeGreaterThan(expectedTime - 1000);
            expect(expiresAt.getTime()).toBeLessThan(expectedTime + 1000);
        });
    });

    describe('blockIP', () => {
        it('should manually block an IP', async () => {
            (db.blockedIP.create as jest.Mock).mockResolvedValue({});

            await blockIP('10.0.0.1', 'Suspicious activity');

            expect(db.blockedIP.create).toHaveBeenCalledWith({
                data: {
                    ip: '10.0.0.1',
                    reason: 'Suspicious activity',
                },
            });
        });

        it('should use default reason if not provided', async () => {
            (db.blockedIP.create as jest.Mock).mockResolvedValue({});

            await blockIP('10.0.0.1');

            expect(db.blockedIP.create).toHaveBeenCalledWith({
                data: {
                    ip: '10.0.0.1',
                    reason: 'Manually blocked',
                },
            });
        });
    });

    describe('unblockIP', () => {
        it('should unblock an IP address', async () => {
            (db.blockedIP.deleteMany as jest.Mock).mockResolvedValue({});

            await unblockIP('192.168.1.1');

            expect(db.blockedIP.deleteMany).toHaveBeenCalledWith({
                where: { ip: '192.168.1.1' },
            });
        });
    });

    describe('isIPBlocked', () => {
        it('should return true if IP is blocked and not expired', async () => {
            (db.blockedIP.findFirst as jest.Mock).mockResolvedValue({
                id: 1,
                ip: '192.168.1.1',
                expiresAt: new Date(Date.now() + 3600000), // Expires in 1 hour
            });

            const result = await isIPBlocked('192.168.1.1');

            expect(result).toBe(true);
        });

        it('should return false if IP is not blocked', async () => {
            (db.blockedIP.findFirst as jest.Mock).mockResolvedValue(null);

            const result = await isIPBlocked('192.168.1.1');

            expect(result).toBe(false);
        });

        it('should clean up expired blocks and return false', async () => {
            (db.blockedIP.findFirst as jest.Mock).mockResolvedValue({
                id: 1,
                ip: '192.168.1.1',
                expiresAt: new Date(Date.now() - 3600000), // Expired 1 hour ago
            });
            (db.blockedIP.deleteMany as jest.Mock).mockResolvedValue({});

            const result = await isIPBlocked('192.168.1.1');

            expect(result).toBe(false);
            expect(db.blockedIP.deleteMany).toHaveBeenCalledWith({
                where: { ip: '192.168.1.1' },
            });
        });

        it('should return true if IP is blocked with no expiration', async () => {
            (db.blockedIP.findFirst as jest.Mock).mockResolvedValue({
                id: 1,
                ip: '192.168.1.1',
                expiresAt: null,
            });

            const result = await isIPBlocked('192.168.1.1');

            expect(result).toBe(true);
        });
    });

    describe('isIPWhitelisted', () => {
        it('should return true if IP is whitelisted', async () => {
            (db.whitelistedIP.findFirst as jest.Mock).mockResolvedValue({
                id: 1,
                ip: '192.168.1.1',
            });

            const result = await isIPWhitelisted('192.168.1.1');

            expect(result).toBe(true);
        });

        it('should return false if IP is not whitelisted', async () => {
            (db.whitelistedIP.findFirst as jest.Mock).mockResolvedValue(null);

            const result = await isIPWhitelisted('192.168.1.1');

            expect(result).toBe(false);
        });
    });

    describe('cleanupExpiredBlocks', () => {
        it('should delete expired blocks', async () => {
            (db.blockedIP.deleteMany as jest.Mock).mockResolvedValue({
                count: 3,
            });

            const result = await cleanupExpiredBlocks();

            expect(result).toBe(3);
            expect(db.blockedIP.deleteMany).toHaveBeenCalledWith({
                where: {
                    expiresAt: {
                        lt: expect.any(Date),
                    },
                },
            });
        });

        it('should return 0 if no expired blocks found', async () => {
            (db.blockedIP.deleteMany as jest.Mock).mockResolvedValue({
                count: 0,
            });

            const result = await cleanupExpiredBlocks();

            expect(result).toBe(0);
        });
    });
});
