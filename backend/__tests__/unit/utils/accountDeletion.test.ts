import { db } from '../../../src/db';
import {
    processPendingDeletions,
    deleteUserAccount,
    getPendingDeletions,
} from '../../../src/utils/accountDeletion';

// Mock the database
jest.mock('../../../src/db', () => ({
    db: {
        deletionRequest: {
            findMany: jest.fn(),
            update: jest.fn(),
        },
        user: {
            delete: jest.fn(),
        },
        presenceEvent: {
            deleteMany: jest.fn(),
        },
        messageEvent: {
            deleteMany: jest.fn(),
        },
        typingEvent: {
            deleteMany: jest.fn(),
        },
        joinEvent: {
            deleteMany: jest.fn(),
        },
        roleChangeEvent: {
            deleteMany: jest.fn(),
        },
        deletedMessageEvent: {
            deleteMany: jest.fn(),
        },
        reactionTime: {
            deleteMany: jest.fn(),
        },
        auditLog: {
            create: jest.fn(),
        },
    },
}));

// Mock the audit log utility
jest.mock('../../../src/utils/auditLog', () => ({
    AuditAction: {
        ACCOUNT_DELETED: 'ACCOUNT_DELETED',
    },
    createAuditLog: jest.fn(),
}));

describe('Account Deletion', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('processPendingDeletions', () => {
        it('should process pending deletions', async () => {
            const mockDeletions = [
                {
                    id: 'deletion-1',
                    userId: 'user-123',
                    user: {
                        id: 'user-123',
                        discordId: 'discord-123',
                    },
                    status: 'PENDING',
                    scheduledFor: new Date(Date.now() - 1000),
                },
            ];

            (db.deletionRequest.findMany as jest.Mock).mockResolvedValue(
                mockDeletions
            );
            (db.deletionRequest.update as jest.Mock).mockResolvedValue({});
            (db.user.delete as jest.Mock).mockResolvedValue({});
            (db.presenceEvent.deleteMany as jest.Mock).mockResolvedValue({});
            (db.messageEvent.deleteMany as jest.Mock).mockResolvedValue({});
            (db.typingEvent.deleteMany as jest.Mock).mockResolvedValue({});
            (db.joinEvent.deleteMany as jest.Mock).mockResolvedValue({});
            (db.roleChangeEvent.deleteMany as jest.Mock).mockResolvedValue({});
            (db.deletedMessageEvent.deleteMany as jest.Mock).mockResolvedValue(
                {}
            );
            (db.reactionTime.deleteMany as jest.Mock).mockResolvedValue({});

            const results = await processPendingDeletions();

            expect(results.processed).toBe(1);
            expect(results.errors).toBe(0);
            expect(db.user.delete).toHaveBeenCalledWith({
                where: { id: 'user-123' },
            });
        });

        it('should handle errors gracefully', async () => {
            const mockDeletions = [
                {
                    id: 'deletion-1',
                    userId: 'user-123',
                    user: {
                        id: 'user-123',
                        discordId: 'discord-123',
                    },
                    status: 'PENDING',
                    scheduledFor: new Date(Date.now() - 1000),
                },
            ];

            (db.deletionRequest.findMany as jest.Mock).mockResolvedValue(
                mockDeletions
            );
            (db.user.delete as jest.Mock).mockRejectedValue(
                new Error('Delete failed')
            );

            const results = await processPendingDeletions();

            expect(results.processed).toBe(0);
            expect(results.errors).toBe(1);
        });
    });

    describe('deleteUserAccount', () => {
        it('should delete all user data', async () => {
            (db.presenceEvent.deleteMany as jest.Mock).mockResolvedValue({});
            (db.messageEvent.deleteMany as jest.Mock).mockResolvedValue({});
            (db.typingEvent.deleteMany as jest.Mock).mockResolvedValue({});
            (db.joinEvent.deleteMany as jest.Mock).mockResolvedValue({});
            (db.roleChangeEvent.deleteMany as jest.Mock).mockResolvedValue({});
            (db.deletedMessageEvent.deleteMany as jest.Mock).mockResolvedValue(
                {}
            );
            (db.reactionTime.deleteMany as jest.Mock).mockResolvedValue({});
            (db.user.delete as jest.Mock).mockResolvedValue({});

            await deleteUserAccount('user-123', 'discord-123');

            expect(db.presenceEvent.deleteMany).toHaveBeenCalledWith({
                where: { userId: 'discord-123' },
            });
            expect(db.user.delete).toHaveBeenCalledWith({
                where: { id: 'user-123' },
            });
        });

        it('should throw on failure', async () => {
            (db.user.delete as jest.Mock).mockRejectedValue(
                new Error('Delete failed')
            );

            await expect(
                deleteUserAccount('user-123', 'discord-123')
            ).rejects.toThrow('Delete failed');
        });
    });

    describe('getPendingDeletions', () => {
        it('should return pending deletions', async () => {
            const mockDeletions = [
                {
                    id: 'deletion-1',
                    userId: 'user-123',
                    user: {
                        discordId: 'discord-123',
                        username: 'testuser',
                        email: 'test@example.com',
                    },
                    reason: 'User requested deletion',
                    requestedAt: new Date(),
                    scheduledFor: new Date(),
                    status: 'PENDING',
                },
            ];

            (db.deletionRequest.findMany as jest.Mock).mockResolvedValue(
                mockDeletions
            );

            const deletions = await getPendingDeletions();

            expect(db.deletionRequest.findMany).toHaveBeenCalledWith({
                where: { status: 'PENDING' },
                include: {
                    user: {
                        select: {
                            discordId: true,
                            username: true,
                            email: true,
                        },
                    },
                },
                orderBy: { scheduledFor: 'asc' },
            });
            expect(deletions).toEqual(mockDeletions);
        });
    });
});
