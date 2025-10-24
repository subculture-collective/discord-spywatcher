import { db } from '../../../src/db';
import {
    initializeRetentionPolicies,
    getRetentionPolicy,
    updateRetentionPolicy,
    cleanupOldData,
    getAllRetentionPolicies,
    DataType,
} from '../../../src/utils/dataRetention';

// Mock the database
jest.mock('../../../src/db', () => ({
    db: {
        dataRetentionPolicy: {
            upsert: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
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
        deletedMessageEvent: {
            deleteMany: jest.fn(),
        },
        joinEvent: {
            deleteMany: jest.fn(),
        },
        reactionTime: {
            deleteMany: jest.fn(),
        },
        roleChangeEvent: {
            deleteMany: jest.fn(),
        },
        session: {
            deleteMany: jest.fn(),
        },
        auditLog: {
            deleteMany: jest.fn(),
        },
    },
}));

describe('Data Retention', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('initializeRetentionPolicies', () => {
        it('should initialize default retention policies', async () => {
            (db.dataRetentionPolicy.upsert as jest.Mock).mockResolvedValue({});

            await initializeRetentionPolicies();

            expect(db.dataRetentionPolicy.upsert).toHaveBeenCalledTimes(9);
            expect(db.dataRetentionPolicy.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { dataType: DataType.PRESENCE_EVENTS },
                    create: expect.objectContaining({
                        retentionDays: 90,
                    }),
                })
            );
        });
    });

    describe('getRetentionPolicy', () => {
        it('should return a retention policy', async () => {
            const mockPolicy = {
                id: 'policy-1',
                dataType: DataType.MESSAGE_EVENTS,
                retentionDays: 90,
                enabled: true,
            };

            (db.dataRetentionPolicy.findUnique as jest.Mock).mockResolvedValue(
                mockPolicy
            );

            const policy = await getRetentionPolicy(DataType.MESSAGE_EVENTS);

            expect(db.dataRetentionPolicy.findUnique).toHaveBeenCalledWith({
                where: { dataType: DataType.MESSAGE_EVENTS },
            });
            expect(policy).toEqual(mockPolicy);
        });
    });

    describe('updateRetentionPolicy', () => {
        it('should update a retention policy', async () => {
            (db.dataRetentionPolicy.upsert as jest.Mock).mockResolvedValue({});

            await updateRetentionPolicy(DataType.SESSIONS, 30, false);

            expect(db.dataRetentionPolicy.upsert).toHaveBeenCalledWith({
                where: { dataType: DataType.SESSIONS },
                update: {
                    retentionDays: 30,
                    enabled: false,
                },
                create: {
                    dataType: DataType.SESSIONS,
                    retentionDays: 30,
                    enabled: false,
                },
            });
        });
    });

    describe('cleanupOldData', () => {
        it('should clean up old data based on retention policies', async () => {
            const mockPolicies = [
                {
                    dataType: DataType.MESSAGE_EVENTS,
                    retentionDays: 90,
                    enabled: true,
                },
                {
                    dataType: DataType.SESSIONS,
                    retentionDays: 30,
                    enabled: true,
                },
            ];

            (db.dataRetentionPolicy.findMany as jest.Mock).mockResolvedValue(
                mockPolicies
            );
            (db.messageEvent.deleteMany as jest.Mock).mockResolvedValue({
                count: 100,
            });
            (db.session.deleteMany as jest.Mock).mockResolvedValue({
                count: 50,
            });
            (db.dataRetentionPolicy.update as jest.Mock).mockResolvedValue({});

            const results = await cleanupOldData();

            expect(results[DataType.MESSAGE_EVENTS]).toBe(100);
            expect(results[DataType.SESSIONS]).toBe(50);
            expect(db.dataRetentionPolicy.update).toHaveBeenCalledTimes(2);
        });

        it('should handle unknown data types gracefully', async () => {
            const mockPolicies = [
                {
                    dataType: 'UNKNOWN_TYPE',
                    retentionDays: 90,
                    enabled: true,
                },
            ];

            (db.dataRetentionPolicy.findMany as jest.Mock).mockResolvedValue(
                mockPolicies
            );

            const results = await cleanupOldData();

            expect(results).toEqual({});
        });
    });

    describe('getAllRetentionPolicies', () => {
        it('should return all retention policies', async () => {
            const mockPolicies = [
                {
                    id: 'policy-1',
                    dataType: DataType.MESSAGE_EVENTS,
                    retentionDays: 90,
                    description: 'Message events retention',
                    enabled: true,
                    lastCleanupAt: null,
                },
            ];

            (db.dataRetentionPolicy.findMany as jest.Mock).mockResolvedValue(
                mockPolicies
            );

            const policies = await getAllRetentionPolicies();

            expect(db.dataRetentionPolicy.findMany).toHaveBeenCalledWith({
                orderBy: { dataType: 'asc' },
            });
            expect(policies).toEqual(mockPolicies);
        });
    });
});
